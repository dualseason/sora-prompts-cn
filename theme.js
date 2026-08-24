(function () {
  var key = 'ai-film-theme';
  var saved = localStorage.getItem(key);
  if (saved === 'dark') {
    document.body.classList.add('dark-theme');
    document.body.classList.add('dark-mode');
  }

  function update(button) {
    if (!button) return;
    button.textContent = document.body.classList.contains('dark-theme') ? '切换浅色' : '切换暗色';
    button.setAttribute('aria-pressed', document.body.classList.contains('dark-theme') ? 'true' : 'false');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.querySelector('[data-theme-toggle]');
    update(button);
    if (!button) return;
    button.addEventListener('click', function () {
      var dark = document.body.classList.toggle('dark-theme');
      document.body.classList.toggle('dark-mode', dark);
      localStorage.setItem(key, dark ? 'dark' : 'light');
      update(button);
    });
  });
})();
