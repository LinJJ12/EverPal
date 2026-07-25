import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  fetchDaySessions,
  fetchHistoryCalendar,
  type CalendarDay,
  type DaySession,
} from "@/api/history";
import { deleteSession } from "@/api/sessions";
import { parseMoodId, type MoodId } from "@/components/mood/moodOptions";
import { useProfileStore } from "@/stores/profile";
import { forgetSessionId } from "@/utils/activeSession";
import { friendlyError } from "@/utils/errors";
import { cnTodayKey } from "@/utils/timeCn";

const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const;

export interface CalendarCell {
  day: string | null;
  inMonth: boolean;
  meta: CalendarDay | null;
  interactive: boolean;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function monthKey(y: number, m: number) {
  return `${y}-${pad2(m)}`;
}

/** Monday-first offset: Mon=0 … Sun=6 */
function mondayIndex(jsDay: number) {
  return (jsDay + 6) % 7;
}

export function buildMonthGrid(month: string, byDay: Map<string, CalendarDay>): CalendarCell[] {
  const [ys, ms] = month.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!y || !m) return [];
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = mondayIndex(first.getUTCDay());
  const cells: CalendarCell[] = [];
  for (let i = 0; i < lead; i++) {
    cells.push({ day: null, inMonth: false, meta: null, interactive: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${y}-${pad2(m)}-${pad2(d)}`;
    const meta = byDay.get(key) ?? null;
    const interactive = Boolean(meta && (meta.has_chat || meta.mood));
    cells.push({ day: key, inMonth: true, meta, interactive });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, inMonth: false, meta: null, interactive: false });
  }
  return cells;
}

function clearDayPanel(
  selectedDay: { value: string | null },
  daySessions: { value: DaySession[] },
  dayMood: { value: MoodId | null },
  dayMoodLabel: { value: string | null },
  dayErr: { value: string },
) {
  selectedDay.value = null;
  daySessions.value = [];
  dayMood.value = null;
  dayMoodLabel.value = null;
  dayErr.value = "";
}

export function useHistoryCalendar() {
  const store = useProfileStore();
  const today = ref(cnTodayKey());
  const [ty, tm] = today.value.split("-").map(Number);
  const year = ref(ty);
  const month = ref(tm);
  const monthStr = computed(() => monthKey(year.value, month.value));
  const weekdayLabels = WEEKDAYS;

  const loading = ref(false);
  const err = ref("");
  const days = ref<CalendarDay[]>([]);
  const byDay = computed(() => {
    const map = new Map<string, CalendarDay>();
    for (const d of days.value) {
      map.set(d.day, { ...d, mood: parseMoodId(d.mood) });
    }
    return map;
  });
  const cells = computed(() => buildMonthGrid(monthStr.value, byDay.value));

  const selectedDay = ref<string | null>(null);
  const dayLoading = ref(false);
  const dayErr = ref("");
  const dayMood = ref<MoodId | null>(null);
  const dayMoodLabel = ref<string | null>(null);
  const daySessions = ref<DaySession[]>([]);
  const deletingId = ref<string | null>(null);
  let monthReq = 0;
  let dayReq = 0;

  function refreshToday() {
    today.value = cnTodayKey();
  }

  function dropDayPanelIfOutsideMonth() {
    if (selectedDay.value && selectedDay.value.slice(0, 7) !== monthStr.value) {
      clearDayPanel(selectedDay, daySessions, dayMood, dayMoodLabel, dayErr);
    }
  }

  async function loadMonth() {
    const req = ++monthReq;
    refreshToday();
    dropDayPanelIfOutsideMonth();
    loading.value = true;
    err.value = "";
    try {
      const res = await fetchHistoryCalendar(monthStr.value);
      if (req !== monthReq) return;
      days.value = (res.days || []).map((d) => ({
        ...d,
        mood: parseMoodId(d.mood),
      }));
      if (!(selectedDay.value && selectedDay.value.slice(0, 7) === monthStr.value)) {
        clearDayPanel(selectedDay, daySessions, dayMood, dayMoodLabel, dayErr);
      }
    } catch (e) {
      if (req !== monthReq) return;
      err.value = friendlyError(e);
      days.value = [];
    } finally {
      if (req === monthReq) loading.value = false;
    }
  }

  async function selectDay(day: string) {
    const meta = byDay.value.get(day);
    if (!meta || (!meta.has_chat && !meta.mood)) return;
    const req = ++dayReq;
    selectedDay.value = day;
    dayLoading.value = true;
    dayErr.value = "";
    try {
      const res = await fetchDaySessions(day);
      if (req !== dayReq) return;
      dayMood.value = parseMoodId(res.mood);
      dayMoodLabel.value = res.mood_label ?? null;
      daySessions.value = res.sessions || [];
    } catch (e) {
      if (req !== dayReq) return;
      dayErr.value = friendlyError(e);
      daySessions.value = [];
    } finally {
      if (req === dayReq) dayLoading.value = false;
    }
  }

  function prevMonth() {
    clearDayPanel(selectedDay, daySessions, dayMood, dayMoodLabel, dayErr);
    if (month.value === 1) {
      year.value -= 1;
      month.value = 12;
    } else {
      month.value -= 1;
    }
  }

  function nextMonth() {
    clearDayPanel(selectedDay, daySessions, dayMood, dayMoodLabel, dayErr);
    if (month.value === 12) {
      year.value += 1;
      month.value = 1;
    } else {
      month.value += 1;
    }
  }

  async function removeSession(id: string) {
    if (!id || deletingId.value) return;
    if (!confirm("删除这个会话？删掉后不能恢复。")) return;
    deletingId.value = id;
    dayErr.value = "";
    const kept = daySessions.value.filter((s) => s.id !== id);
    daySessions.value = kept;
    try {
      await deleteSession(id);
    } catch (e) {
      dayErr.value = friendlyError(e);
      if (selectedDay.value) await selectDay(selectedDay.value);
      deletingId.value = null;
      return;
    }
    forgetSessionId(id);
    if (store.sessionId === id) store.sessionId = null;
    const day = selectedDay.value;
    try {
      await loadMonth();
      if (!day) return;
      const meta = byDay.value.get(day);
      if (meta && (meta.has_chat || meta.mood)) {
        await selectDay(day);
      } else {
        clearDayPanel(selectedDay, daySessions, dayMood, dayMoodLabel, dayErr);
      }
    } catch (e) {
      dayErr.value = friendlyError(e);
      try {
        await loadMonth();
      } catch {
        /* already reported */
      }
    } finally {
      deletingId.value = null;
    }
  }

  function onVisibility() {
    if (document.visibilityState === "visible") refreshToday();
  }

  onMounted(() => {
    document.addEventListener("visibilitychange", onVisibility);
  });
  onUnmounted(() => {
    document.removeEventListener("visibilitychange", onVisibility);
  });

  watch(monthStr, () => {
    void loadMonth();
  }, { immediate: true });

  return {
    today,
    year,
    month,
    monthStr,
    weekdayLabels,
    loading,
    err,
    cells,
    selectedDay,
    dayLoading,
    dayErr,
    dayMood,
    dayMoodLabel,
    daySessions,
    deletingId,
    loadMonth,
    selectDay,
    removeSession,
    prevMonth,
    nextMonth,
  };
}
