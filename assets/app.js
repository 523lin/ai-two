(function () {
  "use strict";

  var EMAIL = "hello@linan.example";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ANSWERS = {
    meta: "不是真人，我是林安的 AI 分身。这个原型里的回答由预设规则生成，只基于林安提供的公开信息；重要的事，还是建议直接联系本人。",
    contact: "可以发邮件到 " + EMAIL + "。这是原型里的示例地址，正式上线前会替换成真实邮箱。内容合作、AI 产品交流，或者面试邀请，都可以从这里开始。",
    works: "我的作品集还在整理中，暂时没有对外发布的完整清单。目前会围绕内容策划、AI 应用笔记和知识整理这几个方向归档，主页的「最近在做」里能看到进度。",
    current: "最近主要在忙两件事：搭这个个人主页，以及重新整理自己的作品和写作方向。简单说，就是一边梳理过去，一边把新的表达方式搭起来。",
    skills: "我比较擅长内容表达、AI 应用和知识整理。更具体一点，就是把复杂的信息拆开、重新搭好结构，再用普通人能听懂的话讲出来。",
    interests: "AI 应用、写作和旅行。它们对我来说有一点共通：都在帮我看更大的世界，也帮我把看到的东西讲清楚。",
    ai: "AI 是我现在重点学习的方向。我正在练习把 AI 真正放进产品与内容工作流里，而不只是停在“用过几个工具”这一步。",
    identity: "我是林安，一个正在学习用 AI 做产品的内容策划。现在主要在做个人主页和作品集整理，关注内容表达、AI 应用与知识整理。",
    why: "因为我喜欢把复杂问题讲成人话：先把信息拆开、重新搭结构，再确认对方真的听懂了。那声“哦，原来是这样”，就是内容工作最有意思的部分。",
    homepage: "这是林安的第一版个人主页，用来介绍自己、放数字分身，也给之后的作品集留位置。现在先把结构搭清楚，内容会陆续补上。",
    private: "这类私人信息没有放在公开资料里，我就不替本人回答了。建议直接发邮件问林安。",
    thanks: "不客气。如果还想继续了解，可以问我最近在做什么，或者直接发邮件。",
    greeting: "你好，我是林安的 AI 分身。想了解近况、作品方向，还是联系方式？直接问我就好。",
    fallback: "这个问题我还没有被喂到足够的信息，不想替本人编答案。你可以问我「现在在做什么」「有哪些作品」或「怎么联系」，也可以直接发邮件。"
  };

  var INTENTS = [
    {
      id: "meta",
      patterns: [/真人/, /机器人/, /是\s*ai/i, /ai\s*吗/i, /模型/, /分身/, /生成/, /虚拟/]
    },
    {
      id: "private",
      patterns: [/住哪|住在|哪里人|城市|多大|年龄|生日|工资|薪资|收入|结婚|恋爱|男朋友|女朋友|家庭/]
    },
    {
      id: "contact",
      patterns: [/联系/, /邮箱/, /e-?mail/i, /微信/, /电话/, /怎么找/, /合作/, /面试/, /邀请/, /约你/]
    },
    {
      id: "works",
      patterns: [/作品/, /项目/, /案例/, /portfolio/i, /做过什么/, /成果/]
    },
    {
      id: "current",
      patterns: [/现在/, /最近/, /在忙/, /做什么/, /近况/, /忙什么/, /干啥/, /目前/]
    },
    {
      id: "skills",
      patterns: [/擅长/, /优势/, /能力/, /会什么/, /强项/, /知识整理/, /内容表达/]
    },
    {
      id: "interests",
      patterns: [/兴趣/, /爱好/, /喜欢/, /旅行/, /写作/]
    },
    {
      id: "ai",
      patterns: [/\bai\b/i, /人工智能/, /产品/, /工具/, /大模型/]
    },
    {
      id: "identity",
      patterns: [/是谁/, /介绍/, /身份/, /职业/, /做什么工作/, /内容策划/, /你是/]
    },
    {
      id: "why",
      patterns: [/人话/, /复杂/, /为什么/, /理念/, /怎么讲/]
    },
    {
      id: "homepage",
      patterns: [/主页/, /网站/, /页面/, /这个站/]
    },
    {
      id: "thanks",
      patterns: [/谢谢/, /感谢/, /thx/i]
    },
    {
      id: "greeting",
      patterns: [/你好/, /您好/, /嗨/, /哈喽/, /hello/i, /^hi\b/i, /在吗/]
    }
  ];

  var chatMessages = document.getElementById("chatMessages");
  var chatForm = document.getElementById("chatForm");
  var chatInput = document.getElementById("chatInput");
  var suggestions = document.getElementById("chatSuggestions");
  var resetButton = document.getElementById("resetChat");
  var copyButton = document.getElementById("copyEmail");
  var toast = document.getElementById("toast");
  var header = document.querySelector(".site-header");
  var year = document.getElementById("year");

  if (!chatMessages || !chatForm || !chatInput) return;

  var isTyping = false;
  var typingTimer = null;
  var toastTimer = null;

  function detectIntent(rawText) {
    var text = rawText.toLowerCase().replace(/\s+/g, " ").trim();
    var best = null;
    var bestScore = 0;

    INTENTS.forEach(function (intent) {
      var score = 0;
      intent.patterns.forEach(function (pattern) {
        if (pattern.test(text)) score += 1;
      });
      if (score > bestScore) {
        bestScore = score;
        best = intent.id;
      }
    });

    return best || "fallback";
  }

  function createAvatar() {
    var avatar = document.createElement("span");
    avatar.className = "message-avatar";
    avatar.setAttribute("aria-hidden", "true");
    var image = document.createElement("img");
    image.src = "assets/avatar.svg";
    image.alt = "";
    image.width = 640;
    image.height = 800;
    avatar.appendChild(image);
    return avatar;
  }

  function fillMessageText(element, text) {
    var emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    var cursor = 0;
    var match;

    while ((match = emailPattern.exec(text)) !== null) {
      if (match.index > cursor) {
        element.appendChild(document.createTextNode(text.slice(cursor, match.index)));
      }
      var link = document.createElement("a");
      link.href = "mailto:" + match[1];
      link.textContent = match[1];
      element.appendChild(link);
      cursor = match.index + match[1].length;
    }

    if (cursor < text.length) {
      element.appendChild(document.createTextNode(text.slice(cursor)));
    }
  }

  function appendMessage(role, text) {
    var row = document.createElement("div");
    row.className = "message message-" + role;

    if (role === "bot") {
      row.appendChild(createAvatar());
    }

    var stack = document.createElement("div");
    stack.className = "message-stack";

    var bubble = document.createElement("div");
    bubble.className = "message-bubble";
    fillMessageText(bubble, text);

    var meta = document.createElement("span");
    meta.className = "message-meta";
    meta.textContent = role === "bot" ? "AI 分身 · 基于公开信息" : "你";

    stack.appendChild(bubble);
    stack.appendChild(meta);
    row.appendChild(stack);
    chatMessages.appendChild(row);
    scrollMessages();
  }

  function scrollMessages() {
    if (!chatMessages) return;
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: reduceMotion ? "auto" : "smooth"
    });
  }

  function showTyping() {
    var row = document.createElement("div");
    row.className = "message message-bot";
    row.id = "typingMessage";
    row.appendChild(createAvatar());

    var stack = document.createElement("div");
    stack.className = "message-stack";
    var bubble = document.createElement("div");
    bubble.className = "message-bubble typing-bubble";
    bubble.setAttribute("aria-label", "数字分身正在输入");
    bubble.innerHTML = "<i></i><i></i><i></i>";
    stack.appendChild(bubble);
    row.appendChild(stack);
    chatMessages.appendChild(row);
    scrollMessages();
  }

  function removeTyping() {
    var typing = document.getElementById("typingMessage");
    if (typing) typing.remove();
  }

  function setBusy(busy) {
    isTyping = busy;
    chatMessages.setAttribute("aria-busy", busy ? "true" : "false");
    suggestions.querySelectorAll("button").forEach(function (button) {
      button.disabled = busy;
    });
  }

  function resetConversation() {
    if (typingTimer) {
      window.clearTimeout(typingTimer);
      typingTimer = null;
    }
    setBusy(false);
    chatMessages.innerHTML = "";
    appendMessage(
      "bot",
      "你好，我是林安的 AI 分身。关于林安正在做的事、作品方向和联系方式，都可以先问我。\n\n想先了解什么？可以点下面的问题，也可以直接打字。"
    );
  }

  function sendQuestion(question) {
    var text = question.trim();
    if (!text || isTyping) return;

    appendMessage("user", text);
    chatInput.value = "";
    setBusy(true);
    showTyping();

    var intent = detectIntent(text);
    var answer = ANSWERS[intent] || ANSWERS.fallback;
    var delay = reduceMotion ? 120 : 620 + Math.round(Math.random() * 380);

    typingTimer = window.setTimeout(function () {
      removeTyping();
      appendMessage("bot", answer);
      typingTimer = null;
      setBusy(false);
      if (window.matchMedia("(min-width: 900px)").matches) {
        chatInput.focus({ preventScroll: true });
      }
    }, delay);
  }

  chatForm.addEventListener("submit", function (event) {
    event.preventDefault();
    sendQuestion(chatInput.value);
  });

  suggestions.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-question]");
    if (!button || button.disabled) return;
    sendQuestion(button.getAttribute("data-question") || "");
  });

  resetButton.addEventListener("click", resetConversation);

  function showToast(message) {
    if (!toast) return;
    if (toastTimer) window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function fallbackCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();
    var copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    textarea.remove();
    return copied;
  }

  if (copyButton) {
    copyButton.addEventListener("click", function () {
      var email = copyButton.getAttribute("data-email") || EMAIL;

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(function () {
          showToast("邮箱已复制：" + email);
        }).catch(function () {
          showToast(fallbackCopy(email) ? "邮箱已复制：" + email : "复制失败，请手动选择邮箱");
        });
      } else {
        showToast(fallbackCopy(email) ? "邮箱已复制：" + email : "复制失败，请手动选择邮箱");
      }
    });
  }

  function createStarfield() {
    var field = document.getElementById("starfield");
    if (!field) return;

    var isSmall = window.matchMedia("(max-width: 700px)").matches;
    var count = isSmall ? 96 : 168;
    var fragment = document.createDocumentFragment();

    for (var index = 0; index < count; index += 1) {
      var star = document.createElement("i");
      var bright = index % 19 === 0;
      var size = bright ? 2.2 + Math.random() * 1.5 : 0.7 + Math.random() * 1.4;

      star.className = bright ? "star is-bright" : "star";
      star.style.left = (Math.random() * 100).toFixed(2) + "%";
      star.style.top = (Math.random() * 100).toFixed(2) + "%";
      star.style.width = size.toFixed(2) + "px";
      star.style.height = size.toFixed(2) + "px";
      star.style.setProperty("--o", (0.22 + Math.random() * 0.62).toFixed(2));
      star.style.animationDuration = (3.5 + Math.random() * 6.5).toFixed(2) + "s";
      star.style.animationDelay = (-Math.random() * 8).toFixed(2) + "s";
      fragment.appendChild(star);
    }

    field.appendChild(fragment);
  }

  function applyEmail() {
    document.querySelectorAll("[data-email-link]").forEach(function (link) {
      var subject = link.getAttribute("data-email-subject");
      link.href = "mailto:" + EMAIL + (subject ? "?subject=" + encodeURIComponent(subject) : "");
    });
    document.querySelectorAll("[data-email-text]").forEach(function (node) {
      node.textContent = EMAIL;
    });
    if (copyButton) copyButton.setAttribute("data-email", EMAIL);
  }

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  createStarfield();
  applyEmail();
  resetConversation();
})();
