/**
 * 夜间模式 · 飞机大战背景（仅宽屏 ≥1600px，窄屏纯星空）
 * 战机左侧跟随鼠标 | 怪物整队仅上下移动 | 子弹独立高层
 */
(function () {
  'use strict';

  const STEP_MS = 520;
  const STEP_Y = 16;
  const BULLET_SPEED = 16;
  const ALIEN_H = 32;
  const ENEMY_TOP_PAD = 0.08;
  const ENEMY_BOTTOM_PAD = 40;
  const WIDE_SCREEN_MQ = window.matchMedia('(min-width: 1600px)');

  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.id = 'night-raid-canvas';

  const bulletCanvas = document.createElement('canvas');
  bulletCanvas.id = 'night-raid-bullets';

  const sctx = spriteCanvas.getContext('2d');
  const bctx = bulletCanvas.getContext('2d');

  let w = 0;
  let h = 0;
  let rafId = 0;

  let player = { x: 28, y: 0, targetY: 0, tilt: 0 };
  let bullets = [];
  let enemies = [];
  let explosions = [];
  let enemyVY = 1;
  let enemyFrame = 0;
  let lastStep = 0;
  let mounted = false;

  const isDark = () =>
    document.documentElement.getAttribute('data-theme') === 'dark';

  const isWideScreen = () => WIDE_SCREEN_MQ.matches;

  const shouldRun = () => isDark() && isWideScreen();

  function mountCanvases() {
    if (mounted) return;
    spriteCanvas.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2;pointer-events:none;';
    bulletCanvas.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:50;pointer-events:none;';

    const universe = document.getElementById('universe');
    const anchor = universe && universe.parentNode ? universe.parentNode : document.body;
    if (universe && universe.nextSibling) {
      anchor.insertBefore(spriteCanvas, universe.nextSibling);
      anchor.insertBefore(bulletCanvas, spriteCanvas.nextSibling);
    } else {
      anchor.appendChild(spriteCanvas);
      anchor.appendChild(bulletCanvas);
    }
    mounted = true;
  }

  function unmountCanvases() {
    stop();
    if (spriteCanvas.parentNode) spriteCanvas.parentNode.removeChild(spriteCanvas);
    if (bulletCanvas.parentNode) bulletCanvas.parentNode.removeChild(bulletCanvas);
    mounted = false;
  }

  function resize() {
    w = spriteCanvas.width = bulletCanvas.width = window.innerWidth;
    h = spriteCanvas.height = bulletCanvas.height = window.innerHeight;
    player.x = 28;
    player.y = h * 0.45;
    player.targetY = player.y;
    initEnemies();
  }

  function initEnemies() {
    enemies = [];
    const cols = 3;
    const rows = 4;
    const alienW = 36;
    const gapX = 40;
    const gapY = 42;
    const rightPad = 10;
    const formationW = (cols - 1) * gapX + alienW;
    const startX = w - rightPad - formationW;
    const startY = h * 0.18;
    // 从左到右：紫(2) 黄(1) 红(0)，每列竖排 4 个同风格
    const colType = [2, 1, 0];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        enemies.push({
          x: startX + c * gapX,
          y: startY + r * gapY,
          alive: true,
          type: colType[c],
        });
      }
    }
    enemyVY = 1;
    lastStep = performance.now();
  }

  function livingEnemies() {
    return enemies.filter((e) => e.alive);
  }

  function enemyStep(now) {
    const alive = livingEnemies();
    if (!alive.length) {
      initEnemies();
      return;
    }
    if (now - lastStep < STEP_MS) return;
    lastStep = now;
    enemyFrame = 1 - enemyFrame;

    // 整队仅上下移动，触顶/触底后折返
    alive.forEach((e) => {
      e.y += enemyVY * STEP_Y;
    });

    let minY = Infinity;
    let maxY = -Infinity;
    alive.forEach((e) => {
      minY = Math.min(minY, e.y);
      maxY = Math.max(maxY, e.y + ALIEN_H);
    });

    const topBound = h * ENEMY_TOP_PAD;
    const bottomBound = h - ENEMY_BOTTOM_PAD;

    if (minY <= topBound || maxY >= bottomBound) {
      enemyVY *= -1;
      alive.forEach((e) => {
        e.y += enemyVY * STEP_Y;
      });
    }
  }

  function shoot() {
    bullets.push({
      x: player.x + 58,
      y: player.y,
    });
  }

  /** 矢量战机（侧视，朝右） */
  function drawPlane(ctx, x, y, tilt) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.imageSmoothingEnabled = true;

    // 尾焰
    const flame = 0.6 + Math.sin(performance.now() * 0.02) * 0.4;
    ctx.shadowBlur = 14;
    ctx.shadowColor = 'rgba(255, 120, 40, 0.9)';
    ctx.fillStyle = `rgba(255, ${120 + flame * 60 | 0}, 40, 0.85)`;
    ctx.beginPath();
    ctx.moveTo(-18, -3);
    ctx.lineTo(-32 - flame * 8, 0);
    ctx.lineTo(-18, 3);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // 下机翼
    ctx.fillStyle = '#5a9fd4';
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.quadraticCurveTo(18, 18, 34, 8);
    ctx.lineTo(28, 4);
    ctx.closePath();
    ctx.fill();

    // 上机翼
    ctx.fillStyle = '#6eb5e8';
    ctx.beginPath();
    ctx.moveTo(4, -4);
    ctx.quadraticCurveTo(20, -20, 36, -8);
    ctx.lineTo(28, -4);
    ctx.closePath();
    ctx.fill();

    // 机身
    const body = ctx.createLinearGradient(-10, 0, 50, 0);
    body.addColorStop(0, '#8ec8f8');
    body.addColorStop(0.5, '#c5e4ff');
    body.addColorStop(1, '#ffffff');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-14, -5);
    ctx.quadraticCurveTo(10, -6, 42, -2);
    ctx.lineTo(56, 0);
    ctx.lineTo(42, 2);
    ctx.quadraticCurveTo(10, 6, -14, 5);
    ctx.closePath();
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = 'rgba(255, 170, 60, 0.9)';
    ctx.beginPath();
    ctx.ellipse(24, -1, 9, 5, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  /** 矢量外星人（朝左，三种种类） */
  function drawAlien(ctx, x, y, type, frame) {
    ctx.save();
    ctx.translate(x + 18, y + 16);
    ctx.imageSmoothingEnabled = true;

    const palette = [
      { body: '#ff5a7a', glow: 'rgba(255,90,122,0.35)' },   // 红
      { body: '#ffb84d', glow: 'rgba(255,184,77,0.35)' },   // 黄
      { body: '#9d7aff', glow: 'rgba(157,122,255,0.35)' },  // 紫
    ][type];

    const sway = frame ? 3 : -3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = palette.glow;

    // 触须/腿
    ctx.strokeStyle = palette.body;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(side * 8, 10);
      ctx.quadraticCurveTo(side * (14 + sway), 18, side * 10, 24);
      ctx.stroke();
    });

    // 身体
    ctx.fillStyle = palette.body;
    ctx.beginPath();
    if (type === 0) {
      ctx.ellipse(0, 2, 16, 13, 0, 0, Math.PI * 2);
    } else if (type === 1) {
      ctx.moveTo(-14, -8);
      ctx.quadraticCurveTo(0, -18, 14, -8);
      ctx.quadraticCurveTo(16, 8, 0, 14);
      ctx.quadraticCurveTo(-16, 8, -14, -8);
    } else {
      ctx.moveTo(-12, 0);
      ctx.bezierCurveTo(-12, -16, 12, -16, 12, 0);
      ctx.bezierCurveTo(12, 14, -12, 14, -12, 0);
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-6, -2, 5, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -2, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(-5, -1, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function update(now) {
    const prevY = player.y;
    player.y += (player.targetY - player.y) * 0.18;
    player.tilt = Math.max(-0.12, Math.min(0.12, (player.y - prevY) * 0.04));

    enemyStep(now);

    bullets = bullets.filter((b) => {
      b.x += BULLET_SPEED;
      return b.x < w + 40;
    });

    bullets.forEach((b) => {
      enemies.forEach((e) => {
        if (!e.alive) return;
        if (
          b.x >= e.x &&
          b.x <= e.x + 36 &&
          b.y >= e.y &&
          b.y <= e.y + 32
        ) {
          e.alive = false;
          b.x = w + 999;
          explosions.push({ x: e.x + 18, y: e.y + 16, life: 14 });
        }
      });
    });

    explosions = explosions.filter((ex) => {
      ex.life -= 1;
      return ex.life > 0;
    });
  }

  function drawSprites() {
    sctx.clearRect(0, 0, w, h);
    drawPlane(sctx, player.x, player.y, player.tilt);
    livingEnemies().forEach((e) => {
      drawAlien(sctx, e.x, e.y, e.type, enemyFrame);
    });
  }

  function drawBullets() {
    bctx.clearRect(0, 0, w, h);
    bctx.imageSmoothingEnabled = true;

    bullets.forEach((b) => {
      const grad = bctx.createLinearGradient(b.x, b.y, b.x + 24, b.y);
      grad.addColorStop(0, 'rgba(255,255,255,0.2)');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, '#88ddff');
      bctx.strokeStyle = grad;
      bctx.lineWidth = 3;
      bctx.lineCap = 'round';
      bctx.beginPath();
      bctx.moveTo(b.x, b.y);
      bctx.lineTo(b.x + 22, b.y);
      bctx.stroke();
    });

    explosions.forEach((ex) => {
      const t = ex.life / 14;
      bctx.strokeStyle = `rgba(255, 200, 80, ${t})`;
      bctx.lineWidth = 2;
      bctx.beginPath();
      bctx.arc(ex.x, ex.y, (14 - ex.life) * 2.2, 0, Math.PI * 2);
      bctx.stroke();
    });
  }

  function loop(now) {
    if (!shouldRun()) {
      stop();
      return;
    }
    update(now);
    drawSprites();
    drawBullets();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (!shouldRun() || !mounted) return;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(rafId);
    if (!mounted) return;
    sctx.clearRect(0, 0, w, h);
    bctx.clearRect(0, 0, w, h);
  }

  function syncViewport() {
    if (!isWideScreen()) {
      unmountCanvases();
      return;
    }
    if (!mounted) {
      mountCanvases();
      resize();
    }
    if (shouldRun()) start();
    else stop();
  }

  document.addEventListener('mousemove', (e) => {
    if (!shouldRun()) return;
    player.targetY = Math.max(40, Math.min(e.clientY - 10, h - 50));
  });

  document.addEventListener('mousedown', (e) => {
    if (!shouldRun() || e.button !== 0) return;
    shoot();
  });

  window.addEventListener('resize', () => {
    if (mounted) resize();
    syncViewport();
  });

  WIDE_SCREEN_MQ.addEventListener('change', syncViewport);

  const themeObserver = new MutationObserver(syncViewport);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  function boot() {
    syncViewport();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
