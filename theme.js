(function () {
  var key = 'ai-film-theme';
  var saved = 'light';
  try { saved = localStorage.getItem(key) || 'light'; } catch (error) {}

  function applyTheme(dark) {
    document.body.classList.toggle('dark-theme', dark);
    document.body.classList.toggle('dark-mode', dark);
    var button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    button.textContent = dark ? '切换浅色' : '切换暗色';
    button.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }

  function boot() {
    applyTheme(saved === 'dark');
    var button = document.querySelector('[data-theme-toggle]');
    if (!button || button.dataset.bound) return;
    button.dataset.bound = 'true';
    button.addEventListener('click', function () {
      var dark = !document.body.classList.contains('dark-theme');
      applyTheme(dark);
      try { localStorage.setItem(key, dark ? 'dark' : 'light'); } catch (error) {}
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
