/**
 * 右下角帧率显示（亮/暗共用，独立 rAF 计数）
 */
(function () {
  'use strict';

  var el = document.createElement('div');
  el.id = 'bg-fps';
  el.setAttribute('aria-hidden', 'true');
  el.textContent = '-- FPS';
  document.body.appendChild(el);

  var frames = 0;
  var last = performance.now();

  function tick(now) {
    frames++;
    if (now - last >= 500) {
      el.textContent = Math.round((frames * 1000) / (now - last)) + ' FPS';
      frames = 0;
      last = now;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
