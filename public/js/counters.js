fetch('/api/stats')
  .then(r => r.json())
  .then(res => {
    if (!res.success) throw new Error('API failed');
    const stats = res.data || {};
    animateCounter('counter-volunteers', stats.volunteers_registered || 2719);
    animateCounter('counter-projects',   stats.projects_completed    || 3);
    animateCounter('counter-lives',      stats.lives_impacted        || 50000);
  })
  .catch(() => {
    animateCounter('counter-volunteers', 2719);
    animateCounter('counter-projects',   3);
    animateCounter('counter-lives',      50000);
  });

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 1200;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    el.textContent = Math.floor(progress * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

document.querySelectorAll('.impact-number').forEach(el => {
  const target = parseInt(el.textContent.replace(/,/g, ''));
  if (isNaN(target)) return;
  let start = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / 1200);
    el.textContent = Math.floor(progress * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});