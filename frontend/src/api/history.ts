import { apiFetch } from "./http";

/** Wire shapes from /v1/history/* — validate mood ids in composable via parseMoodId. */

export interface CalendarDay {
  day: string;
  has_chat: boolean;
  session_count: number;
  mood: string | null;
  mood_label: string | null;
}

export interface CalendarMonth {
  month: string;
  days: CalendarDay[];
}

export interface DaySession {
  id: string;
  title: string;
  companion_id: string;
  updated_at: number;
  message_count_that_day: number;
}

export interface DaySessions {
  day: string;
  mood: string | null;
  mood_label: string | null;
  sessions: DaySession[];
}

export function fetchHistoryCalendar(month: string) {
  return apiFetch<CalendarMonth>(
    `/v1/history/calendar?month=${encodeURIComponent(month)}`,
  );
}

export function fetchDaySessions(day: string) {
  return apiFetch<DaySessions>(
    `/v1/history/days/${encodeURIComponent(day)}/sessions`,
  );
}
