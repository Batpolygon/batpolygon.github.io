(() => {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let rows = 0;
  let cols = 0;
  const spacing = 45;
  const squares = [];
  let mouse = { x: -1000, y: -1000 };

  function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.ceil(width / spacing);
    rows = Math.ceil(height / spacing);
    squares.length = 0;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        squares.push({
          x: i * spacing,
          y: j * spacing,
          ox: i * spacing,
          oy: j * spacing,
        });
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    squares.forEach((s) => {
      const dx = mouse.x - s.ox;
      const dy = mouse.y - s.oy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 150;
      if (dist < maxDist) {
        const angle = Math.atan2(dy, dx);
        const force = (maxDist - dist) / maxDist;
        s.x = s.ox - Math.cos(angle) * force * 15;
        s.y = s.oy - Math.sin(angle) * force * 15;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * (dist / maxDist)})`;
      } else {
        s.x += (s.ox - s.x) * 0.1;
        s.y += (s.oy - s.y) * 0.1;
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      }
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener("resize", init);

  init();
  draw();
})();
