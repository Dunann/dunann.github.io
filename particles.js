(() => {
  const canvas = document.querySelector('.particle-trail');
  const context = canvas?.getContext('2d');
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const particles = [];
  const maxParticles = 100;
  let frame = null;
  let previousTime = 0;
  let previousPointer = null;

  function clear() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    particles.length = 0;
    previousPointer = null;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function resize() {
    clear();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * scale);
    canvas.height = Math.round(window.innerHeight * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function draw(now) {
    const elapsed = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.age += elapsed;
      if (particle.age >= particle.lifetime) {
        particles.splice(i, 1);
        continue;
      }

      particle.x += particle.vx * elapsed;
      particle.y += particle.vy * elapsed;
      const remaining = 1 - particle.age / particle.lifetime;
      context.fillStyle = `rgba(255, 255, 255, ${remaining * 0.55})`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius * remaining, 0, Math.PI * 2);
      context.fill();
    }

    // Stop drawing once the trail has faded; mouse movement restarts it.
    frame = particles.length ? requestAnimationFrame(draw) : null;
  }

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches || document.hidden) return;

    const current = { x: event.clientX, y: event.clientY };
    const start = previousPointer || current;
    const distance = Math.hypot(current.x - start.x, current.y - start.y);
    const count = Math.min(6, Math.max(1, Math.ceil(distance / 8)));

    for (let i = 1; i <= count; i++) {
      particles.push({
        x: start.x + (current.x - start.x) * i / count,
        y: start.y + (current.y - start.y) * i / count,
        vx: (Math.random() - 0.5) * 36,
        vy: (Math.random() - 0.5) * 36,
        radius: 1 + Math.random() * 2,
        age: 0,
        lifetime: 0.45 + Math.random() * 0.45,
      });
    }

    if (particles.length > maxParticles) {
      particles.splice(0, particles.length - maxParticles);
    }
    previousPointer = current;
    if (frame === null) {
      previousTime = performance.now();
      frame = requestAnimationFrame(draw);
    }
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    previousPointer = null;
  });
  window.addEventListener('blur', clear);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', clear);
  reducedMotion.addEventListener('change', clear);
  resize();
})();
