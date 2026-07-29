import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import type { Companion, Mode, Profile } from "@/types";
import { fetchCompanions } from "@/api/companions";
import { fetchProfile, patchProfile } from "@/api/profile";
import { ApiError } from "@/api/http";
import { LIKE_OPTIONS } from "@/types";
import { getActiveSessionId, setActiveSessionId } from "@/utils/activeSession";

export const useProfileStore = defineStore("profile", () => {
  const nickname = ref("");
  const mode = ref<Mode>("child");
  const companionId = ref("nuan");
  const likes = ref<string[]>([]);
  const memories = ref<Profile["memories"]>([]);
  const companions = ref<Companion[]>([]);
  const sessionId = ref<string | null>(getActiveSessionId());
  const ready = ref(false);
  /** True when first hydrate failed because the backend was unreachable. */
  const backendUnreachable = ref(false);

  watch(
    sessionId,
    (id) => {
      setActiveSessionId(id);
    },
    { flush: "sync" },
  );

  const companion = computed(
    () => companions.value.find((c) => c.id === companionId.value) || companions.value[0],
  );

  const likeLabels = computed(() =>
    likes.value
      .map((id) => LIKE_OPTIONS.find((x) => x.id === id || x.label === id)?.label || id)
      .filter(Boolean),
  );

  function applyModeChrome() {
    document.documentElement.setAttribute("data-mode", "child");
    document.documentElement.setAttribute("data-demo-mode", "child");
  }

  function isNetworkError(err: unknown): boolean {
    return err instanceof ApiError && err.code === "network";
  }

  async function hydrate() {
    let sawNetwork = false;
    try {
      companions.value = await fetchCompanions();
    } catch (e) {
      if (isNetworkError(e)) sawNetwork = true;
      companions.value = [
        { id: "nuan", name: "小暖", role: "温柔陪伴型", blurb: "耐心鼓励，会讲短故事，适合睡前和慢慢聊。" },
        { id: "tiao", name: "跳跳", role: "活泼玩伴型", blurb: "爱提问、爱假装游戏，无聊时特别管用。" },
        { id: "cha", name: "阿茶", role: "稳重听友型", blurb: "少说教、多倾听，想说说心里话时来找我。" },
      ];
    }
    try {
      const p = await fetchProfile();
      nickname.value = p.nickname || "";
      mode.value = "child";
      companionId.value = p.companion_id || "nuan";
      likes.value = p.likes || [];
      memories.value = p.memories || [];
      backendUnreachable.value = false;
    } catch (e) {
      if (isNetworkError(e)) sawNetwork = true;
      backendUnreachable.value = sawNetwork;
    }
    applyModeChrome();
    ready.value = true;
  }

  async function save(partial: Partial<Pick<Profile, "nickname" | "mode" | "companion_id" | "likes">>) {
    const prev = {
      nickname: nickname.value,
      mode: mode.value,
      companionId: companionId.value,
      likes: [...likes.value],
    };
    if (partial.nickname !== undefined) nickname.value = partial.nickname;
    if (partial.mode !== undefined) mode.value = partial.mode;
    if (partial.companion_id !== undefined) companionId.value = partial.companion_id;
    if (partial.likes !== undefined) likes.value = partial.likes;
    applyModeChrome();
    try {
      const p = await patchProfile({
        nickname: nickname.value,
        mode: mode.value,
        companion_id: companionId.value,
        likes: likes.value,
      });
      memories.value = p.memories || memories.value;
      backendUnreachable.value = false;
    } catch (e) {
      nickname.value = prev.nickname;
      mode.value = prev.mode;
      companionId.value = prev.companionId;
      likes.value = prev.likes;
      applyModeChrome();
      throw e;
    }
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
    backendUnreachable,
    hydrate,
    save,
    applyModeChrome,
  };
});
