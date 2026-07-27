import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import { useSpeechSynthesis } from "@/composables/useSpeechSynthesis";

type ChatMsg = { role: "user" | "assistant"; content: string; sources?: { title: string; url: string }[] };

/**
 * Bubble-level read-aloud controls for /chat (karaoke progress lives in useSpeechSynthesis).
 */
export function useChatSpeak(opts: {
  messages: Ref<ChatMsg[]>;
  streaming: Ref<boolean>;
  sessionLoading: Ref<boolean>;
  companionId: () => string;
}) {
  const tts = useSpeechSynthesis();
  const speakingIndex = ref<number | null>(null);

  function canSpeakMessage(index: number): boolean {
    if (!tts.supported || opts.streaming.value || opts.sessionLoading.value) return false;
    const m = opts.messages.value[index];
    if (!m || m.role !== "assistant") return false;
    if (!m.content.trim()) return false;
    if (opts.streaming.value && index === opts.messages.value.length - 1) return false;
    return true;
  }

  function startSpeakAt(index: number) {
    if (!canSpeakMessage(index)) return;
    const text = opts.messages.value[index]?.content?.trim();
    if (!text) return;
    if (tts.speaking.value) tts.stop();
    speakingIndex.value = index;
    tts.speak(text, opts.companionId());
  }

  function pauseSpeakAt(index: number) {
    if (speakingIndex.value !== index) return;
    tts.pause();
  }

  function resumeSpeakAt(index: number) {
    if (speakingIndex.value !== index) return;
    if (!tts.resume()) {
      startSpeakAt(index);
    }
  }

  function restartSpeakAt(index: number) {
    startSpeakAt(index);
  }

  function cancelSpeakAt(index: number) {
    if (speakingIndex.value !== index) return;
    speakingIndex.value = null;
    tts.stop();
  }

  function stopAllSpeak() {
    speakingIndex.value = null;
    tts.stop();
  }

  watch(opts.streaming, (busy) => {
    if (busy) stopAllSpeak();
  });

  watch(tts.speaking, (on) => {
    if (on) return;
    // speak() briefly sets speaking=false during cancel when switching bubbles;
    // defer so the new speak() can set speaking=true before we clear the index.
    queueMicrotask(() => {
      if (!tts.speaking.value) speakingIndex.value = null;
    });
  });

  onBeforeUnmount(() => {
    stopAllSpeak();
  });

  return {
    ttsSupported: tts.supported,
    speaking: tts.speaking,
    speakPaused: tts.paused,
    speakRatio: tts.progressRatio,
    ttsError: tts.error,
    speakingIndex,
    canSpeakMessage,
    startSpeakAt,
    pauseSpeakAt,
    resumeSpeakAt,
    restartSpeakAt,
    cancelSpeakAt,
    stopAllSpeak,
  };
}
