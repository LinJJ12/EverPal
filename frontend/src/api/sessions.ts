import { apiFetch } from "./http";
import type { SessionSummary } from "@/types";

export function listSessions() {
  return apiFetch<{ sessions: SessionSummary[] }>("/v1/sessions");
}

export function getSession(id: string) {
  // ids can come from the ?session= query — always encode before path join.
  return apiFetch<SessionSummary>(`/v1/sessions/${encodeURIComponent(id)}`);
}

export function deleteSession(id: string) {
  return apiFetch<{ ok: boolean }>(`/v1/sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
