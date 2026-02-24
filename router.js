// router.js
const Router = (() => {
  const routes = {};

  function define(map) {
    Object.assign(routes, map);
  }

  function navigate(route, push = true) {
    if (!routes[route]) return;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(routes[route]);
    if (el) el.classList.add('active');

    document.querySelectorAll('[data-route]').forEach(a => {
      a.classList.toggle('active', a.dataset.route === route);
    });

    if (push) window.location.hash = route;
    document.dispatchEvent(new CustomEvent('route', { detail: route }));
  }

  function init(def = 'home') {
    const h = window.location.hash.slice(1);
    navigate(routes[h] ? h : def, false);
    window.addEventListener('hashchange', () => {
      const r = window.location.hash.slice(1);
      if (routes[r]) navigate(r, false);
    });
  }

  return { define, navigate, init };
})();
