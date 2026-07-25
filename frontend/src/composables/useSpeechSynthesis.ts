import { ref } from "vue";
import { synthesizeSpeech } from "@/api/speech";
import { speechSynthesisSupported, SPEECH_SPEAK_MAX_CHARS } from "@/utils/voice/browser";
import {
  clampPitch,
  clampRate,
  pickCompanionVoice,
  voiceProfileFor,
} from "@/utils/voice/companionVoice";

let voicesListenerAttached = false;

export function useSpeechSynthesis() {
  const supported = speechSynthesisSupported() || typeof Audio !== "undefined";
  const speaking = ref(false);
  const error = ref("");
  let speakTimer: number | null = null;
  /** Bumps on every stop/speak so stale utterance callbacks cannot clobber the new read. */
  let speakGen = 0;
  let audioEl: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;

  function clearError() {
    error.value = "";
  }

  function clearSpeakTimer() {
    if (speakTimer !== null) {
      window.clearTimeout(speakTimer);
      speakTimer = null;
    }
  }

  function revokeObjectUrl() {
    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        /* ignore */
      }
      objectUrl = null;
    }
  }

  function stopCloudAudio() {
    if (audioEl) {
      try {
        audioEl.pause();
        audioEl.removeAttribute("src");
        audioEl.load();
      } catch {
        /* ignore */
      }
      audioEl = null;
    }
    revokeObjectUrl();
  }

  function ensureVoices(): SpeechSynthesisVoice[] {
    if (!speechSynthesisSupported()) return [];
    if (!voicesListenerAttached) {
      voicesListenerAttached = true;
      try {
        window.speechSynthesis.addEventListener("voiceschanged", () => {
          /* voices populate asynchronously in Chromium */
        });
      } catch {
        /* older engines */
      }
    }
    return window.speechSynthesis.getVoices();
  }

  function stop() {
    clearSpeakTimer();
    speakGen += 1;
    stopCloudAudio();
    if (speechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        /* ignore */
      }
    }
    speaking.value = false;
  }

  function speakBrowser(text: string, companionId: string | null | undefined, gen: number) {
    if (!speechSynthesisSupported()) {
      if (gen === speakGen) {
        speaking.value = false;
        error.value = "当前浏览器暂不支持朗读";
      }
      return;
    }

    const profile = voiceProfileFor(companionId);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = clampRate(profile.rate);
    u.pitch = clampPitch(profile.pitch);
    const voice = pickCompanionVoice(companionId, ensureVoices());
    if (voice) {
      u.voice = voice;
      if (voice.lang) u.lang = voice.lang;
    }

    u.onend = () => {
      if (gen !== speakGen) return;
      speaking.value = false;
    };
    u.onerror = (ev) => {
      if (gen !== speakGen) return;
      speaking.value = false;
      const code = String((ev as SpeechSynthesisErrorEvent).error || "");
      if (code === "interrupted" || code === "canceled" || code === "cancelled") {
        return;
      }
      error.value = "现在读不了，稍后再试";
    };

    speaking.value = true;
    speakTimer = window.setTimeout(() => {
      speakTimer = null;
      if (gen !== speakGen) return;
      try {
        if (!u.voice) {
          const late = pickCompanionVoice(companionId, ensureVoices());
          if (late) {
            u.voice = late;
            if (late.lang) u.lang = late.lang;
          }
        }
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(u);
      } catch {
        if (gen !== speakGen) return;
        speaking.value = false;
        error.value = "现在读不了，稍后再试";
      }
    }, 80);
  }

  async function speakCloud(text: string, companionId: string | null | undefined, gen: number) {
    // Keep speaking=true across the network wait so ChatView index watch does not clear.
    speaking.value = true;
    try {
      const blob = await synthesizeSpeech(text, companionId || "nuan");
      if (gen !== speakGen) return;
      if (!blob.size) {
        speakBrowser(text, companionId, gen);
        return;
      }
      revokeObjectUrl();
      objectUrl = URL.createObjectURL(blob);
      const el = new Audio(objectUrl);
      audioEl = el;
      el.onended = () => {
        if (gen !== speakGen) return;
        speaking.value = false;
        stopCloudAudio();
      };
      el.onerror = () => {
        if (gen !== speakGen) return;
        stopCloudAudio();
        speakBrowser(text, companionId, gen);
      };
      await el.play();
      if (gen !== speakGen) {
        stopCloudAudio();
      }
    } catch {
      if (gen !== speakGen) return;
      stopCloudAudio();
      // Any cloud failure → browser fallback.
      speakBrowser(text, companionId, gen);
    }
  }

  function speak(text: string, companionId?: string | null) {
    error.value = "";
    let t = text.trim();
    if (!t) return;
    if (t.length > SPEECH_SPEAK_MAX_CHARS) {
      t = `${t.slice(0, SPEECH_SPEAK_MAX_CHARS)}…`;
    }

    stop();
    const gen = (speakGen += 1);
    // Mark busy immediately (before async scheduling) for UI watchers.
    speaking.value = true;
    void speakCloud(t, companionId, gen);
  }

  return { supported, speaking, error, clearError, speak, stop };
}
