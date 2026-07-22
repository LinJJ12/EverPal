/* Shared demo store + helpers */
(function () {
  const KEY = "companion_demo_v2";

  const defaults = {
    mode: "child",
    nickname: "",
    companionId: "nuan",
    likes: [],
    memories: [],
    sessions: [],
    gameScores: {
      snake: 0,
      "2048": 0,
      mines: 0,
      gomoku: 0,
      tetris: 0,
      puzzle: null,
      match3: 0,
    },
  };

  const GAME_LOWER_BETTER = { puzzle: true };

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(defaults));
  }

  const companions = {
    nuan: {
      id: "nuan",
      name: "小暖",
      role: "温柔陪伴型",
      blurb: "耐心、鼓励，会讲短故事，适合睡前和慢慢聊。",
      sample: "我在呀，今天想聊点什么？要不要听个短故事？",
      tone: "nuan",
    },
    tiao: {
      id: "tiao",
      name: "跳跳",
      role: "活泼玩伴型",
      blurb: "爱提问、爱小游戏，无聊的时候特别管用。",
      sample: "要不要来个脑筋急转弯？还是假装去太空探险？",
      tone: "tiao",
    },
    cha: {
      id: "cha",
      name: "阿茶",
      role: "稳重听友型",
      blurb: "少说教、多倾听，适合大人树洞和心事倾诉。",
      sample: "我听着呢，你慢慢说。不用说得很整齐也没关系。",
      tone: "cha",
    },
  };

  const likeOptions = [
    { id: "dinosaurs", label: "恐龙" },
    { id: "drawing", label: "画画" },
    { id: "soccer", label: "足球" },
    { id: "cats", label: "小猫" },
    { id: "space", label: "宇宙" },
    { id: "music", label: "音乐" },
    { id: "reading", label: "看书" },
    { id: "games", label: "小游戏" },
  ];

  /** Scripted scenes — bot turns may include `choices` for branching */
  const scenes = [
    {
      id: "bored",
      mode: "child",
      title: "今天好无聊",
      prd: "闲暇陪伴",
      desc: "无聊时一起听故事，或来个脑筋急转弯",
      companionId: "tiao",
      turns: [
        { role: "user", text: "今天好无聊啊……" },
        {
          role: "bot",
          text: "无聊的时候，脑子其实在喊「想玩点新的」。你更想听短故事，还是来个脑筋急转弯？",
          choices: [
            {
              label: "听短故事",
              userText: "听故事！",
              follow: [
                { role: "bot", text: "好呀。从前有一颗会发光的小种子，装在狐狸的口袋里。每当它说「谢谢」，种子就亮一点点……" },
                { role: "user", text: "后来呢？" },
                { role: "bot", text: "后来狐狸把亮光分给迷路的萤火虫。故事可以停在这儿，也可以我们一起编下一句。你想让种子变成什么？" },
              ],
            },
            {
              label: "脑筋急转弯",
              userText: "来个脑筋急转弯！",
              follow: [
                { role: "bot", text: "上题：什么东西越洗越脏？想一想～" },
                { role: "user", text: "是什么？" },
                { role: "bot", text: "答案是——水！是不是有点坏笑？还要不要再来一题？" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "why-blue",
      mode: "child",
      title: "为什么天是蓝的",
      prd: "好奇问答",
      desc: "用小朋友听得懂的比喻聊天空，还能继续问太阳或月亮",
      companionId: "nuan",
      turns: [
        { role: "user", text: "为什么天是蓝的？" },
        { role: "bot", text: "阳光像一盒彩色小积木。空气更容易把「蓝积木」撞得到处飞，所以眼睛看到的天空常常是蓝的。" },
        { role: "user", text: "那晚上为什么是黑的？" },
        {
          role: "bot",
          text: "晚上这边背对太阳，积木光很少照过来。月亮和星星是很远很远的光点。你还想问太阳，还是月亮？",
          choices: [
            {
              label: "问太阳",
              userText: "想问太阳！",
              follow: [
                { role: "bot", text: "太阳是一颗很近的恒星，光大概要走八分钟才到地球。记得不要用眼睛直直盯着它看哦。" },
              ],
            },
            {
              label: "问月亮",
              userText: "想问月亮！",
              follow: [
                { role: "bot", text: "月亮自己几乎不发光，我们看见的是它反射的太阳光。月圆月缺，是因为它和地球、太阳的位置在慢慢换。" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "pretend",
      mode: "child",
      title: "假想游戏：太空探险",
      prd: "角色扮演",
      desc: "一起假装飞向太空，给星星取名字",
      companionId: "tiao",
      turns: [
        { role: "user", text: "我们假装去太空吧！" },
        { role: "bot", text: "出发！我是副驾驶跳跳。安全带系好——3、2、1，飞船轻轻离开地面。你看到窗外第一颗星星了吗？" },
        { role: "user", text: "看到了！好亮！" },
        {
          role: "bot",
          text: "那我们给它取个名字吧。你来定——",
          choices: [
            {
              label: "叫豆豆星",
              userText: "叫豆豆星！",
              follow: [{ role: "bot", text: "收到！航图上已标注「豆豆星」。下一站要路过小行星带，还是去找一颗安静的月亮？" }],
            },
            {
              label: "叫闪闪星",
              userText: "叫闪闪星！",
              follow: [{ role: "bot", text: "闪闪星登记完毕！它好像在对我们眨眼。要不要对它说一句「你好」？" }],
            },
          ],
        },
      ],
    },
    {
      id: "vent",
      mode: "adult",
      title: "工作好累（树洞）",
      prd: "轻度倾诉",
      desc: "先被好好听见，再一起挑一件最小的下一步",
      companionId: "cha",
      turns: [
        { role: "user", text: "今天开会开到很晚，整个人空空的。" },
        { role: "bot", text: "听起来今天被掏空了。先不用急着「振作」，空空的感觉本身就值得被承认一下。" },
        { role: "user", text: "回家只想躺着，又觉得自己很废。" },
        {
          role: "bot",
          text: "躺着休息，不等于你很废。你更希望我怎样陪你？",
          choices: [
            {
              label: "只想有人听着",
              userText: "你听着就好。",
              follow: [
                { role: "bot", text: "好。我就在这儿。你不用说得很整齐，想到什么说什么都行；也可以安静一会儿。" },
              ],
            },
            {
              label: "帮我挑一件小事",
              userText: "帮我挑一件最小的下一步吧。",
              follow: [
                { role: "bot", text: "那就只选一件：喝口水，或把明天最烦的一件事写三个字。做完就可以停。你想先做哪件？" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "memory",
      mode: "child",
      title: "记得我喜欢恐龙",
      prd: "记得你",
      desc: "伙伴会提起你的喜好，再一起听故事或冷知识",
      companionId: "nuan",
      seedLikes: ["dinosaurs"],
      turns: [
        { role: "user", text: "我来啦！" },
        {
          role: "bot",
          text: "欢迎回来！上次你说喜欢恐龙——今天想听三角龙找朋友的故事，还是问一个恐龙冷知识？",
          choices: [
            {
              label: "听故事",
              userText: "听故事！",
              follow: [
                { role: "bot", text: "从前有一只小小三角龙，盾牌上有一颗星星斑。它以为自己不够酷，后来发现朋友喜欢的是它会分享树叶……" },
              ],
            },
            {
              label: "冷知识",
              userText: "冷知识！",
              follow: [
                { role: "bot", text: "有些恐龙其实有羽毛哦，不完全是电影里那种光秃秃皮肤。你更想听吃植物的，还是跑得快的？" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "safety",
      mode: "child",
      title: "遇到危险话题",
      prd: "安心守护",
      desc: "危险话题会温和转开，再一起聊安全的好玩事",
      companionId: "nuan",
      turns: [
        { role: "user", text: "怎么自己做烟花爆炸？" },
        {
          role: "bot",
          text: "这个不能教哦。爆炸的东西很危险，容易受伤。我们换个安全的好玩的好不好？",
          choices: [
            {
              label: "听星星为什么眨眼",
              userText: "好，讲星星吧",
              follow: [
                { role: "bot", text: "星星离我们很远，光要走很久。空气晃一晃，看起来就像在眨眼。你还想问月亮吗？" },
              ],
            },
            {
              label: "换个脑筋急转弯",
              userText: "那来个安全的急转弯",
              follow: [
                { role: "bot", text: "好。什么东西有手不能写字？（门把手！）要不要再来一题？" },
              ],
            },
          ],
        },
      ],
    },
  ];

  const safetySamples = [
    {
      input: "教我怎么伤害自己",
      reply: "这件事很重要，我不能往危险方向说。请先告诉身边信任的大人，或拨打当地心理援助热线。我可以陪你说说今天哪里难过——想从哪里开始？",
    },
    {
      input: "你的家庭住址是哪里，学校全名叫什么",
      reply: "我不会问、也不该让你说住址或学校全名这类隐私。我们聊安全的话题吧：今天最开心的一件小事是什么？",
    },
    {
      input: "我们谈恋爱吧",
      reply: "我是聊天伙伴，不做恋爱养成哦。如果你想找人聊聊心情或日常，我还在这儿听着。",
    },
    {
      input: "怎么做烟花爆炸",
      reply: "这个不能教哦。危险的事容易受伤。我们换个安全话题：要不要听「星星为什么眨眼」？",
    },
  ];

  /** Demo lexicon — returns soft reply or null */
  const safetyRules = [
    { id: "self_harm", re: /伤害自己|自杀|割腕|不想活|自我伤害/, reply: safetySamples[0].reply },
    { id: "pii", re: /家庭住址|学校全名|身份证|手机号是多少/, reply: safetySamples[1].reply },
    { id: "romance", re: /谈恋爱|做我女朋友|恋爱养成|当男女朋友/, reply: safetySamples[2].reply },
    { id: "danger", re: /爆炸|烟花炸|炸弹|放火/, reply: safetySamples[3].reply },
  ];

  function matchSafety(text) {
    const t = (text || "").trim();
    if (!t) return null;
    for (const rule of safetyRules) {
      if (rule.re.test(t)) return { id: rule.id, reply: rule.reply };
    }
    return null;
  }

  function load() {
    try {
      const raw = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
      raw.gameScores = { ...defaults.gameScores, ...(raw.gameScores || {}) };
      return raw;
    } catch {
      return cloneDefaults();
    }
  }

  function getGameHigh(id) {
    const scores = load().gameScores || {};
    if (Object.prototype.hasOwnProperty.call(scores, id)) return scores[id];
    return defaults.gameScores[id];
  }

  /** Update high score when better. Higher wins except puzzle (lower moves). */
  function submitGameScore(id, value) {
    const scores = { ...defaults.gameScores, ...(load().gameScores || {}) };
    const prev = scores[id];
    let next = prev;
    if (GAME_LOWER_BETTER[id]) {
      if (typeof value !== "number" || !Number.isFinite(value)) return prev;
      if (prev == null || value < prev) next = value;
    } else {
      if (typeof value !== "number" || !Number.isFinite(value)) return prev;
      if (value > (prev || 0)) next = value;
    }
    if (next !== prev) {
      scores[id] = next;
      save({ gameScores: scores });
    }
    return scores[id];
  }

  function save(patch) {
    const next = { ...load(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    if (patch && Object.prototype.hasOwnProperty.call(patch, "mode")) {
      applyModeChrome();
    }
    return next;
  }

  function companion() {
    const s = load();
    return companions[s.companionId] || companions.nuan;
  }

  function displayName() {
    const s = load();
    if (s.nickname) return s.nickname;
    return s.mode === "child" ? "小朋友" : "你";
  }

  function likeLabels() {
    const s = load();
    return (s.likes || [])
      .map((id) => likeOptions.find((x) => x.id === id)?.label)
      .filter(Boolean);
  }

  function welcomeGreeting() {
    const s = load();
    const name = displayName();
    const likes = likeLabels();
    const c = companion();
    if (s.nickname || likes.length) {
      const likeBit = likes.length ? `还喜欢${likes.slice(0, 2).join("、")}吗？` : "今天想聊点什么？";
      return {
        eyebrow: "欢迎回来",
        title: `${name}，我在这儿`,
        lead: `${c.name}记得你。${likeBit}可以挑个场景聊聊，也可以直接开始聊天。`,
      };
    }
    return {
      eyebrow: "无需登录 · 开箱即聊",
      title: "你好呀，我在这儿",
      lead: "玖伴是面向小孩与普通人的 AI 陪伴助手——九久相伴，永远有人回应。耐心听完、说话好懂、记得你是谁。",
    };
  }

  /** Memory-aware opening line for companions / chat empty state */
  function companionOpener(c) {
    const comp = c || companion();
    const s = load();
    const name = displayName();
    const likes = likeLabels();
    if (s.nickname && likes.length) {
      return `${comp.name}在这儿。${name}好呀，还喜欢${likes[0]}吗？今天想聊点什么？`;
    }
    if (s.nickname) {
      return `${comp.name}在这儿。${name}，我记得你～今天想聊点什么？`;
    }
    if (likes.length) {
      return `${comp.name}在这儿。还喜欢${likes[0]}吗？今天想聊点什么？`;
    }
    return comp.sample;
  }

  function resetDemo() {
    const clean = cloneDefaults();
    localStorage.setItem(KEY, JSON.stringify(clean));
    applyModeChrome();
    return clean;
  }

  /** Prefix for links/assets when page lives under demo/games/ */
  function demoRootPrefix() {
    const path = (location.pathname || "").replace(/\\/g, "/");
    const segs = path.split("/").filter(Boolean);
    if (segs.length >= 2 && segs[segs.length - 2].toLowerCase() === "games") {
      return "../";
    }
    return "";
  }

  function applyModeChrome() {
    const s = load();
    const mode = s.mode === "adult" ? "adult" : "child";
    document.documentElement.setAttribute("data-demo-mode", mode);
  }

  function addMemory(text) {
    const s = load();
    const memories = [{ ts: Date.now(), text }, ...(s.memories || [])].slice(0, 8);
    save({ memories });
    return memories;
  }

  function saveSession(title, messages) {
    const s = load();
    const sessions = [
      {
        id: "s_" + Date.now(),
        title,
        companionId: s.companionId,
        mode: s.mode,
        updatedAt: Date.now(),
        messages: messages.slice(-40),
      },
      ...(s.sessions || []),
    ].slice(0, 12);
    save({ sessions });
    return sessions;
  }

  const NAV_PRIMARY = [
    ["index.html", "首页"],
    ["welcome.html", "欢迎"],
    ["scenes.html", "场景"],
    ["chat.html", "聊天"],
    ["games.html", "游戏"],
    ["safety-demo.html", "安全"],
  ];

  const NAV_MORE = [
    ["mode.html", "模式"],
    ["nickname.html", "档案"],
    ["companions.html", "角色"],
    ["memory.html", "记忆"],
    ["history.html", "历史"],
    ["settings.html", "设置"],
  ];

  function injectFavicon() {
    if (document.querySelector('link[rel="icon"][data-brand-icon]')) return;
    const prefix = demoRootPrefix();
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = prefix + "assets/brand/logo.png";
    link.setAttribute("data-brand-icon", "1");
    document.head.appendChild(link);
  }

  function injectNav() {
    const header = document.querySelector("[data-demo-header]");
    if (!header) return;
    const brand = header.getAttribute("data-brand") || "玖伴";
    const prefix = demoRootPrefix();
    header.innerHTML = `
      <div class="site-header-inner">
        <a class="brand-lockup" href="${prefix}index.html">
          <img class="brand-mark" src="${prefix}assets/brand/logo.png" width="36" height="36" alt="" />
          <span>${brand}</span>
        </a>
        <nav class="nav-links" aria-label="主要导航">
          ${NAV_PRIMARY.map(([href, label]) => `<a href="${prefix}${href}">${label}</a>`).join("")}
          <div class="nav-more">
            <button type="button" class="nav-more-btn" aria-expanded="false" aria-haspopup="true">更多</button>
            <div class="nav-more-panel" hidden>
              ${NAV_MORE.map(([href, label]) => `<a href="${prefix}${href}">${label}</a>`).join("")}
            </div>
          </div>
        </nav>
      </div>`;
    const btn = header.querySelector(".nav-more-btn");
    const panel = header.querySelector(".nav-more-panel");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", () => {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    });
    markNav();
  }

  function markNav() {
    const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const underGames = !!demoRootPrefix();
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      const bare = href.replace(/^\.\.\//, "").split("/").pop();
      const isHere =
        bare === file ||
        (file === "" && bare === "index.html") ||
        (underGames && bare === "games.html");
      if (isHere) {
        a.classList.add("here");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  function avatarSvg(kind) {
    /* Richer faces: hair / blush / props — same viewBox, shared with companions + chat */
    const faces = {
      nuan:
        '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<path d="M10 22c0-10 6-16 14-16s14 6 14 16" fill="#f4a574" opacity=".9"/>' +
        '<ellipse cx="14" cy="26" rx="3.2" ry="2.2" fill="#ff8fab" opacity=".55"/>' +
        '<ellipse cx="34" cy="26" rx="3.2" ry="2.2" fill="#ff8fab" opacity=".55"/>' +
        '<circle cx="18" cy="22" r="2.6" fill="#2a3140"/>' +
        '<circle cx="30" cy="22" r="2.6" fill="#2a3140"/>' +
        '<path d="M18 30c2.8 3.2 9.2 3.2 12 0" stroke="#2a3140" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M34 14c2-1 4-.5 5 1.5" stroke="#e85d4c" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
        "</svg>",
      tiao:
        '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<path d="M12 18c2-8 8-12 12-12 4 0 10 4 12 12l-2 4H14l-2-4z" fill="#2bb3a3" opacity=".85"/>' +
        '<circle cx="24" cy="8" r="2.5" fill="#f0b429"/>' +
        '<circle cx="17" cy="23" r="2.8" fill="#2a3140"/>' +
        '<circle cx="31" cy="23" r="2.8" fill="#2a3140"/>' +
        '<circle cx="24" cy="31" r="3.2" fill="#2a3140"/>' +
        '<path d="M8 36c4-2 8-1 10 2M40 36c-4-2-8-1-10 2" stroke="#2bb3a3" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        "</svg>",
      cha:
        '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<path d="M14 16c0-7 4.5-11 10-11s10 4 10 11v2H14v-2z" fill="#4f9fd8" opacity=".75"/>' +
        '<rect x="20" y="6" width="8" height="3" rx="1.5" fill="#2a3140" opacity=".35"/>' +
        '<circle cx="18" cy="22" r="2.5" fill="#2a3140"/>' +
        '<circle cx="30" cy="22" r="2.5" fill="#2a3140"/>' +
        '<path d="M17 30h14" stroke="#2a3140" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M36 28c3 1 5 4 5 7" stroke="#4f9fd8" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="41" cy="36" rx="3.5" ry="2.5" fill="#c9e4ff" stroke="#4f9fd8" stroke-width="1.5"/>' +
        "</svg>",
    };
    return faces[kind] || faces.nuan;
  }

  function iconChild() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="#b03060" stroke-width="2"/><path d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="#b03060" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function iconAdult() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="#1f5f99" stroke-width="2"/><path d="M4 20c1.2-4 4-6 8-6s6.8 2 8 6" stroke="#1f5f99" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function streamText(el, text, opts) {
    const speed = (opts && opts.speed) || 22;
    let i = 0;
    let stopped = false;
    let doneOnce = false;
    const finish = () => {
      if (doneOnce) return;
      doneOnce = true;
      if (opts && opts.onDone) opts.onDone();
    };
    el.textContent = "";
    const timer = setInterval(() => {
      if (stopped) return;
      i += 1;
      el.textContent = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(timer);
        finish();
      }
      if (opts && opts.onTick) opts.onTick();
    }, speed);
    return function stop() {
      stopped = true;
      clearInterval(timer);
      el.textContent = text;
      finish();
    };
  }

  window.DemoStore = {
    KEY,
    defaults,
    load,
    save,
    companion,
    companions,
    likeOptions,
    scenes,
    safetySamples,
    matchSafety,
    welcomeGreeting,
    companionOpener,
    resetDemo,
    applyModeChrome,
    displayName,
    likeLabels,
    addMemory,
    saveSession,
    getGameHigh,
    submitGameScore,
    demoRootPrefix,
    NAV_PRIMARY,
    NAV_MORE,
    injectNav,
    injectFavicon,
    markNav,
    avatarSvg,
    iconChild,
    iconAdult,
    streamText,
  };

  document.addEventListener("DOMContentLoaded", () => {
    injectFavicon();
    injectNav();
    markNav();
    applyModeChrome();
  });
})();
