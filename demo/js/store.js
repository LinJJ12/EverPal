/* Shared demo store + nav highlight */
(function () {
  const KEY = "companion_demo_v1";

  const defaults = {
    mode: "child",
    nickname: "",
    companionId: "nuan",
  };

  const companions = {
    nuan: { id: "nuan", name: "小暖", blurb: "温柔耐心，爱讲短故事", tone: "nuan" },
    tiao: { id: "tiao", name: "跳跳", blurb: "活泼好玩，爱脑筋急转弯", tone: "tiao" },
    cha: { id: "cha", name: "阿茶", blurb: "稳重听友，适合慢慢说", tone: "cha" },
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

  function markNav() {
    const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href === file || (file === "" && href === "index.html")) {
        a.classList.add("here");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  /** Simple SVG face mark for companion avatars (no emoji-as-icon) */
  function avatarSvg(kind) {
    const faces = {
      nuan: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="18" cy="20" r="3" fill="#2a3140"/><circle cx="30" cy="20" r="3" fill="#2a3140"/><path d="M18 28c2.5 3 9.5 3 12 0" stroke="#2a3140" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>',
      tiao: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="18" cy="22" r="3" fill="#2a3140"/><circle cx="30" cy="22" r="3" fill="#2a3140"/><circle cx="24" cy="30" r="3" fill="#2a3140"/></svg>',
      cha: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="18" cy="20" r="3" fill="#2a3140"/><circle cx="30" cy="20" r="3" fill="#2a3140"/><path d="M17 29h14" stroke="#2a3140" stroke-width="2.5" stroke-linecap="round"/></svg>',
    };
    return faces[kind] || faces.nuan;
  }

  function iconChild() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="#b03060" stroke-width="2"/><path d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="#b03060" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function iconAdult() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="#1f5f99" stroke-width="2"/><path d="M4 20c1.2-4 4-6 8-6s6.8 2 8 6" stroke="#1f5f99" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  window.DemoStore = {
    load,
    save,
    companion,
    companions,
    markNav,
    avatarSvg,
    iconChild,
    iconAdult,
  };

  document.addEventListener("DOMContentLoaded", markNav);
})();
