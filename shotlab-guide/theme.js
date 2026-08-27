(function () {
  "use strict";

  var STORAGE_KEY = "shotlab-theme";
  var MODES = ["light", "dark"];
  var LABELS = { light: "浅色", dark: "深色" };
  var ICONS = {
    light: "./theme-sun.svg",
    dark: "./theme-moon.svg"
  };

  function readMode() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return MODES.indexOf(saved) === -1 ? "light" : saved;
    } catch (error) {
      return "light";
    }
  }

  function updateControls(mode) {
    var nextMode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    document.querySelectorAll("[data-theme-cycle]").forEach(function (button) {
      var icon = button.querySelector("[data-theme-icon]");
      if (icon) icon.src = ICONS[mode];
      button.dataset.themeMode = mode;
      button.setAttribute("aria-label", "当前为" + LABELS[mode] + "，点击切换为" + LABELS[nextMode]);
      button.title = LABELS[mode];
    });
  }

  function applyMode(mode, persist) {
    var choice = MODES.indexOf(mode) === -1 ? "light" : mode;
    document.documentElement.dataset.themeChoice = choice;
    document.documentElement.dataset.theme = choice;
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, choice);
      } catch (error) {
        // Theme switching still works when storage is unavailable.
      }
    }
    updateControls(choice);
  }

  document.querySelectorAll("[data-theme-cycle]").forEach(function (button) {
    button.addEventListener("click", function () {
      var currentMode = readMode();
      var nextMode = MODES[(MODES.indexOf(currentMode) + 1) % MODES.length];
      applyMode(nextMode, true);
    });
  });

  applyMode(readMode(), false);
})();
