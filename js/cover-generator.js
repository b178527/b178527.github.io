(() => {
  'use strict';

  const DEFAULT = {
    text: '半清安',
    watermark: '@ 半清安',
    fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
  };

  const loadedImages = new Map();
  let canvas = null;
  let ctx = null;
  let bgCanvas;
  let bgCtx;
  let textCanvas;
  let textCtx;
  let squareCanvas;
  let squareCtx;
  let watermarkCanvas;
  let watermarkCtx;

  const state = {
    bgImageUrl: null,
    squareImageUrl: null,
    bgColor: '#ffffff',
    textColor: '#eeeeee',
    watermarkColor: '#dddddd',
    iconColor: '#eeeeee',
    rotation: 0,
    shadowColor: '#646464',
    shadowBlur: 120,
    shadowOffsetX: 1,
    shadowOffsetY: 1,
    shadowStrength: 60,
    watermark: DEFAULT.watermark,
    textSize: 200,
    lineHeight: 1,
    text3D: 0,
    squareSize: 300,
    text: DEFAULT.text,
    bgBlur: 3,
    iconBgSize: 0,
    selectedFont: DEFAULT.fontFamily,
    hasMultipleLines: false,
  };

  const root = () => document.getElementById('cover-gen');
  const q = (sel) => root()?.querySelector(sel);

  const toast = (msg) => {
    if (typeof Snackbar !== 'undefined') {
      Snackbar.show({ text: msg, pos: 'top-center', duration: 2000 });
    }
  };

  const createCanvas = (width, height) => {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return { canvas: c, ctx: c.getContext('2d') };
  };

  const toggleExtraPanels = () => {
    q('#coverIconExtra')?.classList.toggle('show', !!state.squareImageUrl);
    q('#coverLineRow')?.classList.toggle('show', state.hasMultipleLines);
  };

  function composeCanvases() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.drawImage(textCanvas, 0, 0);
    ctx.drawImage(squareCanvas, 0, 0);
    ctx.drawImage(watermarkCanvas, 0, 0);
  }

  function loadImage(file, callback) {
    if (!file) return;
    if (!loadedImages.has(file)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        loadedImages.set(file, e.target.result);
        callback(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      callback(loadedImages.get(file));
    }
  }

  function drawBackground() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    if (state.bgImageUrl) {
      const img = new Image();
      img.onload = () => {
        const scaleX = bgCanvas.width / img.width;
        const scaleY = bgCanvas.height / img.height;
        const scale = Math.max(scaleX, scaleY);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (bgCanvas.width - width) / 2;
        const y = (bgCanvas.height - height) / 2;
        bgCtx.filter = `blur(${state.bgBlur}px)`;
        bgCtx.drawImage(img, x, y, width, height);
        bgCtx.filter = 'none';
        composeCanvases();
      };
      img.src = state.bgImageUrl;
    } else {
      bgCtx.fillStyle = state.bgColor;
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      composeCanvases();
    }
  }

  function drawSquareImage() {
    squareCtx.clearRect(0, 0, squareCanvas.width, squareCanvas.height);
    if (!state.squareImageUrl) {
      composeCanvases();
      return;
    }
    const squareImg = new Image();
    squareImg.onload = () => {
      const totalSize = state.squareSize;
      const borderWidth = 20;
      const size = totalSize - 2 * borderWidth;
      const x = (squareCanvas.width - totalSize) / 2;
      const y = (squareCanvas.height - totalSize) / 2;
      const radius = 30;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = totalSize;
      tempCanvas.height = totalSize;
      const tempCtx = tempCanvas.getContext('2d');

      if (state.iconBgSize > 0) {
        const bgPadding = state.iconBgSize;
        tempCtx.fillStyle = state.iconColor;
        tempCtx.beginPath();
        tempCtx.moveTo(radius + borderWidth - bgPadding, borderWidth - bgPadding);
        tempCtx.arcTo(totalSize - borderWidth + bgPadding, borderWidth - bgPadding, totalSize - borderWidth + bgPadding, radius + borderWidth - bgPadding, radius);
        tempCtx.arcTo(totalSize - borderWidth + bgPadding, totalSize - borderWidth + bgPadding, totalSize - radius - borderWidth + bgPadding, totalSize - borderWidth + bgPadding, radius);
        tempCtx.arcTo(borderWidth - bgPadding, totalSize - borderWidth + bgPadding, borderWidth - bgPadding, totalSize - radius - borderWidth + bgPadding, radius);
        tempCtx.arcTo(borderWidth - bgPadding, borderWidth - bgPadding, radius + borderWidth - bgPadding, borderWidth - bgPadding, radius);
        tempCtx.closePath();
        tempCtx.fill();
      }

      tempCtx.save();
      tempCtx.beginPath();
      tempCtx.moveTo(radius + borderWidth, borderWidth);
      tempCtx.arcTo(totalSize - borderWidth, borderWidth, totalSize - borderWidth, radius + borderWidth, radius);
      tempCtx.arcTo(totalSize - borderWidth, totalSize - borderWidth, totalSize - radius - borderWidth, totalSize - borderWidth, radius);
      tempCtx.arcTo(borderWidth, totalSize - borderWidth, borderWidth, totalSize - radius - borderWidth, radius);
      tempCtx.arcTo(borderWidth, borderWidth, radius + borderWidth, borderWidth, radius);
      tempCtx.closePath();
      tempCtx.clip();

      const imgAspectRatio = squareImg.width / squareImg.height;
      let scaledWidth;
      let scaledHeight;
      if (imgAspectRatio > 1) {
        scaledWidth = size;
        scaledHeight = size / imgAspectRatio;
      } else {
        scaledWidth = size * imgAspectRatio;
        scaledHeight = size;
      }
      const offsetX = (size - scaledWidth) / 2;
      const offsetY = (size - scaledHeight) / 2;
      tempCtx.drawImage(squareImg, borderWidth + offsetX, borderWidth + offsetY, scaledWidth, scaledHeight);
      tempCtx.restore();

      squareCtx.save();
      squareCtx.shadowColor = state.shadowColor;
      squareCtx.shadowBlur = state.shadowBlur;
      squareCtx.shadowOffsetX = state.shadowOffsetX;
      squareCtx.shadowOffsetY = state.shadowOffsetY;
      squareCtx.translate(x + totalSize / 2, y + totalSize / 2);
      squareCtx.rotate((state.rotation * Math.PI) / 180);
      squareCtx.translate(-(x + totalSize / 2), -(y + totalSize / 2));
      squareCtx.drawImage(tempCanvas, x, y, totalSize, totalSize);
      squareCtx.restore();
      composeCanvases();
    };
    squareImg.src = state.squareImageUrl;
  }

  function getHtmlFontStyles() {
    const computedStyle = getComputedStyle(document.documentElement);
    return { fontFamily: computedStyle.fontFamily };
  }

  function drawText() {
    textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    const { fontFamily } = getHtmlFontStyles();
    const font = state.selectedFont ? `${state.selectedFont}, ${fontFamily}` : fontFamily;
    textCtx.font = `600 ${state.textSize}px ${font}`;
    textCtx.fillStyle = state.textColor;
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';

    if (state.text3D > 0) {
      textCtx.shadowColor = 'rgba(0, 0, 0, .4)';
      textCtx.shadowBlur = state.text3D * 0.5;
      textCtx.shadowOffsetX = state.text3D;
      textCtx.shadowOffsetY = state.text3D;
    } else {
      textCtx.shadowColor = 'transparent';
      textCtx.shadowBlur = 0;
      textCtx.shadowOffsetX = 0;
      textCtx.shadowOffsetY = 0;
    }

    const lines = state.text.split('\n');
    const lineHeight = state.textSize * state.lineHeight;
    const totalHeight = lineHeight * lines.length;
    const startY = (textCanvas.height - totalHeight) / 2 + lineHeight / 2;
    lines.forEach((line, index) => {
      textCtx.fillText(line, textCanvas.width / 2, startY + index * lineHeight);
    });
    composeCanvases();
  }

  function drawWatermark() {
    watermarkCtx.clearRect(0, 0, watermarkCanvas.width, watermarkCanvas.height);
    const { fontFamily } = getHtmlFontStyles();
    const font = state.selectedFont ? `${state.selectedFont}, ${fontFamily}` : fontFamily;
    watermarkCtx.font = `italic 14px ${font}`;
    watermarkCtx.fillStyle = state.watermarkColor;
    watermarkCtx.textAlign = 'right';
    watermarkCtx.fillText(state.watermark, watermarkCanvas.width - 20, watermarkCanvas.height - 20);
    composeCanvases();
  }

  function updatePreview(type, event) {
    const handlers = {
      bg: () => {
        const file = event.target.files?.[0];
        if (file) loadImage(file, (url) => { state.bgImageUrl = url; drawBackground(); });
      },
      bgColor: () => {
        state.bgColor = event.target.value;
        state.bgImageUrl = null;
        drawBackground();
      },
      textColor: () => { state.textColor = event.target.value; drawText(); },
      watermarkColor: () => { state.watermarkColor = event.target.value; drawWatermark(); },
      square: () => {
        const file = event.target.files?.[0];
        if (file) {
          loadImage(file, (url) => {
            state.squareImageUrl = url;
            toggleExtraPanels();
            drawSquareImage();
          });
        }
      },
      rotation: () => { state.rotation = event.target.value; drawSquareImage(); },
      text: () => {
        state.text = event.target.value || DEFAULT.text;
        state.hasMultipleLines = state.text.includes('\n');
        toggleExtraPanels();
        drawText();
      },
      watermark: () => { state.watermark = event.target.value; drawWatermark(); },
      textSize: () => { state.textSize = event.target.value; drawText(); },
      squareSize: () => { state.squareSize = event.target.value; drawSquareImage(); },
      bgBlur: () => { state.bgBlur = event.target.value; drawBackground(); },
      iconColor: () => { state.iconColor = event.target.value; drawSquareImage(); },
      iconBgSize: () => { state.iconBgSize = Number(event.target.value); drawSquareImage(); },
      font: () => { state.selectedFont = event.target.value; drawText(); drawWatermark(); },
      lineHeight: () => { state.lineHeight = Number(event.target.value); drawText(); },
      text3D: () => { state.text3D = Number(event.target.value); drawText(); },
      shadowColor: () => { state.shadowColor = event.target.value; drawSquareImage(); },
      shadowStrength: () => {
        state.shadowStrength = Number(event.target.value);
        state.shadowBlur = state.shadowStrength * 2;
        state.shadowOffsetX = 0;
        state.shadowOffsetY = 0;
        drawSquareImage();
      },
    };
    handlers[type]?.();
  }

  function saveWebp() {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cover-${Date.now()}.webp`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast('封面已保存');
    }, 'image/webp');
  }

  function resetAll() {
    state.bgImageUrl = null;
    state.squareImageUrl = null;
    state.bgColor = '#ffffff';
    state.textColor = '#eeeeee';
    state.watermarkColor = '#dddddd';
    state.iconColor = '#eeeeee';
    state.shadowColor = '#646464';
    state.rotation = 0;
    state.shadowStrength = 60;
    state.shadowBlur = 120;
    state.watermark = DEFAULT.watermark;
    state.textSize = 200;
    state.lineHeight = 1;
    state.text3D = 0;
    state.squareSize = 300;
    state.text = DEFAULT.text;
    state.bgBlur = 3;
    state.iconBgSize = 0;
    state.selectedFont = DEFAULT.fontFamily;
    state.hasMultipleLines = false;

    const setVal = (id, val) => { const el = q(`#${id}`); if (el) el.value = val; };
    setVal('inputIconName', '');
    setVal('inputTextColor', state.textColor);
    setVal('inputWatermarkColor', state.watermarkColor);
    setVal('inputBgColor', state.bgColor);
    setVal('inputShadowColor', state.shadowColor);
    setVal('inputIconColor', state.iconColor);
    setVal('inputBgBlur', state.bgBlur);
    setVal('inputSquareSize', state.squareSize);
    setVal('inputRotation', state.rotation);
    setVal('inputShadowStrength', state.shadowStrength);
    setVal('inputIconBgSize', state.iconBgSize);
    setVal('inputTextSize', state.textSize);
    setVal('inputLineHeight', state.lineHeight);
    setVal('input3D', state.text3D);
    setVal('inputFont', state.selectedFont);
    setVal('inputText', state.text);
    setVal('inputWatermark', state.watermark);

    toggleExtraPanels();
    drawBackground();
    drawText();
    drawWatermark();
    drawSquareImage();
    toast('已重置');
  }

  async function loadIcon(name) {
    const trimmed = name.trim();
    if (!trimmed) {
      state.squareImageUrl = null;
      toggleExtraPanels();
      drawSquareImage();
      return;
    }
    try {
      const res = await fetch(`https://api.iconify.design/${trimmed}.svg`);
      if (!res.ok) throw new Error('图标未找到');
      const blob = await res.blob();
      const file = new File([blob], 'icon.svg', { type: 'image/svg+xml' });
      loadImage(file, (url) => {
        state.squareImageUrl = url;
        toggleExtraPanels();
        drawSquareImage();
      });
    } catch (err) {
      toast(err.message || '加载图标失败');
    }
  }

  function getDropArea(event) {
    const c = q('#canvasPreview');
    if (!c) return 'bg';
    const rect = c.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const distance = Math.hypot(x - centerX, y - centerY);
    return distance < 100 ? 'icon' : 'bg';
  }

  function bindCanvasDrag() {
    const c = q('#canvasPreview');
    const iconHint = q('#coverDragIcon');
    const bgHint = q('#coverDragBg');
    if (!c || c.dataset.dragBound) return;
    c.dataset.dragBound = '1';

    c.addEventListener('dragover', (e) => {
      e.preventDefault();
      const area = getDropArea(e);
      iconHint?.classList.toggle('hidden', area !== 'icon');
      bgHint?.classList.toggle('hidden', area !== 'bg');
    });

    c.addEventListener('dragleave', () => {
      iconHint?.classList.add('hidden');
      bgHint?.classList.add('hidden');
    });

    c.addEventListener('drop', (e) => {
      e.preventDefault();
      iconHint?.classList.add('hidden');
      bgHint?.classList.add('hidden');
      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      const area = getDropArea(e);
      updatePreview(area === 'icon' ? 'square' : 'bg', { target: { files: [file] } });
    });
  }

  function bindControls() {
    const r = root();
    if (!r || r.dataset.controlsBound) return;
    r.dataset.controlsBound = '1';

    q('#inputBgImage')?.addEventListener('change', (e) => updatePreview('bg', e));
    q('#inputSquareImage')?.addEventListener('change', (e) => updatePreview('square', e));
    q('#inputBgColor')?.addEventListener('input', (e) => updatePreview('bgColor', e));
    q('#inputTextColor')?.addEventListener('input', (e) => updatePreview('textColor', e));
    q('#inputWatermarkColor')?.addEventListener('input', (e) => updatePreview('watermarkColor', e));
    q('#inputIconColor')?.addEventListener('input', (e) => updatePreview('iconColor', e));
    q('#inputShadowColor')?.addEventListener('input', (e) => updatePreview('shadowColor', e));
    q('#inputBgBlur')?.addEventListener('input', (e) => updatePreview('bgBlur', e));
    q('#inputSquareSize')?.addEventListener('input', (e) => updatePreview('squareSize', e));
    q('#inputRotation')?.addEventListener('input', (e) => updatePreview('rotation', e));
    q('#inputShadowStrength')?.addEventListener('input', (e) => updatePreview('shadowStrength', e));
    q('#inputIconBgSize')?.addEventListener('input', (e) => updatePreview('iconBgSize', e));
    q('#inputTextSize')?.addEventListener('input', (e) => updatePreview('textSize', e));
    q('#inputLineHeight')?.addEventListener('input', (e) => updatePreview('lineHeight', e));
    q('#input3D')?.addEventListener('input', (e) => updatePreview('text3D', e));
    q('#inputFont')?.addEventListener('change', (e) => updatePreview('font', e));
    q('#inputText')?.addEventListener('input', (e) => updatePreview('text', e));
    q('#inputWatermark')?.addEventListener('input', (e) => updatePreview('watermark', e));
    q('#inputIconName')?.addEventListener('input', (e) => loadIcon(e.target.value));

    r.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      e.preventDefault();
      if (btn.dataset.act === 'save') saveWebp();
      if (btn.dataset.act === 'reset') resetAll();
      if (btn.dataset.act === 'open' && btn.dataset.url) {
        window.open(btn.dataset.url, '_blank', 'noopener');
      }
    });
  }

  function initCoverGen() {
    const r = root();
    if (!r || r.dataset.ready) return;

    canvas = q('#canvasPreview');
    if (!canvas) return;

    r.dataset.ready = '1';
    ctx = canvas.getContext('2d');

    ({ canvas: bgCanvas, ctx: bgCtx } = createCanvas(1000, 500));
    ({ canvas: textCanvas, ctx: textCtx } = createCanvas(1000, 500));
    ({ canvas: squareCanvas, ctx: squareCtx } = createCanvas(1000, 500));
    ({ canvas: watermarkCanvas, ctx: watermarkCtx } = createCanvas(1000, 500));

    bindControls();
    bindCanvasDrag();
    toggleExtraPanels();
    drawBackground();
    drawText();
    drawWatermark();
    drawSquareImage();
  }

  ['DOMContentLoaded', 'pjax:complete'].forEach((event) => {
    document.addEventListener(event, initCoverGen);
  });
})();
