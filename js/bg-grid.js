/**
 * 动态方块背景 - 红色方块朝鼠标方向走，带随机偏移
 */
(function() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '-1';
  canvas.style.pointerEvents = 'none';
  
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const gridSize = 60;
  const blockSize = 52;
  const moveDuration = 200; // 移动持续毫秒
  const pauseDuration = 500; // 停顿毫秒

  const block = {
    col: Math.floor(Math.random() * (w / gridSize)),
    row: Math.floor(Math.random() * (h / gridSize)),
    moving: false,
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    phaseStart: performance.now(),
    mode: 'pause' // 'pause' | 'move'
  };

  let mouseCol = block.col;
  let mouseRow = block.row;
  let mouseActive = false;

  document.addEventListener('mousemove', (e) => {
    let col = Math.floor(e.clientX / gridSize);
    let row = Math.floor(e.clientY / gridSize);
    col = Math.max(0, Math.min(col, Math.floor((w - 1) / gridSize)));
    row = Math.max(0, Math.min(row, Math.floor((h - 1) / gridSize)));
    mouseCol = col;
    mouseRow = row;
    mouseActive = true;
  });

  document.addEventListener('mouseleave', () => {
    mouseActive = false;
  });

  function decideStep() {
    if (mouseActive && (block.col !== mouseCol || block.row !== mouseRow)) {
      if (Math.random() < 0.4) return pickRandomDir();
      return pickTowardMouse();
    }
    return pickRandomDir();
  }

  function pickTowardMouse() {
    let dcol = mouseCol - block.col;
    let drow = mouseRow - block.row;
    if (Math.abs(dcol) >= Math.abs(drow)) {
      const stepCol = dcol > 0 ? 1 : -1;
      if (Math.random() < 0.2 && drow !== 0) {
        return { dc: 0, dr: drow > 0 ? 1 : -1 };
      }
      return { dc: stepCol, dr: 0 };
    } else {
      const stepRow = drow > 0 ? 1 : -1;
      if (Math.random() < 0.2 && dcol !== 0) {
        return { dc: dcol > 0 ? 1 : -1, dr: 0 };
      }
      return { dc: 0, dr: stepRow };
    }
  }

  function pickRandomDir() {
    const dirs = [{dc:-1,dr:0},{dc:1,dr:0},{dc:0,dr:-1},{dc:0,dr:1}];
    return dirs[Math.floor(Math.random() * dirs.length)];
  }

  function moveStep() {
    const step = decideStep();
    const toCol = block.col + step.dc;
    const toRow = block.row + step.dr;
    const nx = toCol * gridSize;
    const ny = toRow * gridSize;
    if (nx < 0 || nx > w || ny < 0 || ny > h) return false;

    block.fromX = block.col * gridSize;
    block.fromY = block.row * gridSize;
    block.toX = nx;
    block.toY = ny;
    block.col = toCol;
    block.row = toRow;
    block.mode = 'move';
    block.phaseStart = performance.now();
    return true;
  }

  function draw(now) {
    // 深色模式不显示背景特效
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      ctx.clearRect(0, 0, w, h);
      requestAnimationFrame(draw);
      return;
    }
    ctx.clearRect(0, 0, w, h);

    // 网格线
    ctx.strokeStyle = 'rgba(180, 180, 180, 0.4)';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < w; gx += gridSize) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
    }
    for (let gy = 0; gy < h; gy += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }

    // 鼠标格子红色高亮
    if (mouseActive) {
      ctx.fillStyle = 'rgba(231, 76, 60, 0.12)';
      ctx.fillRect(mouseCol * gridSize + 1, mouseRow * gridSize + 1, gridSize - 2, gridSize - 2);
    }

    let drawX = block.col * gridSize;
    let drawY = block.row * gridSize;
    const elapsed = now - block.phaseStart;

    if (block.mode === 'move') {
      const t = Math.min(elapsed / moveDuration, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      drawX = block.fromX + (block.toX - block.fromX) * ease;
      drawY = block.fromY + (block.toY - block.fromY) * ease;

      if (t >= 1) {
        block.mode = 'pause';
        block.phaseStart = now;
      }
    } else {
      // pause
      if (elapsed >= pauseDuration) {
        moveStep();
      }
    }

    const pad = (gridSize - blockSize) / 2;
    ctx.fillStyle = '#E74C3C';
    ctx.shadowColor = 'rgba(231, 76, 60, 0.5)';
    ctx.shadowBlur = 18;
    ctx.fillRect(drawX + pad, drawY + pad, blockSize, blockSize);
    ctx.shadowBlur = 0;

    requestAnimationFrame(draw);
  }
  draw(performance.now());
})();



