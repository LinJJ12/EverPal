/* Shared demo helpers */
(function () {
  const KEY = "companion_demo_v1";

  const defaults = {
    mode: "child",
    nickname: "",
    companionId: "nuan",
  };

  const companions = {
    nuan: { id: "nuan", name: "小暖", emoji: "🦊", blurb: "温柔耐心，爱讲短故事" },
    tiao: { id: "tiao", name: "跳跳", emoji: "🐰", blurb: "活泼好玩，爱脑筋急转弯" },
    cha: { id: "cha", name: "阿茶", emoji: "🍵", blurb: "稳重听友，适合慢慢说" },
  };

  function load() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
      return { ...defaults };
    }
  }

  function save(patch) {
    const next = { ...load(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  function companion() {
    const s = load();
    return companions[s.companionId] || companions.nuan;
  }

  function markRibbon() {
    const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".demo-ribbon a").forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href === file || (file === "" && href === "index.html")) {
        a.classList.add("here");
      }
    });
  }

  window.DemoStore = { load, save, companion, companions, markRibbon };
  document.addEventListener("DOMContentLoaded", markRibbon);
})();
