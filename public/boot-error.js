(() => {
  const app = document.getElementById('app');
  const showBootError = () => {
    if (!app || app.dataset.bootError) return;
    app.dataset.bootError = '1';
    app.innerHTML = '<main style="max-width:560px;margin:15vh auto;padding:28px 22px;color:#f3eadb;font:16px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#201b2b;border:1px solid #594667;border-radius:14px"><h1 style="margin:0 0 10px;font:500 30px Georgia,serif">The tavern did not open</h1><p style="margin:0 0 16px;color:#b0a5b9">The game could not start. Please try again or check the game server.</p><a href="/health" style="color:#e5bd79">Check the game server</a><span style="color:#b0a5b9"> · </span><a href="/host" style="color:#e5bd79">Try the host screen again</a></main>';
  };
  window.addEventListener('error', showBootError, true);
  window.addEventListener('unhandledrejection', showBootError);
  window.setTimeout(() => {
    if (app?.querySelector('.loading')) showBootError();
  }, 15000);
})();
