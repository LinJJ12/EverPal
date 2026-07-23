import { apiFetch } from "./http";
import type { SessionSummary } from "@/types";

export function listSessions() {
  return apiFetch<{ sessions: SessionSummary[] }>("/v1/sessions");
}

export function getSession(id: string) {
  return apiFetch<SessionSummary>(`/v1/sessions/${id}`);
}

export function deleteSession(id: string) {
  return apiFetch<{ ok: boolean }>(`/v1/sessions/${id}`, { method: "DELETE" });
}
