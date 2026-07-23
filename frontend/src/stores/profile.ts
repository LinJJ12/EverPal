import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Companion, Mode, Profile } from "@/types";
import { fetchCompanions } from "@/api/companions";
import { fetchProfile, patchProfile } from "@/api/profile";
import { LIKE_OPTIONS } from "@/types";

export const useProfileStore = defineStore("profile", () => {
  const nickname = ref("");
  const mode = ref<Mode>("child");
  const companionId = ref("nuan");
  const likes = ref<string[]>([]);
  const memories = ref<Profile["memories"]>([]);
  const companions = ref<Companion[]>([]);
  const sessionId = ref<string | null>(null);
  const ready = ref(false);

  const companion = computed(
    () => companions.value.find((c) => c.id === companionId.value) || companions.value[0],
  );

  const likeLabels = computed(() =>
    likes.value
      .map((id) => LIKE_OPTIONS.find((x) => x.id === id || x.label === id)?.label || id)
      .filter(Boolean),
  );

  function applyModeChrome() {
    const m = mode.value === "adult" ? "adult" : "child";
    document.documentElement.setAttribute("data-mode", m);
    document.documentElement.setAttribute("data-demo-mode", m);
  }

  async function hydrate() {
    try {
      companions.value = await fetchCompanions();
    } catch {
      companions.value = [
        { id: "nuan", name: "小暖", role: "温柔陪伴型", blurb: "耐心鼓励" },
        { id: "tiao", name: "跳跳", role: "活泼玩伴型", blurb: "爱提问" },
        { id: "cha", name: "阿茶", role: "稳重听友型", blurb: "多倾听" },
      ];
    }
    try {
      const p = await fetchProfile();
      nickname.value = p.nickname || "";
      mode.value = (p.mode as Mode) || "child";
      companionId.value = p.companion_id || "nuan";
      likes.value = p.likes || [];
      memories.value = p.memories || [];
    } catch {
      /* offline / first run */
    }
    applyModeChrome();
    ready.value = true;
  }

  async function save(partial: Partial<Pick<Profile, "nickname" | "mode" | "companion_id" | "likes">>) {
    if (partial.nickname !== undefined) nickname.value = partial.nickname;
    if (partial.mode !== undefined) mode.value = partial.mode;
    if (partial.companion_id !== undefined) companionId.value = partial.companion_id;
    if (partial.likes !== undefined) likes.value = partial.likes;
    applyModeChrome();
    const p = await patchProfile({
      nickname: nickname.value,
      mode: mode.value,
      companion_id: companionId.value,
      likes: likes.value,
    });
    memories.value = p.memories || memories.value;
  }

  return {
    nickname,
    mode,
    companionId,
    likes,
    memories,
    companions,
    companion,
    likeLabels,
    sessionId,
    ready,
    hydrate,
    save,
    applyModeChrome,
  };
});
