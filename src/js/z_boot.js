(function () {
  const hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) try { hot.snapshot(() => G.started ? { ...serialize(), resume: true } : {}); } catch (e) { }
  if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {});
})();
