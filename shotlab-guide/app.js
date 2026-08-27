(function () {
  "use strict";

  var data = window.SHOT_GUIDE_DATA;
  var app = document.getElementById("app");
  var query = "";
  var observer = null;
  var activeGroupId = "shot-size";
  var expandedGroupIds = new Set(["shot-size"]);
  var mobileDirectoryQuery = window.matchMedia("(max-width: 680px)");
  var mobileDirectoryOpen = false;
  var mobileDirectoryReturnFocus = null;

  var groups = [
    {
      id: "shot-size",
      number: "I",
      zh: "景别",
      en: "Shot Size",
      quickTitle: "十级速查",
      quickId: "quick-shot-size",
      description: "基础九级按距离排列，牛仔镜头作为中远景变体单列。",
      ruleTitle: "景别阅读提示｜6 条识别原则",
      rules: data.rules,
      plannedTotal: 10,
      entries: data.shots.map(function (shot) {
        return {
          id: shot.id,
          order: shot.order,
          zh: shot.zh,
          en: shot.en,
          abbr: shot.abbr,
          definition: shot.definition,
          visual: shot.visual,
          featureLabel: "常见裁切位置",
          feature: shot.crop,
          should: shot.should,
          shouldNot: shot.shouldNot,
          image: shot.image,
          quickLabel: shot.scaleLabel,
          badge: shot.variant ? "中远景变体" : ""
        };
      })
    },
    {
      id: "composition",
      number: "II",
      zh: "构图",
      en: "Composition",
      quickTitle: "构图速查",
      quickId: "quick-composition",
      description: "22 项构图元素按基础空间规则、线条、纵深与扩展构图方式依次排列。",
      ruleTitle: "构图阅读提示｜6 条识别原则",
      rules: data.compositionRules,
      plannedTotal: 22,
      entries: data.compositionEntries.map(function (entry) {
        return Object.assign({}, entry, { featureLabel: "关键画面特征", quickLabel: entry.en });
      })
    },
    {
      id: "subject-viewpoint",
      number: "III",
      zh: "人物与视角",
      en: "Subject and Viewpoint",
      quickTitle: "人物与视角速查",
      quickId: "quick-subject-viewpoint",
      description: "14 项镜头形式按拍摄风格、双人关系、人物数量与扩展视角形式依次排列。",
      ruleTitle: "人物与视角阅读提示｜6 条识别原则",
      rules: data.subjectViewpointRules,
      plannedTotal: 14,
      entries: data.subjectViewpointEntries.map(function (entry) {
        return Object.assign({}, entry, { featureLabel: "关键画面特征", quickLabel: entry.en });
      })
    },
    {
      id: "camera-angle",
      number: "IV",
      zh: "拍摄角度",
      en: "Camera Angle",
      quickTitle: "拍摄角度速查",
      quickId: "quick-camera-angle",
      description: "7 项拍摄角度按中性、高低角度、横滚和三个扩展极端角度依次排列。",
      ruleTitle: "拍摄角度阅读提示｜6 条识别原则",
      rules: data.cameraAngleRules,
      plannedTotal: 7,
      entries: data.cameraAngleEntries.map(function (entry) {
        return Object.assign({}, entry, { featureLabel: "关键画面特征", quickLabel: entry.en });
      })
    },
    {
      id: "horizontal-angle",
      number: "V",
      zh: "机位方位",
      en: "Horizontal Camera Angle",
      quickTitle: "机位方位速查",
      quickId: "quick-horizontal-angle",
      description: "5 项机位方位从正面依次旋转到完全背面，用统一的可见面部信息划分边界。",
      ruleTitle: "机位方位阅读提示｜6 条识别原则",
      rules: data.horizontalAngleRules,
      plannedTotal: 5,
      entries: data.horizontalAngleEntries.map(function (entry) {
        return Object.assign({}, entry, { featureLabel: "关键画面特征", quickLabel: entry.en });
      })
    },
    {
      id: "camera-movement",
      number: "VI",
      zh: "摄影机运动",
      en: "Camera Movement",
      quickTitle: "摄影机运动速查",
      quickId: "quick-camera-movement",
      description: "21 项摄影机运动按旋转、位移、焦距变化、承载设备与主体关系组织，并以动态示例展示连续画面中的判断依据。",
      ruleTitle: "摄影机运动阅读提示｜6 条识别原则",
      rules: data.cameraMovementRules,
      plannedTotal: 21,
      entries: data.cameraMovementEntries.map(function (entry) {
        return Object.assign({}, entry, { featureLabel: "运动路径与画面线索", quickLabel: entry.en });
      })
    }
  ];

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function targetId(groupId, entryId) {
    return "tag-" + groupId + "-" + entryId;
  }

  function displayZh(entry) {
    return (entry.badge ? "|" : "") + entry.zh;
  }

  function displayBadge(entry) {
    if (!entry.badge) return "";
    return entry.badge === "中远景变体" ? "扩展术语 · 中远景变体" : "扩展术语";
  }

  function filteredGroups() {
    var needle = query.trim().toLocaleLowerCase();
    return groups.map(function (group) {
      var entries = needle ? group.entries.filter(function (entry) {
        return [entry.zh, entry.en, entry.abbr, entry.definition, entry.visual, entry.feature, entry.should, entry.shouldNot, entry.quickLabel]
          .join(" ").toLocaleLowerCase().includes(needle);
      }) : group.entries;
      return Object.assign({}, group, { entries: entries });
    });
  }

  function scrollToTarget(id) {
    var element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "auto", block: "start" });
    history.replaceState(null, "", "#" + id);
  }

  function goToTarget(id) {
    if (document.getElementById(id)) return scrollToTarget(id);
    query = "";
    document.getElementById("search-input").value = "";
    renderMain();
    setTimeout(function () { scrollToTarget(id); }, 0);
  }

  function info(label, body, tone) {
    return '<div class="info-item' + (tone ? ' info-' + tone : '') + '"><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(body) + '</dd></div>';
  }

  function imageButton(src, alt, label) {
    return '<button class="image-button hero-image" type="button" data-image-src="' + escapeHtml(src) + '" data-image-alt="' + escapeHtml(alt) + '" aria-label="放大查看' + escapeHtml(alt) + '">' +
      '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '"><span class="image-label">' + escapeHtml(label) + '</span></button>';
  }

  function motionVideo(entry) {
    return '<div class="motion-video hero-image"><video src="' + escapeHtml(entry.video) + '" poster="' + escapeHtml(entry.image) + '" controls loop muted playsinline preload="metadata" aria-label="' + escapeHtml(entry.zh) + '参考动态案例"></video></div>';
  }

  function tagCard(group, entry) {
    var id = targetId(group.id, entry.id);
    var progress = String(entry.order).padStart(2, "0") + "/" + String(group.plannedTotal).padStart(2, "0");
    return '<article class="shot-card" id="' + id + '" data-tag-id="' + id + '" data-group-id="' + group.id + '">' +
      '<header class="shot-header"><span class="shot-number">' + String(entry.order).padStart(2, "0") + '</span>' +
      '<div><div class="title-line"><h2>' + escapeHtml(displayZh(entry)) + '</h2><p class="english-title">' + escapeHtml(entry.en) + '</p>' +
      (entry.abbr ? '<span class="abbr-badge">' + escapeHtml(entry.abbr) + '</span>' : '') +
      (entry.badge ? '<span class="variant-badge">' + escapeHtml(displayBadge(entry)) + '</span>' : '') + '</div></div>' +
      '<p class="group-progress"><span>' + escapeHtml(group.zh) + '</span><strong>' + progress + '</strong></p></header>' +
      '<p class="definition">' + escapeHtml(entry.definition) + '</p>' +
      '<div class="shot-grid"><section class="shot-copy" aria-label="' + escapeHtml(entry.zh) + '识别方法"><dl>' +
      info("如何识别", entry.visual) + info(entry.featureLabel, entry.feature) +
      '</dl></section><section class="shot-visuals" aria-label="' + escapeHtml(entry.zh) + '视觉参照">' +
      (entry.video ? motionVideo(entry) : imageButton(entry.image, entry.zh + (entry.exampleLabel || "参考案例"), entry.zh)) +
      '</section><div class="card-verdicts split-info" aria-label="' + escapeHtml(entry.zh) + '识别提示">' + info("典型情形", entry.should, "good") + info("常见误判", entry.shouldNot, "bad") + '</div></div></article>';
  }

  function rulesPanel(group) {
    return '<section class="rules-panel" aria-labelledby="rules-' + group.id + '-title"><header class="rules-heading"><h3 id="rules-' + group.id + '-title">' + escapeHtml(group.ruleTitle) + '</h3></header><div class="rules-grid">' +
      group.rules.map(function (rule, index) { return '<div><span>' + (index + 1) + '</span><p><strong>' + escapeHtml(rule[0]) + '</strong>' + escapeHtml(rule[1]) + '</p></div>'; }).join("") +
      '</div></section>';
  }

  function quickIndex(group) {
    return '<section class="quick-strip" id="' + group.quickId + '" data-group-quick data-group-id="' + group.id + '" aria-labelledby="' + group.quickId + '-title">' +
      '<div class="section-heading"><div><span>' + group.number + ' · QUICK INDEX</span><h2 id="' + group.quickId + '-title">' + escapeHtml(group.quickTitle) + '</h2></div>' +
      '<div class="section-meta"><em>' + group.entries.length + ' / ' + group.plannedTotal + '</em><p>' + escapeHtml(group.description) + '</p></div></div>' +
      '<div class="quick-grid">' + group.entries.map(function (entry) {
        return '<button type="button" data-target="' + targetId(group.id, entry.id) + '"><img src="' + escapeHtml(entry.image) + '" alt=""><span><strong>' + escapeHtml(displayZh(entry)) + '</strong><small>' + escapeHtml(entry.quickLabel) + '</small></span></button>';
      }).join("") + '</div></section>';
  }

  function sidebar() {
    var groupHtml = groups.map(function (group) {
      var expanded = expandedGroupIds.has(group.id);
      return '<section class="nav-group' + (group.id === activeGroupId ? ' active-group' : '') + (expanded ? ' expanded-group' : '') + '" data-nav-group="' + group.id + '">' +
        '<div class="group-link-row">' +
          '<button class="group-link" type="button" data-target="' + group.quickId + '" aria-label="前往' + escapeHtml(group.zh) + '速查"><span>' + group.number + '</span><strong>' + escapeHtml(group.zh) + '</strong><small>' + escapeHtml(group.en) + '</small></button>' +
          '<button class="group-toggle" type="button" data-toggle-group="' + group.id + '" aria-expanded="' + expanded + '" aria-controls="nav-items-' + group.id + '" aria-label="' + (expanded ? '收起' : '展开') + escapeHtml(group.zh) + '标签列表"><span aria-hidden="true">›</span></button>' +
        '</div>' +
        '<div class="nav-items" id="nav-items-' + group.id + '">' + group.entries.map(function (entry) {
          var id = targetId(group.id, entry.id);
          return '<button type="button" data-target="' + id + '" data-nav-id="' + id + '"><span>' + String(entry.order).padStart(2, "0") + '</span><span><strong>' + escapeHtml(displayZh(entry)) + '</strong><small>' + escapeHtml(entry.abbr || entry.en) + '</small></span></button>';
        }).join("") + '</div></section>';
    }).join("");
    return '<aside class="sidebar" id="sidebar"><button class="sidebar-toggle sidebar-toggle-close" type="button" data-sidebar-toggle aria-label="收起侧边栏" title="收起侧边栏"><span aria-hidden="true">«</span></button>' +
      '<a class="brand" href="#quick-shot-size" aria-label="返回景别速查"><span><strong>看懂镜头</strong><small>电影分镜拆解手册</small></span></a>' +
      '<label class="search-box"><input id="search-input" type="search" placeholder="搜索术语或画面特征" aria-label="搜索镜头术语、案例和说明"></label>' +
      '<button class="mobile-directory-backdrop" type="button" data-mobile-directory-close aria-label="关闭章节目录" tabindex="-1"></button>' +
      '<section class="mobile-directory-sheet" id="mobile-directory-panel"><header class="mobile-directory-sheet-header"><div><small>看懂镜头</small><h2 id="mobile-directory-title">章节目录</h2></div><button type="button" data-mobile-directory-close>关闭</button></header>' +
      '<nav class="group-navigation" id="group-navigation" aria-label="知识章节目录">' + groupHtml + '</nav></section>' +
      '<a class="about-link" href="#about-guide"><span aria-hidden="true">i</span><strong>术语来源与阅读说明</strong></a></aside>';
  }

  function shell() {
    app.innerHTML = sidebar() + '<main id="main-content"></main>' +
      '<button class="sidebar-toggle sidebar-toggle-open" type="button" data-sidebar-toggle aria-label="展开侧边栏" title="展开侧边栏"><span aria-hidden="true">»</span></button>' +
      '<button class="mobile-directory-fab" type="button" data-mobile-directory-open aria-controls="mobile-directory-panel" aria-expanded="false" aria-label="打开章节目录">目录</button>' +
      '<a class="quick-return" id="quick-return" href="#quick-shot-size" aria-label="返回景别速查" title="返回景别速查"><span aria-hidden="true">↑</span></a>' +
      '<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="图片放大预览" hidden><button class="lightbox-backdrop" type="button" data-close-lightbox aria-label="关闭图片预览"></button>' +
      '<figure><img id="lightbox-image" src="" alt=""><figcaption id="lightbox-caption"></figcaption><button type="button" data-close-lightbox aria-label="关闭图片预览">关闭 ×</button></figure></div>';
    app.setAttribute("aria-busy", "false");
  }

  function renderMain() {
    var filtered = filteredGroups();
    var count = filtered.reduce(function (total, group) { return total + group.entries.length; }, 0);
    var html = filtered.filter(function (group) { return group.entries.length; }).map(function (group) {
      return '<section class="guide-group" id="group-' + group.id + '">' + quickIndex(group) + rulesPanel(group) +
        '<section class="cards" aria-label="' + escapeHtml(group.zh) + '元素案例">' + group.entries.map(function (entry) { return tagCard(group, entry); }).join("") + '</section></section>';
    }).join("");
    if (!count) html += '<div class="empty-state"><span>没有匹配结果</span><p>可尝试“腰部”“Headroom”“视线”或“环境”等关键词。</p><button type="button" data-clear-search>显示全部标签</button></div>';
    html += '<section class="source-note" id="about-guide" aria-labelledby="source-note-title"><div><span>ABOUT THIS GUIDE</span><h2 id="source-note-title">术语来源与阅读说明</h2></div><div class="source-copy">' +
      '<p>本手册以 Christopher J. Bowen 的《Grammar of the Shot》第五版（Routledge，2024）为基础框架，并参考 Blain Brown 的《Cinematography: Theory and Practice》第四版、Steven D. Katz 的《Film Directing: Shot by Shot》以及 American Society of Cinematographers 出版的《American Cinematographer Manual》第十一版，统一中文译名、常见英文名称与视觉识别边界。</p>' +
      '<p><strong><span class="source-pipe">|</span> 扩展术语</strong>表示该术语不是《Grammar of the Shot》基础分类中的同级独立条目，但在电影制作、摄影教学、分镜设计或镜头检索中具有稳定而常见的用法。保留这些术语，是为了让知识范围覆盖真实创作中经常遇到的镜头形式；“扩展”只说明分类来源不同，不代表它不专业或不重要。</p>' +
      '<p>不同教材和制作团队的命名边界可能略有差异。本手册采用便于观察和比较的操作性定义；图片与动画为原创或 AI 辅助生成的教学示意，不含受版权保护的电影截图。</p></div></section>';
    document.getElementById("main-content").innerHTML = html;
    document.getElementById("group-navigation").classList.toggle("searching", Boolean(query));
    groups.forEach(function (group) {
      var visibleIds = (filtered.find(function (item) { return item.id === group.id; }) || { entries: [] }).entries.map(function (entry) { return targetId(group.id, entry.id); });
      document.querySelectorAll('[data-nav-group="' + group.id + '"] [data-nav-id]').forEach(function (button) { button.classList.toggle("dimmed", !visibleIds.includes(button.dataset.navId)); });
    });
    wireMain();
    observeContent();
  }

  function wireMain() {
    document.querySelectorAll("#main-content [data-target]").forEach(function (button) { button.addEventListener("click", function () { goToTarget(button.dataset.target); }); });
    document.querySelectorAll("#main-content [data-image-src]").forEach(function (button) { button.addEventListener("click", function () { openLightbox(button.dataset.imageSrc, button.dataset.imageAlt); }); });
    document.querySelectorAll("[data-clear-search]").forEach(function (button) { button.addEventListener("click", clearSearch); });
  }

  function observeContent() {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(function (entries) {
      if (query) return;
      var visible = entries.filter(function (entry) { return entry.isIntersecting; }).sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
      if (!visible) return;
      var groupId = visible.target.dataset.groupId;
      if (groupId) setActiveGroup(groupId);
      if (visible.target.dataset.tagId) {
        document.querySelectorAll("[data-nav-id]").forEach(function (button) { button.classList.toggle("active", button.dataset.navId === visible.target.dataset.tagId); });
      }
    }, { rootMargin: "-16% 0px -65% 0px", threshold: [0.05, 0.2, 0.5] });
    document.querySelectorAll("[data-tag-id], [data-group-quick]").forEach(function (element) { observer.observe(element); });
  }

  function setActiveGroup(groupId) {
    activeGroupId = groupId;
    document.querySelectorAll("[data-nav-group]").forEach(function (section) { section.classList.toggle("active-group", section.dataset.navGroup === groupId); });
    var group = groups.find(function (item) { return item.id === groupId; }) || groups[0];
    var button = document.getElementById("quick-return");
    button.href = "#" + group.quickId;
    button.setAttribute("aria-label", "返回" + group.zh + "速查");
    button.title = "返回" + group.zh + "速查";
  }

  function toggleGroup(groupId) {
    var section = document.querySelector('[data-nav-group="' + groupId + '"]');
    if (!section) return;
    var isExpanded = expandedGroupIds.has(groupId);
    if (mobileDirectoryQuery.matches && !isExpanded) {
      expandedGroupIds.clear();
      document.querySelectorAll("[data-nav-group]").forEach(function (item) {
        item.classList.remove("expanded-group");
        var itemGroup = groups.find(function (group) { return group.id === item.dataset.navGroup; });
        var itemToggle = item.querySelector(".group-toggle");
        itemToggle.setAttribute("aria-expanded", "false");
        if (itemGroup) itemToggle.setAttribute("aria-label", "展开" + itemGroup.zh + "标签列表");
      });
    }
    if (isExpanded) expandedGroupIds.delete(groupId);
    else expandedGroupIds.add(groupId);
    section.classList.toggle("expanded-group", !isExpanded);
    var group = groups.find(function (item) { return item.id === groupId; });
    var toggle = section.querySelector(".group-toggle");
    toggle.setAttribute("aria-expanded", String(!isExpanded));
    if (group) toggle.setAttribute("aria-label", (!isExpanded ? "收起" : "展开") + group.zh + "标签列表");
  }

  function syncMobileDirectoryState() {
    var sheet = document.getElementById("mobile-directory-panel");
    var triggers = document.querySelectorAll("[data-mobile-directory-open]");
    if (!sheet || !triggers.length) return;
    if (mobileDirectoryQuery.matches) {
      sheet.setAttribute("role", "dialog");
      sheet.setAttribute("aria-modal", "true");
      sheet.setAttribute("aria-labelledby", "mobile-directory-title");
      sheet.setAttribute("aria-hidden", String(!mobileDirectoryOpen));
      sheet.toggleAttribute("inert", !mobileDirectoryOpen);
    } else {
      mobileDirectoryOpen = false;
      app.classList.remove("mobile-directory-open");
      document.body.classList.remove("mobile-directory-open");
      sheet.removeAttribute("role");
      sheet.removeAttribute("aria-modal");
      sheet.removeAttribute("aria-labelledby");
      sheet.removeAttribute("aria-hidden");
      sheet.removeAttribute("inert");
    }
    triggers.forEach(function (trigger) { trigger.setAttribute("aria-expanded", String(mobileDirectoryOpen)); });
  }

  function setMobileDirectoryOpen(open, restoreFocus, returnFocus) {
    if (open && !mobileDirectoryQuery.matches) return;
    if (open) mobileDirectoryReturnFocus = returnFocus || document.activeElement;
    mobileDirectoryOpen = Boolean(open);
    app.classList.toggle("mobile-directory-open", mobileDirectoryOpen);
    document.body.classList.toggle("mobile-directory-open", mobileDirectoryOpen);
    syncMobileDirectoryState();
    if (mobileDirectoryOpen) {
      var closeButton = document.querySelector(".mobile-directory-sheet [data-mobile-directory-close]");
      if (closeButton) setTimeout(function () { if (mobileDirectoryOpen) closeButton.focus(); }, 240);
    } else if (restoreFocus !== false) {
      var trigger = mobileDirectoryReturnFocus && document.contains(mobileDirectoryReturnFocus) ? mobileDirectoryReturnFocus : document.querySelector(".mobile-directory-fab");
      if (trigger) setTimeout(function () { if (!mobileDirectoryOpen) trigger.focus(); }, 240);
    }
  }

  function trapMobileDirectoryFocus(event) {
    if (!mobileDirectoryOpen || event.key !== "Tab") return;
    var sheet = document.getElementById("mobile-directory-panel");
    var focusable = Array.from(sheet.querySelectorAll("button:not([disabled]), a[href], input:not([disabled])"));
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (!sheet.contains(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setSidebarCollapsed(collapsed) {
    app.classList.toggle("sidebar-collapsed", collapsed);
    try {
      localStorage.setItem("shot-guide-sidebar-collapsed", collapsed ? "true" : "false");
    } catch (error) {
      // The sidebar still works when local file privacy settings block storage.
    }
  }

  function toggleSidebar() {
    setSidebarCollapsed(!app.classList.contains("sidebar-collapsed"));
  }

  function openLightbox(src, alt) {
    var modal = document.getElementById("lightbox");
    document.getElementById("lightbox-image").src = src;
    document.getElementById("lightbox-image").alt = alt;
    document.getElementById("lightbox-caption").textContent = alt;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    document.getElementById("lightbox").hidden = true;
    document.body.style.overflow = "";
  }

  function clearSearch() {
    query = "";
    document.getElementById("search-input").value = "";
    renderMain();
  }

  shell();
  try {
    app.classList.toggle("sidebar-collapsed", localStorage.getItem("shot-guide-sidebar-collapsed") === "true");
  } catch (error) {
    app.classList.remove("sidebar-collapsed");
  }
  renderMain();
  syncMobileDirectoryState();
  document.querySelectorAll("[data-sidebar-toggle]").forEach(function (button) { button.addEventListener("click", toggleSidebar); });
  document.querySelectorAll(".sidebar [data-target]").forEach(function (button) { button.addEventListener("click", function () { goToTarget(button.dataset.target); setMobileDirectoryOpen(false, false); }); });
  document.querySelectorAll(".sidebar [data-toggle-group]").forEach(function (button) { button.addEventListener("click", function () { toggleGroup(button.dataset.toggleGroup); }); });
  document.querySelectorAll("[data-mobile-directory-open]").forEach(function (button) { button.addEventListener("click", function () { setMobileDirectoryOpen(true, true, button); }); });
  document.querySelectorAll("[data-mobile-directory-close]").forEach(function (button) { button.addEventListener("click", function () { setMobileDirectoryOpen(false); }); });
  document.querySelectorAll("[data-close-lightbox]").forEach(function (button) { button.addEventListener("click", closeLightbox); });
  document.getElementById("search-input").addEventListener("input", function (event) { query = event.target.value; renderMain(); });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && mobileDirectoryOpen) { setMobileDirectoryOpen(false); return; }
    if (event.key === "Escape") closeLightbox();
    trapMobileDirectoryFocus(event);
    if (event.key === "/" && document.activeElement !== document.getElementById("search-input")) { event.preventDefault(); document.getElementById("search-input").focus(); }
  });
  if (mobileDirectoryQuery.addEventListener) mobileDirectoryQuery.addEventListener("change", syncMobileDirectoryState);
  else mobileDirectoryQuery.addListener(syncMobileDirectoryState);

  var initial = location.hash.replace("#", "");
  if (initial && document.getElementById(initial)) setTimeout(function () { scrollToTarget(initial); }, 0);
  else if (initial && data.shots.some(function (shot) { return shot.id === initial; })) setTimeout(function () { scrollToTarget(targetId("shot-size", initial)); }, 0);
})();
