import { apiFetch } from "./http";

/** Wire shape from GET|PUT /v1/mood/today (ids validated in UI via moodOptions.parseMoodId). */
export interface MoodToday {
  day: string;
  mood: string | null;
  label: string | null;
}

export function fetchTodayMood() {
  return apiFetch<MoodToday>("/v1/mood/today");
}

export function putTodayMood(mood: string) {
  return apiFetch<MoodToday>("/v1/mood/today", {
    method: "PUT",
    body: JSON.stringify({ mood }),
  });
}
