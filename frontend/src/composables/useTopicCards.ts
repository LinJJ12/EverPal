import { computed } from "vue";
import { topicChips } from "@/content/packs";

/** Official empty-chat topic chips from the static content pack. */
export function useTopicCards() {
  const topics = computed(() => topicChips());
  return { topics };
}
