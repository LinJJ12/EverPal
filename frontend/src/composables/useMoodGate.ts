import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { fetchTodayMood, putTodayMood } from "@/api/mood";
import {
  cnTodayKey,
  moodOption,
  parseMoodId,
  type MoodId,
} from "@/components/mood/moodOptions";
import { friendlyError } from "@/utils/errors";

/**
 * Daily mood gate for /chat: fetch → optional overlay → then allow chat bootstrap.
 * Pass `onReadyToChat` (e.g. session/seed bootstrap); it runs once after the gate clears.
 */
export function useMoodGate(opts: { onReadyToChat: () => void | Promise<void> }) {
  /** null = still loading mood; true = need gate; false = done for today. */
  const moodGateNeeded = ref<boolean | null>(null);
  const moodBusy = ref(false);
  const moodError = ref("");
  const todayMoodLabel = ref("");
  const todayMoodId = ref<MoodId | null>(null);
  const moodDayKey = ref("");
  const moodEditorOpen = ref(false);
  /** Soft-fail recovery: API down skipped the gate; still offer a chip to set mood. */
  const moodFetchFailed = ref(false);

  const moodBlocksChat = computed(
    () => moodGateNeeded.value === null || moodGateNeeded.value === true || moodEditorOpen.value,
  );

  const moodChipEmoji = computed(() => moodOption(todayMoodId.value)?.emoji || "🌤️");

  let chatBootstrapped = false;
  /** Sync latch so watch + onMoodPick cannot double-fire bootstrap. */
  let bootstrapStarted = false;

  function clearTodayMoodLocal() {
    todayMoodId.value = null;
    todayMoodLabel.value = "";
  }

  /** True when cached server day is behind CN+8 "today" (tab slept past midnight). */
  function calendarRolled(): boolean {
    return !!moodDayKey.value && moodDayKey.value !== cnTodayKey();
  }

  async function maybeBootstrapChat() {
    if (chatBootstrapped || bootstrapStarted) return;
    // Wait until mood GET resolved and first-day gate is not required.
    if (moodGateNeeded.value === null || moodGateNeeded.value === true) return;
    bootstrapStarted = true;
    try {
      await opts.onReadyToChat();
      chatBootstrapped = true;
    } catch {
      bootstrapStarted = false;
      /* allow retry after transient failure */
    }
  }

  async function refreshTodayMood() {
    moodError.value = "";
    moodFetchFailed.value = false;
    try {
      const m = await fetchTodayMood();
      moodDayKey.value = m.day || "";
      const mid = parseMoodId(m.mood);
      if (mid) {
        todayMoodId.value = mid;
        todayMoodLabel.value = m.label || moodOption(mid)?.label || mid;
        moodGateNeeded.value = false;
      } else {
        clearTodayMoodLocal();
        moodGateNeeded.value = true;
      }
    } catch (e) {
      // Soft-fail: do not hard-block chat if mood API is down — offer补选 chip instead.
      // If the calendar already rolled, drop yesterday's chip so we don't label it "今日".
      if (calendarRolled()) {
        clearTodayMoodLocal();
        moodDayKey.value = cnTodayKey();
      }
      moodGateNeeded.value = false;
      moodFetchFailed.value = true;
      moodError.value = friendlyError(e);
    }
  }

  async function onMoodPick(mood: MoodId) {
    moodBusy.value = true;
    moodError.value = "";
    try {
      const m = await putTodayMood(mood);
      const mid = parseMoodId(m.mood) || mood;
      todayMoodId.value = mid;
      todayMoodLabel.value = m.label || moodOption(mid)?.label || mood;
      moodDayKey.value = m.day || moodDayKey.value;
      moodGateNeeded.value = false;
      moodEditorOpen.value = false;
      moodFetchFailed.value = false;
      // Deterministic: bootstrap right after gate clears (don't rely only on watch flush).
      await maybeBootstrapChat();
    } catch (e) {
      moodError.value = friendlyError(e);
    } finally {
      moodBusy.value = false;
    }
  }

  function openMoodEditor() {
    moodEditorOpen.value = true;
  }

  function closeMoodEditor() {
    moodEditorOpen.value = false;
  }

  async function onMoodChipClick() {
    if (moodFetchFailed.value) {
      await refreshTodayMood();
      if (todayMoodLabel.value || moodGateNeeded.value === true) return;
    }
    openMoodEditor();
  }

  function onVisibilityMoodRefresh() {
    if (document.visibilityState !== "visible") return;
    if (moodBusy.value) return;
    // Don't soft-fail away an open first-day gate (refresh catch sets gateNeeded=false).
    if (moodGateNeeded.value === true || moodGateNeeded.value === null) return;
    // Tab slept past CN midnight: clear stale chip immediately, then re-fetch.
    if (calendarRolled()) {
      clearTodayMoodLocal();
    }
    void (async () => {
      await refreshTodayMood();
      await maybeBootstrapChat();
    })();
  }

  onMounted(async () => {
    await refreshTodayMood();
    await maybeBootstrapChat();
    document.addEventListener("visibilitychange", onVisibilityMoodRefresh);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("visibilitychange", onVisibilityMoodRefresh);
  });

  watch(moodGateNeeded, () => {
    void maybeBootstrapChat();
  });

  return {
    moodGateNeeded,
    moodBusy,
    moodError,
    todayMoodLabel,
    todayMoodId,
    moodDayKey,
    moodEditorOpen,
    moodFetchFailed,
    moodBlocksChat,
    moodChipEmoji,
    onMoodPick,
    openMoodEditor,
    closeMoodEditor,
    onMoodChipClick,
  };
}
