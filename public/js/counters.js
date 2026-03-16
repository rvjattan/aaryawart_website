document.querySelectorAll('.impact-number').forEach(el => {
  const target = parseInt(el.textContent.replace(/,/g, ''));
  if (isNaN(target)) return;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / 1200);
    el.textContent = Math.floor(progress * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});