<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ApiError } from "@/api/http";
import { transcribeSpeech } from "@/api/speech";
import { useSpeechRecognition } from "@/composables/useSpeechRecognition";
import {
  extensionForMime,
  mediaRecorderSupported,
  pickRecorderMime,
} from "@/utils/voice/mediaRecorder";
import { sanitizeSpeechTranscript } from "@/utils/voice/browser";

const props = defineProps<{ disabled?: boolean; compact?: boolean }>();
const emit = defineEmits<{ transcript: [text: string]; error: [message: string] }>();

const idleLabel = computed(() => (props.compact ? "说话" : "点我说话"));
const busyLabel = computed(() => (props.compact ? "识别中" : "识别中…"));
const doneLabel = "说完了";
const unavailableLabel = computed(() => (props.compact ? "语音" : "语音不可用"));

const browser = useSpeechRecognition();
const cloudListening = ref(false);
const cloudBusy = ref(false);
const preferBrowser = ref(false);

let mediaStream: MediaStream | null = null;
let recorder: MediaRecorder | null = null;
let chunks: BlobPart[] = [];
let mime = "";
/** Bumps on abort so in-flight stop/transcribe results are ignored. */
let cloudGen = 0;

const canCloud = computed(() => mediaRecorderSupported() && !preferBrowser.value);
const supported = computed(() => canCloud.value || browser.supported);
const listening = computed(() => cloudListening.value || browser.listening.value);

watch(
  () => props.disabled,
  (d) => {
    if (d && listening.value) {
      void forceAbort();
    }
  },
);

function stopTracks() {
  if (mediaStream) {
    for (const t of mediaStream.getTracks()) {
      try {
        t.stop();
      } catch {
        /* ignore */
      }
    }
    mediaStream = null;
  }
}

function clearRecorder() {
  recorder = null;
  chunks = [];
  mime = "";
  stopTracks();
}

async function forceAbort() {
  cloudGen += 1;
  cloudBusy.value = false;
  if (cloudListening.value || recorder) {
    cloudListening.value = false;
    const rec = recorder;
    recorder = null;
    try {
      if (rec && rec.state !== "inactive") rec.stop();
    } catch {
      /* ignore */
    }
    clearRecorder();
  }
  browser.abort();
}

async function startCloud() {
  const gen = cloudGen;
  mime = pickRecorderMime();
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    if (gen !== cloudGen) return;
    preferBrowser.value = true;
    browser.start();
    if (browser.error.value) emit("error", browser.error.value);
    return;
  }
  if (gen !== cloudGen) {
    stopTracks();
    return;
  }
  chunks = [];
  try {
    recorder = mime
      ? new MediaRecorder(mediaStream, { mimeType: mime })
      : new MediaRecorder(mediaStream);
    mime = recorder.mimeType || mime || "audio/webm";
  } catch {
    stopTracks();
    preferBrowser.value = true;
    browser.start();
    if (browser.error.value) emit("error", browser.error.value);
    return;
  }
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };
  // Timeslice so some browsers flush chunks before stop.
  recorder.start(250);
  cloudListening.value = true;
}

function stopCloudRecording(gen: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const rec = recorder;
    if (!rec || rec.state === "inactive") {
      const blob = chunks.length ? new Blob(chunks, { type: mime || "audio/webm" }) : null;
      clearRecorder();
      cloudListening.value = false;
      resolve(gen === cloudGen ? blob : null);
      return;
    }
    rec.onstop = () => {
      const blob = chunks.length ? new Blob(chunks, { type: mime || "audio/webm" }) : null;
      clearRecorder();
      cloudListening.value = false;
      resolve(gen === cloudGen ? blob : null);
    };
    try {
      if (rec.state === "recording") {
        try {
          rec.requestData();
        } catch {
          /* optional */
        }
      }
      rec.stop();
    } catch {
      clearRecorder();
      cloudListening.value = false;
      resolve(null);
    }
  });
}

async function finishCloud() {
  const gen = cloudGen;
  cloudBusy.value = true;
  try {
    const blob = await stopCloudRecording(gen);
    if (gen !== cloudGen) return;
    if (!blob || blob.size < 32) {
      emit("error", "没听清，再点一次说话，或直接打字吧");
      return;
    }
    const filename = `talk.${extensionForMime(blob.type || mime)}`;
    try {
      const text = sanitizeSpeechTranscript(await transcribeSpeech(blob, filename));
      if (gen !== cloudGen) return;
      if (text) {
        emit("transcript", text);
      } else {
        emit("error", "没听清，再点一次说话，或直接打字吧");
      }
    } catch (e) {
      if (gen !== cloudGen) return;
      if (
        e instanceof ApiError &&
        (e.code === "speech_unavailable" || e.code === "network")
      ) {
        preferBrowser.value = true;
        emit(
          "error",
          e.code === "network"
            ? "连不上服务器，请再点一次用浏览器说话，或直接打字"
            : "云端听写暂不可用，请再点一次用浏览器说话，或直接打字",
        );
        return;
      }
      const msg = e instanceof ApiError ? e.message : "没听清，再试一次或打字吧";
      emit("error", msg);
    }
  } finally {
    if (gen === cloudGen) cloudBusy.value = false;
  }
}

async function onClick() {
  if (props.disabled || cloudBusy.value || !supported.value) return;

  if (listening.value) {
    if (cloudListening.value) {
      await finishCloud();
      return;
    }
    const text = await browser.stop();
    if (browser.error.value) {
      emit("error", browser.error.value);
      return;
    }
    if (text) {
      emit("transcript", text);
    } else {
      emit("error", "没听清，再点一次说话，或直接打字吧");
    }
    return;
  }

  browser.clearError();
  if (canCloud.value) {
    await startCloud();
    return;
  }
  if (browser.supported) {
    browser.start();
    if (browser.error.value) emit("error", browser.error.value);
  }
}

onBeforeUnmount(() => {
  void forceAbort();
});
</script>

<template>
  <button
    v-if="supported"
    type="button"
    class="btn btn-secondary voice-talk"
    :class="{ listening, compact: props.compact }"
    :disabled="disabled || cloudBusy"
    :aria-pressed="listening"
    :aria-label="listening ? doneLabel : idleLabel"
    @click="onClick"
  >
    {{ cloudBusy ? busyLabel : listening ? doneLabel : idleLabel }}
  </button>
  <button
    v-else
    type="button"
    class="btn btn-secondary voice-talk"
    :class="{ compact: props.compact }"
    disabled
    title="当前浏览器暂不支持语音，请打字聊"
    aria-label="语音不可用"
  >
    {{ unavailableLabel }}
  </button>
</template>
