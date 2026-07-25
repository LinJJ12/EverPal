import { apiFetch } from "./http";
import type { Profile } from "@/types";

export function fetchProfile() {
  return apiFetch<Profile>("/v1/profile");
}

export function patchProfile(body: Partial<Pick<Profile, "nickname" | "mode" | "companion_id" | "likes">>) {
  return apiFetch<Profile>("/v1/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function clearMemories() {
  return apiFetch<{ ok: boolean; cleared: number }>("/v1/profile/memories", {
    method: "DELETE",
  });
}

export function deleteMemory(memoryId: number) {
  return apiFetch<{ ok: boolean; id: number }>(`/v1/profile/memories/${memoryId}`, {
    method: "DELETE",
  });
}
