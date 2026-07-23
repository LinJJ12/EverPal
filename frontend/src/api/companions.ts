import { apiFetch } from "./http";
import type { Companion } from "@/types";

export function fetchCompanions() {
  return apiFetch<Companion[]>("/v1/companions");
}
