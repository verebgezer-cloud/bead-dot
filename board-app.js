(() => {
  const COLORS = window.MARD221_COLORS;
  const COLOR_INDEX = new Map(COLORS.map((color, index) => [color.code, index]));
  const colorAt = (code) => COLOR_INDEX.get(code) ?? 0;
  function toLab(hex) {
    const srgb = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const [r, g, b] = srgb;
    const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
    const y = (r * 0.2126729 + g * 0.7151522 + b * 0.072175) / 1.0;
    const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883;
    const f = (v) => v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116;
    const fx = f(x), fy = f(y), fz = f(z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }
  const LAB = COLORS.map((color) => toLab(color.hex));
  const state = {
    boardSize: 52,
    patternLongSide: 52,
    designWidth: 52,
    designHeight: 52,
    aspectRatio: 1,
    fit: "contain",
    showGrid: true,
    assistant: false,
    editing: false,
    editTool: "paint",
    editColor: colorAt("H1"),
    designOrigin: null,
    undoHistory: [],
    redoHistory: [],
    activeStroke: null,
    activePan: null,
    contrast: 0,
    saturation: 0,
    removeBackground: true,
    fillInterior: true,
    zoom: 1,
    colorFilter: null,
    guideSteps: [],
    guideIndex: 0,
    pattern: [],
    sourceImage: null,
    sourceFile: null,
    sourceAspectRatio: 1,
    pixelArtImage: null,
    pixelArtUrl: "",
    pixelArtPlacement: null,
    pixelArtZoom: 1,
    pixelArtShowGrid: true,
    pixelArtPan: null,
    aiBusy: false,
    imageLoading: false,
    aiController: null,
    aiRequestId: 0,
    toastTimer: 0,
    reprocessTimer: 0,
  };
  const $ = (selector) => document.querySelector(selector);
  const canvas = $("#patternCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const canvasScroller = $("#canvasScroller");
  const pixelArtCanvas = $("#pixelArtCanvas");
  const pixelArtContext = pixelArtCanvas.getContext("2d", { alpha: false });
  const pixelArtScroller = $("#pixelArtScroller");
  const paletteList = $("#paletteList");
  const pixelArtEndpoint = String(window.PIXEL_ART_API_URL || "").trim();
  let lastUsedSignature = "";

  function updatePixelArtUI() {
    const button = $("#generateAiButton");
    const preview = $("#pixelArtPreviewPanel");
    button.disabled = !state.sourceImage || !pixelArtEndpoint || state.aiBusy || state.imageLoading;
    button.textContent = state.aiBusy ? "像素画生成中…" : "生成像素画并更新图纸";
    preview.hidden = !state.pixelArtImage;
    $(".workspace").classList.toggle("has-pixel-art", Boolean(state.pixelArtImage));
    $("#pixelGridToggle").classList.toggle("active", state.pixelArtShowGrid);
    $("#pixelGridToggle").setAttribute("aria-pressed", String(state.pixelArtShowGrid));
    if (!state.pixelArtImage) {
      finishPixelArtPan();
      pixelArtCanvas.width = pixelArtCanvas.height = 1;
    }
    $("#pixelArtStatus").textContent = state.aiBusy
      ? "AI 正在保留主体轮廓并转换为清晰像素风格，完成后会自动映射 MARD 色号。"
      : state.pixelArtImage
        ? "像素画已生成，图纸中的每格已重新匹配 MARD 色号。"
        : !state.sourceImage
          ? "上传图片后，可先生成像素画，再逐格匹配 MARD 色号。"
          : !pixelArtEndpoint
            ? "AI 像素画接口尚未配置；当前逐格取色和 MARD 图纸功能仍可使用。"
            : "先生成清晰的像素画，再为每格匹配 MARD 色号。";
  }

  function makeDemo(width, height) {
    clearEditHistory();
    const background = colorAt("H1"), fill = colorAt("M1"), edge = colorAt("H7");
    const eye = colorAt("H7"), nose = colorAt("F2"), ear = colorAt("G4");
    state.designWidth = width;
    state.designHeight = height;
    state.pattern = Array.from({ length: width * height }, (_, index) => {
      const x = index % width, y = Math.floor(index / width);
      const nx = (x - (width - 1) / 2) / width, ny = (y - (height - 1) / 2) / height;
      const shape = nx * nx / 0.16 + ny * ny / 0.2;
      if (shape > 1) return background;
      if (Math.abs(nx) > 0.26 && ny < -0.28 && ny > -0.48) return ear;
      if (Math.abs(nx) < 0.13 && ny > 0.08 && ny < 0.18) return nose;
      if (Math.abs(nx) > 0.23 && Math.abs(nx) < 0.36 && ny > -0.17 && ny < -0.02) return eye;
      return shape > 0.87 ? edge : fill;
    });
  }

  function boardMargin(size) { return size === 52 || size === 78 ? 1 : 2; }

  function dimensionsForLongSide(longSide, ratio) {
    const side = Math.max(1, Math.round(longSide));
    const aspect = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
    return aspect >= 1
      ? { width: side, height: Math.max(1, Math.round(side / aspect)) }
      : { width: Math.max(1, Math.round(side * aspect)), height: side };
  }

  function updateBoardUI() {
    const size = state.boardSize;
    const margin = boardMargin(size);
    document.querySelectorAll("[data-board]").forEach((button) => {
      const board = Number(button.dataset.board);
      button.classList.toggle("active", board === size);
      button.disabled = board < state.patternLongSide;
      button.title = button.disabled ? `当前图案最长边为 ${state.patternLongSide} 格，请先缩小图案` : "";
    });
    $("#boardDescription").textContent = `四周各留 ${margin} 圈豆点；内区每 5 格一条分割线。`;
    $("#patternSizeRange").max = String(size);
    $("#boardLimit").textContent = `最长边 12–${size} 格，宽高按原图比例；换豆板不会自动缩放`;
    updateDesignUI();
  }

  function updateDesignUI() {
    $("#designSizeReadout").textContent = `${state.designWidth} × ${state.designHeight} 格`;
    $("#patternSizeReadout").textContent = String(state.patternLongSide);
    $("#patternSizeRange").value = String(state.patternLongSide);
    $("#canvasDimensions").textContent = `${state.boardSize} × ${state.boardSize}`;
    $("#pixelCanvasDimensions").textContent = `${state.boardSize} × ${state.boardSize}`;
    $("#canvasMetaSize").textContent = `豆板 ${state.boardSize} × ${state.boardSize} · 图案 ${state.designWidth} × ${state.designHeight}`;
  }

  function flushPendingPatternResize() {
    if (!state.reprocessTimer) return;
    clearTimeout(state.reprocessTimer);
    state.reprocessTimer = 0;
    if (state.sourceImage) {
      applyImage();
      renderAll();
    }
  }

  function setBoardSize(size) {
    if (![52, 78, 104, 120].includes(size)) return;
    if (size === state.boardSize) return;
    if (size < state.patternLongSide) {
      toast(`当前图案最长边为 ${state.patternLongSide} 格，请先缩小图案`);
      return;
    }
    clearEditHistory();
    state.boardSize = size;
    updateBoardUI();
    renderAll();
  }

  function offset() {
    if (state.designOrigin) return state.designOrigin;
    return { x: Math.floor((state.boardSize - state.designWidth) / 2), y: Math.floor((state.boardSize - state.designHeight) / 2) };
  }

  function cellSize(scroller = canvasScroller, zoomKey = "zoom") {
    const preferred = state.boardSize === 52 ? 18 : 14;
    if (!scroller.clientWidth || !scroller.clientHeight) return preferred;
    const style = getComputedStyle(scroller);
    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const available = Math.max(1, Math.min(
      (scroller.clientWidth - paddingX) / state.boardSize,
      (scroller.clientHeight - paddingY) / state.boardSize,
    ));
    const fitted = Math.max(1, Math.min(preferred, available));
    state[zoomKey] = Math.min(state[zoomKey], 32 / fitted);
    return Math.max(1, fitted * state[zoomKey]);
  }
  function codeFontSize(cell) { return Math.max(4, Math.min(15, cell * 0.72)); }

  function readableText(hex) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 > 168 ? "#202820" : "#ffffff";
  }

  function drawBoardGrid(target, cell, drawCodes = true, drawGrid = true, codeFilter = null) {
    const w = state.boardSize * cell, h = state.boardSize * cell;
    if (drawGrid) {
      target.beginPath();
      target.strokeStyle = "rgba(53, 59, 52, .22)";
      target.lineWidth = 0.65;
      for (let x = 0; x <= state.boardSize; x += 1) { target.moveTo(x * cell + 0.35, 0); target.lineTo(x * cell + 0.35, h); }
      for (let y = 0; y <= state.boardSize; y += 1) { target.moveTo(0, y * cell + 0.35); target.lineTo(w, y * cell + 0.35); }
      target.stroke();

      const margin = boardMargin(state.boardSize);
      const inner = state.boardSize - margin * 2;
      target.beginPath();
      target.strokeStyle = "rgba(29, 34, 30, .78)";
      target.lineWidth = Math.max(1.4, cell * 0.13);
      for (let n = 0; n <= inner; n += 5) {
        const p = margin + n;
        target.moveTo(p * cell + 0.5, margin * cell);
        target.lineTo(p * cell + 0.5, (state.boardSize - margin) * cell);
        target.moveTo(margin * cell, p * cell + 0.5);
        target.lineTo((state.boardSize - margin) * cell, p * cell + 0.5);
      }
      if (inner % 5 !== 0) {
        const p = state.boardSize - margin;
        target.moveTo(p * cell + 0.5, margin * cell);
        target.lineTo(p * cell + 0.5, (state.boardSize - margin) * cell);
        target.moveTo(margin * cell, p * cell + 0.5);
        target.lineTo((state.boardSize - margin) * cell, p * cell + 0.5);
      }
      target.stroke();
      target.lineWidth = Math.max(1.8, cell * 0.16);
      target.strokeRect(0.5, 0.5, w - 1, h - 1);
    }

    if (drawCodes) {
      const pos = offset();
      target.textAlign = "center";
      target.textBaseline = "middle";
      target.font = `600 ${codeFontSize(cell)}px "DM Mono", monospace`;
      for (let y = 0; y < state.designHeight; y += 1) {
        for (let x = 0; x < state.designWidth; x += 1) {
          const colorIndex = state.pattern[y * state.designWidth + x];
          if (colorIndex < 0) continue;
          const color = COLORS[colorIndex] || COLORS[0];
          if (codeFilter && !codeFilter(color, x, y)) continue;
          target.fillStyle = readableText(color.hex);
          target.fillText(color.code, (pos.x + x + 0.5) * cell, (pos.y + y + 0.5) * cell, cell + 1);
        }
      }
    }
  }

  function stepAt(index) { return state.guideSteps[index] || null; }

  function drawPixelArtPreview() {
    flushPendingPatternResize();
    if (!state.pixelArtImage || $("#pixelArtPreviewPanel").hidden) return;
    const cell = cellSize(pixelArtScroller, "pixelArtZoom");
    const boardPx = state.boardSize * cell;
    // The reference has no color labels, so a smaller bitmap keeps two boards light on mobile.
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1, 2048 / boardPx);
    pixelArtCanvas.width = Math.round(boardPx * pixelRatio);
    pixelArtCanvas.height = Math.round(boardPx * pixelRatio);
    pixelArtCanvas.style.width = `${boardPx}px`;
    pixelArtCanvas.style.height = `${boardPx}px`;
    pixelArtContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    pixelArtContext.fillStyle = "#fff";
    pixelArtContext.fillRect(0, 0, boardPx, boardPx);
    const placement = state.pixelArtPlacement || { width: state.designWidth, height: state.designHeight, x: 0, y: 0 };
    const pos = offset();
    const left = (pos.x + placement.x) * cell, top = (pos.y + placement.y) * cell;
    const width = placement.width * cell, height = placement.height * cell;
    const image = state.pixelArtImage;
    const scale = state.fit === "cover"
      ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
      : Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const imageWidth = image.naturalWidth * scale, imageHeight = image.naturalHeight * scale;
    pixelArtContext.save();
    pixelArtContext.beginPath();
    pixelArtContext.rect(left, top, width, height);
    pixelArtContext.clip();
    pixelArtContext.imageSmoothingEnabled = false;
    pixelArtContext.drawImage(image, left + (width - imageWidth) / 2, top + (height - imageHeight) / 2, imageWidth, imageHeight);
    pixelArtContext.restore();
    drawBoardGrid(pixelArtContext, cell, false, state.pixelArtShowGrid);
    pixelArtCanvas.setAttribute("aria-label", `AI 像素画参考，${state.boardSize} × ${state.boardSize} 豆板，图案 ${placement.width} × ${placement.height} 格`);
  }

  function finishPixelArtPan() {
    const pointerId = state.pixelArtPan?.pointerId;
    state.pixelArtPan = null;
    pixelArtCanvas.classList.remove("dragging");
    if (pointerId !== undefined && pixelArtCanvas.hasPointerCapture?.(pointerId)) pixelArtCanvas.releasePointerCapture(pointerId);
  }

  function zoomPixelArt(factor) {
    finishPixelArtPan();
    state.pixelArtZoom = factor === null ? 1 : Math.max(0.55, Math.min(12, state.pixelArtZoom * factor));
    drawPixelArtPreview();
    if (factor === null) pixelArtScroller.scrollLeft = pixelArtScroller.scrollTop = 0;
  }

  function drawPattern() {
    flushPendingPatternResize();
    const cell = cellSize(), boardPx = state.boardSize * cell, pos = offset();
    // Keep enlarged boards within the canvas memory limit of mobile browsers.
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1, 4096 / boardPx);
    canvas.width = Math.round(boardPx * pixelRatio);
    canvas.height = Math.round(boardPx * pixelRatio);
    canvas.style.width = `${boardPx}px`;
    canvas.style.height = `${boardPx}px`;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, boardPx, boardPx);
    for (let y = 0; y < state.designHeight; y += 1) {
      for (let x = 0; x < state.designWidth; x += 1) {
        const colorIndex = state.pattern[y * state.designWidth + x];
        if (colorIndex < 0) continue;
        if (state.assistant && state.colorFilter !== null && colorIndex !== state.colorFilter) continue;
        ctx.fillStyle = COLORS[colorIndex]?.hex || "#fff";
        ctx.fillRect((pos.x + x) * cell, (pos.y + y) * cell, cell, cell);
      }
    }
    if (state.assistant) {
      const step = stepAt(state.guideIndex);
      if (state.colorFilter === null) {
        ctx.fillStyle = "rgba(255,255,255,.78)";
        ctx.fillRect(pos.x * cell, pos.y * cell, state.designWidth * cell, state.designHeight * cell);
      }
      if (step && state.colorFilter === null) {
        ctx.fillStyle = step.hex;
        step.cells.forEach((index) => {
          const x = index % state.designWidth, y = Math.floor(index / state.designWidth);
          ctx.fillRect((pos.x + x) * cell, (pos.y + y) * cell, cell, cell);
        });
      }
    }
    const codeFilter = state.assistant && state.colorFilter !== null
      ? (color) => COLOR_INDEX.get(color.code) === state.colorFilter
      : null;
    drawBoardGrid(ctx, cell, !state.assistant || state.colorFilter !== null, state.showGrid, codeFilter);
    if (state.assistant && state.colorFilter === null) {
      const step = stepAt(state.guideIndex);
      if (step) {
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = `700 ${codeFontSize(cell)}px "DM Mono", monospace`;
        ctx.fillStyle = readableText(step.hex);
        step.cells.forEach((index) => {
          const x = index % state.designWidth, y = Math.floor(index / state.designWidth);
          ctx.fillText(step.code, (pos.x + x + .5) * cell, (pos.y + y + .5) * cell, cell + 1);
        });
      }
    }
    drawPixelArtPreview();
  }

  function countColors() {
    const counts = new Uint32Array(COLORS.length);
    state.pattern.forEach((index) => { if (index >= 0) counts[index] += 1; });
    return counts;
  }

  function renderPalette() {
    flushPendingPatternResize();
    const counts = countColors();
    const usedIndices = COLORS.map((_, index) => index).filter((index) => counts[index] > 0);
    lastUsedSignature = usedIndices.join(",");
    paletteList.innerHTML = usedIndices.length ? usedIndices.map((index) => {
      const color = COLORS[index];
      const filtered = state.assistant && state.colorFilter === index;
      const selected = state.editing && state.editColor === index;
      return `<button class="color-row${filtered ? " filter-active" : ""}${selected ? " edit-selected" : ""}" type="button" role="listitem" data-color="${index}" aria-pressed="${filtered || selected}" aria-label="${color.code}，${color.family}${state.editing ? "，点击用此色绘制" : state.assistant ? "，点击筛选此色" : "，请先开启辅助拼豆或手动修改"}"><span class="color-swatch" style="background:${color.hex}"></span><span class="color-info"><strong>${color.code} · ${color.family}</strong><span class="color-code">MARD 221 · ${color.hex}</span></span><span class="color-quantity">${counts[index]}<small>颗</small></span></button>`;
    }).join("") : '<p class="empty-palette">图纸暂未使用任何 MARD 色号。</p>';
    paletteList.querySelectorAll("[data-color]").forEach((button) => button.addEventListener("click", () => {
      const index = Number(button.dataset.color);
      if (state.editing) {
        state.editColor = index;
        state.editTool = "paint";
        updateEditUI();
        renderPalette();
        return;
      }
      if (!state.assistant) {
        toast("开启手动修改可选色绘制；开启辅助拼豆可筛选色号");
        return;
      }
      state.colorFilter = state.colorFilter === index ? null : index;
      updateAssistant();
      renderPalette();
      drawPattern();
    }));
    updateCounts();
  }

  function updateCounts() {
    const counts = countColors();
    const signature = COLORS.map((_, index) => index).filter((index) => counts[index] > 0).join(",");
    if (signature !== lastUsedSignature) {
      renderPalette();
      return;
    }
    let used = 0;
    COLORS.forEach((_, index) => {
      if (counts[index]) used += 1;
      const row = paletteList.querySelector(`[data-color="${index}"]`);
      if (row) row.querySelector(".color-quantity").innerHTML = `${counts[index]}<small>颗</small>`;
    });
    const totalBeads = counts.reduce((sum, count) => sum + count, 0);
    $("#totalCount").textContent = totalBeads.toLocaleString("zh-CN");
    $("#usedColors").textContent = String(used);
    $("#paletteCount").textContent = `${used} USED`;
  }

  function layerOf(x, y, width, height) { return Math.min(x, y, width - 1 - x, height - 1 - y); }

  function buildGuideSteps() {
    const groups = new Map();
    for (let y = 0; y < state.designHeight; y += 1) {
      for (let x = 0; x < state.designWidth; x += 1) {
        const colorIndex = state.pattern[y * state.designWidth + x];
        if (colorIndex < 0) continue;
        const layer = layerOf(x, y, state.designWidth, state.designHeight);
        if (!groups.has(colorIndex)) groups.set(colorIndex, { layer, cells: [] });
        const group = groups.get(colorIndex);
        group.layer = Math.min(group.layer, layer);
        group.cells.push(y * state.designWidth + x);
      }
    }
    return [...groups.entries()]
      .sort((a, b) => a[1].layer - b[1].layer || a[0] - b[0])
      .map(([colorIndex, group]) => ({
        layer: group.layer,
        colorIndex,
        code: COLORS[colorIndex].code,
        hex: COLORS[colorIndex].hex,
        cells: group.cells,
      }));
  }

  function updateAssistant() {
    flushPendingPatternResize();
    const panel = $("#assistantPanel");
    panel.hidden = !state.assistant;
    if (!state.assistant) return;
    const currentColorIndex = stepAt(state.guideIndex)?.colorIndex ?? null;
    state.guideSteps = buildGuideSteps();
    let next = currentColorIndex === null ? -1 : state.guideSteps.findIndex((step) => step.colorIndex === currentColorIndex);
    if (next >= 0) state.guideIndex = next;
    else state.guideIndex = Math.min(state.guideIndex, Math.max(0, state.guideSteps.length - 1));
    const step = stepAt(state.guideIndex);
    if (!step) {
      $("#assistantStep").textContent = "沒有可拼的珠子";
      $("#assistantLayer").textContent = "完成";
      $("#assistantCode").textContent = "—";
      $("#assistantCount").textContent = "";
      $("#assistantSwatch").style.background = "#fff";
      $("#previousStep").disabled = true;
      $("#nextStep").disabled = true;
      return;
    }
    $("#assistantStep").textContent = `第 ${state.guideIndex + 1} / ${state.guideSteps.length} 个色号`;
    if (state.colorFilter !== null) {
      const color = COLORS[state.colorFilter];
      const count = countColors()[state.colorFilter];
      $("#assistantLayer").textContent = "单色筛选";
      $("#assistantCode").textContent = color.code;
      $("#assistantCount").textContent = `${count} 颗 · 再点该色号恢复全图`;
      $("#assistantSwatch").style.background = color.hex;
    } else {
      $("#assistantLayer").textContent = "全图完整色号";
      $("#assistantCode").textContent = step.code;
      $("#assistantCount").textContent = `${step.cells.length} 颗 · 本色全部位置`;
      $("#assistantSwatch").style.background = step.hex;
    }
    $("#previousStep").disabled = state.guideIndex === 0;
    $("#nextStep").disabled = state.guideIndex >= state.guideSteps.length - 1;
  }

  function updateSubtitle() {
    $("#canvasSubtitle").textContent = state.sourceImage
      ? `像素画 ${state.designWidth} × ${state.designHeight} 格 · 每格匹配一个 MARD 色号`
      : "上传图片后调整最长边格数，每格按对应图像区域匹配 MARD 色号";
  }

  function renderAll() {
    if (state.assistant) updateAssistant();
    drawPattern();
    updateCounts();
    updateSubtitle();
    updateEditUI();
  }

  function updateEditUI() {
    const toggle = $("#editToggle");
    if (!toggle) return;
    const color = COLORS[state.editColor];
    toggle.classList.toggle("active", state.editing);
    toggle.setAttribute("aria-pressed", String(state.editing));
    $("#editorToolbar").hidden = !state.editing;
    $("#editColor").value = String(state.editColor);
    $("#editSwatch").style.background = color.hex;
    $("#editSwatch").title = `${color.code} · ${color.hex}`;
    ["paint", "erase", "pick", "pan"].forEach((tool) => {
      const button = $(`#${tool}Tool`);
      if (!button) return;
      button.classList.toggle("active", state.editTool === tool);
      button.setAttribute("aria-pressed", String(state.editTool === tool));
    });
    $("#undoEdit").disabled = !state.undoHistory.length || Boolean(state.activeStroke);
    $("#redoEdit").disabled = !state.redoHistory.length || Boolean(state.activeStroke);
    const toolHint = state.editTool === "pan"
      ? "拖动浏览放大的图纸"
      : state.editTool === "erase"
      ? "点按或拖动移除豆点"
      : state.editTool === "pick"
        ? "点按格子吸取色号"
        : `${color.code} · 点按或拖动改色`;
    $("#editHint").textContent = `${toolHint}；重新生成或调整图片设置会覆盖修改`;
    canvas.classList.toggle("editing", state.editing && state.editTool !== "pan");
    canvas.classList.toggle("picking", state.editing && state.editTool === "pick");
    canvas.classList.toggle("panning", state.editing && state.editTool === "pan");
    canvas.classList.toggle("dragging", Boolean(state.activePan));
    canvas.setAttribute("aria-label", state.editing
      ? "可编辑拼豆图纸，选择色号后点按或拖动格子"
      : "拼豆图纸画布，格内显示 MARD 色号");
  }

  function setEditing(enabled) {
    finishEditStroke();
    flushPendingPatternResize();
    state.editing = enabled;
    if (enabled) {
      state.assistant = false;
      state.colorFilter = null;
      $("#assistantToggle").checked = false;
      updateAssistant();
    }
    updateEditUI();
    renderPalette();
    drawPattern();
  }

  function editSnapshot() {
    return {
      pattern: state.pattern.slice(),
      width: state.designWidth,
      height: state.designHeight,
      longSide: state.patternLongSide,
      origin: state.designOrigin ? { ...state.designOrigin } : null,
      pixelArtPlacement: state.pixelArtPlacement ? { ...state.pixelArtPlacement } : null,
    };
  }

  function restoreEditSnapshot(snapshot) {
    state.pattern = snapshot.pattern;
    state.designWidth = snapshot.width;
    state.designHeight = snapshot.height;
    state.patternWidth = snapshot.width;
    state.patternHeight = snapshot.height;
    state.patternLongSide = snapshot.longSide;
    state.designOrigin = snapshot.origin;
    state.pixelArtPlacement = snapshot.pixelArtPlacement;
    updateBoardUI();
    renderAll();
  }

  function clearEditHistory() {
    finishPan();
    const pointerId = state.activeStroke?.pointerId;
    state.activeStroke = null;
    if (pointerId !== undefined && canvas.hasPointerCapture?.(pointerId)) canvas.releasePointerCapture(pointerId);
    state.undoHistory = [];
    state.redoHistory = [];
    state.designOrigin = null;
    updateEditUI();
  }

  function changeEditHistory(direction) {
    finishEditStroke();
    const source = direction === "undo" ? state.undoHistory : state.redoHistory;
    const target = direction === "undo" ? state.redoHistory : state.undoHistory;
    const snapshot = source.pop();
    if (!snapshot) return;
    target.push(editSnapshot());
    restoreEditSnapshot(snapshot);
  }

  function boardCellAtPointer(event) {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    const x = Math.floor((event.clientX - bounds.left) * state.boardSize / bounds.width);
    const y = Math.floor((event.clientY - bounds.top) * state.boardSize / bounds.height);
    return x >= 0 && y >= 0 && x < state.boardSize && y < state.boardSize ? { x, y } : null;
  }

  function patternIndexAtBoardCell(cell) {
    const pos = offset();
    const x = cell.x - pos.x, y = cell.y - pos.y;
    return x >= 0 && y >= 0 && x < state.designWidth && y < state.designHeight
      ? y * state.designWidth + x
      : -1;
  }

  function expandPatternToCell(cell) {
    const pos = offset();
    const left = Math.min(pos.x, cell.x), top = Math.min(pos.y, cell.y);
    const width = Math.max(pos.x + state.designWidth, cell.x + 1) - left;
    const height = Math.max(pos.y + state.designHeight, cell.y + 1) - top;
    if (state.pixelArtPlacement) {
      state.pixelArtPlacement.x += pos.x - left;
      state.pixelArtPlacement.y += pos.y - top;
    }
    const next = Array(width * height).fill(-1);
    for (let y = 0; y < state.designHeight; y += 1) {
      for (let x = 0; x < state.designWidth; x += 1) {
        next[(y + pos.y - top) * width + x + pos.x - left] = state.pattern[y * state.designWidth + x];
      }
    }
    state.pattern = next;
    state.designOrigin = { x: left, y: top };
    state.designWidth = width;
    state.designHeight = height;
    state.patternWidth = width;
    state.patternHeight = height;
    state.patternLongSide = Math.max(width, height);
    updateBoardUI();
    return (cell.y - top) * width + cell.x - left;
  }

  function paintBoardCell(cell) {
    const stroke = state.activeStroke;
    if (!stroke) return;
    let index = patternIndexAtBoardCell(cell);
    if (index < 0) {
      if (stroke.tool === "erase") return;
      index = expandPatternToCell(cell);
    }
    const next = stroke.tool === "erase" ? -1 : stroke.color;
    if (state.pattern[index] === next) return;
    state.pattern[index] = next;
    stroke.changed = true;
  }

  function paintStrokeLine(from, to) {
    // Fill skipped cells during fast mouse or touch movement.
    let x = from.x, y = from.y;
    const dx = Math.abs(to.x - x), sx = x < to.x ? 1 : -1;
    const dy = -Math.abs(to.y - y), sy = y < to.y ? 1 : -1;
    let error = dx + dy;
    while (true) {
      paintBoardCell({ x, y });
      if (x === to.x && y === to.y) break;
      const twiceError = 2 * error;
      if (twiceError >= dy) { error += dy; x += sx; }
      if (twiceError <= dx) { error += dx; y += sy; }
    }
  }

  function beginEditStroke(event) {
    if (!state.editing || event.isPrimary === false || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (state.editTool === "pan") {
      if (event.pointerType === "touch") return;
      event.preventDefault();
      state.activePan = {
        pointerId: event.pointerId, x: event.clientX, y: event.clientY,
        left: canvasScroller.scrollLeft, top: canvasScroller.scrollTop,
      };
      canvas.setPointerCapture?.(event.pointerId);
      updateEditUI();
      return;
    }
    event.preventDefault();
    flushPendingPatternResize();
    const cell = boardCellAtPointer(event);
    if (!cell) return;
    if (state.editTool === "pick") {
      const index = patternIndexAtBoardCell(cell);
      const color = index >= 0 ? state.pattern[index] : -1;
      if (color < 0) { toast("这个位置没有豆点"); return; }
      state.editColor = color;
      state.editTool = "paint";
      updateEditUI();
      renderPalette();
      return;
    }
    finishEditStroke();
    state.activeStroke = {
      pointerId: event.pointerId,
      before: editSnapshot(),
      tool: state.editTool,
      color: state.editColor,
      lastCell: cell,
      changed: false,
    };
    canvas.setPointerCapture?.(event.pointerId);
    paintBoardCell(cell);
    drawPattern();
    updateCounts();
    updateEditUI();
  }

  function moveEditStroke(event) {
    if (state.activePan?.pointerId === event.pointerId) {
      event.preventDefault();
      canvasScroller.scrollLeft = state.activePan.left - (event.clientX - state.activePan.x);
      canvasScroller.scrollTop = state.activePan.top - (event.clientY - state.activePan.y);
      return;
    }
    const stroke = state.activeStroke;
    if (!stroke || stroke.pointerId !== event.pointerId) return;
    event.preventDefault();
    const cell = boardCellAtPointer(event);
    if (!cell) { stroke.lastCell = null; return; }
    if (stroke.lastCell) paintStrokeLine(stroke.lastCell, cell);
    else paintBoardCell(cell);
    stroke.lastCell = cell;
    drawPattern();
    updateCounts();
  }

  function finishEditStroke(event) {
    finishPan(event);
    const stroke = state.activeStroke;
    if (!stroke || (event && event.pointerId !== stroke.pointerId)) return;
    state.activeStroke = null;
    if (canvas.hasPointerCapture?.(stroke.pointerId)) canvas.releasePointerCapture(stroke.pointerId);
    if (stroke.changed) {
      state.undoHistory.push(stroke.before);
      if (state.undoHistory.length > 60) state.undoHistory.shift();
      state.redoHistory = [];
      renderAll();
    } else updateEditUI();
  }

  function finishPan(event) {
    const pan = state.activePan;
    if (!pan || (event && event.pointerId !== pan.pointerId)) return;
    state.activePan = null;
    if (canvas.hasPointerCapture?.(pan.pointerId)) canvas.releasePointerCapture(pan.pointerId);
    updateEditUI();
  }

  function rgbToLab(r, g, b) {
    const linear = [r, g, b].map((v) => v / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const x = (linear[0] * 0.4124564 + linear[1] * 0.3575761 + linear[2] * 0.1804375) / 0.95047;
    const y = linear[0] * 0.2126729 + linear[1] * 0.7151522 + linear[2] * 0.072175;
    const z = (linear[0] * 0.0193339 + linear[1] * 0.119192 + linear[2] * 0.9503041) / 1.08883;
    const f = (v) => v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116;
    const fx = f(x), fy = f(y), fz = f(z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  function nearestColor(r, g, b) {
    const lab = rgbToLab(r, g, b);
    let best = 0, min = Infinity;
    COLORS.forEach((_, i) => {
      const reference = LAB[i];
      const dL = lab[0] - reference[0], da = lab[1] - reference[1], db = lab[2] - reference[2];
      const distance = dL * dL + da * da + db * db;
      if (distance < min) { min = distance; best = i; }
    });
    return best;
  }

  function adjustedPixels(pixels, outsideMask) {
    const adjusted = new Uint8ClampedArray(pixels.length);
    const contrastFactor = (259 * (state.contrast + 255)) / (255 * (259 - state.contrast));
    const saturation = 1 + state.saturation / 100;
    const white = COLORS[colorAt("H1")].hex;
    const whiteRgb = [1, 3, 5].map((start) => Number.parseInt(white.slice(start, start + 2), 16));
    for (let i = 0; i < pixels.length / 4; i += 1) {
      const offset = i * 4;
      if (outsideMask?.[i]) {
        // Removed exterior background does not receive a bead.
        adjusted[offset] = 0;
        adjusted[offset + 1] = 0;
        adjusted[offset + 2] = 0;
        adjusted[offset + 3] = 0;
        continue;
      }
      const alpha = pixels[offset + 3] / 255;
      let r = pixels[offset] * alpha + whiteRgb[0] * (1 - alpha);
      let g = pixels[offset + 1] * alpha + whiteRgb[1] * (1 - alpha);
      let b = pixels[offset + 2] * alpha + whiteRgb[2] * (1 - alpha);
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      adjusted[offset] = Math.max(0, Math.min(255, gray + (r - gray) * saturation));
      adjusted[offset + 1] = Math.max(0, Math.min(255, gray + (g - gray) * saturation));
      adjusted[offset + 2] = Math.max(0, Math.min(255, gray + (b - gray) * saturation));
      adjusted[offset + 3] = 255;
    }
    return adjusted;
  }

  function quantizeGridPixels(pixels, sourceWidth, sourceHeight, gridWidth, gridHeight, outsideMask, preferBlockCenter = false) {
    const adjusted = adjustedPixels(pixels, outsideMask);
    const toLinear = (value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    };
    const fromLinear = (value) => {
      const channel = value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
      return Math.max(0, Math.min(255, Math.round(channel * 255)));
    };
    const pattern = new Array(gridWidth * gridHeight).fill(-1);

    // AI pixel art can contain antialiased transitions between flat blocks. Use
    // the center of each bead's 4×4 sample to avoid mixing two adjacent blocks.
    // Ordinary photos keep the full-area linear average for a smoother reduction.
    for (let gridY = 0; gridY < gridHeight; gridY += 1) {
      const top = Math.floor(gridY * sourceHeight / gridHeight);
      const bottom = Math.max(top + 1, Math.floor((gridY + 1) * sourceHeight / gridHeight));
      for (let gridX = 0; gridX < gridWidth; gridX += 1) {
        const left = Math.floor(gridX * sourceWidth / gridWidth);
        const right = Math.max(left + 1, Math.floor((gridX + 1) * sourceWidth / gridWidth));
        const fullCellArea = (bottom - top) * (right - left);
        const sampleTop = preferBlockCenter ? top + Math.floor((bottom - top) / 2) : top;
        const sampleBottom = preferBlockCenter ? Math.min(bottom, sampleTop + 1) : bottom;
        const sampleLeft = preferBlockCenter ? left + Math.floor((right - left) / 2) : left;
        const sampleRight = preferBlockCenter ? Math.min(right, sampleLeft + 1) : right;
        let usedFullCellFallback = false;
        let red = 0, green = 0, blue = 0, samples = 0;
        for (let y = sampleTop; y < sampleBottom; y += 1) {
          for (let x = sampleLeft; x < sampleRight; x += 1) {
            const sourceIndex = y * sourceWidth + x;
            if (outsideMask?.[sourceIndex]) continue;
            const offset = sourceIndex * 4;
            red += toLinear(adjusted[offset]);
            green += toLinear(adjusted[offset + 1]);
            blue += toLinear(adjusted[offset + 2]);
            samples += 1;
          }
        }
        // If a very thin silhouette feature only touches the center-sample boundary,
        // fall back to the full bead cell before deciding it is background.
        if ((preferBlockCenter && !samples) || (!preferBlockCenter && samples / fullCellArea < 0.1)) {
          usedFullCellFallback = preferBlockCenter;
          red = 0; green = 0; blue = 0; samples = 0;
          for (let y = top; y < bottom; y += 1) {
            for (let x = left; x < right; x += 1) {
              const sourceIndex = y * sourceWidth + x;
              if (outsideMask?.[sourceIndex]) continue;
              const offset = sourceIndex * 4;
              red += toLinear(adjusted[offset]);
              green += toLinear(adjusted[offset + 1]);
              blue += toLinear(adjusted[offset + 2]);
              samples += 1;
            }
          }
        }
        // Ignore tiny mask specks at the silhouette edge while keeping thin features.
        // A center sample intentionally contains only one pixel for a 4×4
        // AI source cell, so do not apply the full-cell coverage threshold to
        // that path. Keep the threshold for ordinary photos to suppress tiny
        // background-mask specks at the silhouette edge.
        if (!samples || ((!preferBlockCenter || usedFullCellFallback) && samples / fullCellArea < 0.1)) continue;
        const bead = gridY * gridWidth + gridX;
        pattern[bead] = nearestColor(fromLinear(red / samples), fromLinear(green / samples), fromLinear(blue / samples));
      }
    }
    return pattern;
  }

  function closeForegroundMask(backgroundLike, width, height) {
    const length = width * height;
    const dilated = new Uint8Array(length);
    const closed = new Uint8Array(length);
    // A one-cell square closing bridges tiny sampling gaps in an outline without
    // expanding the subject's final silhouette.
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (backgroundLike[y * width + x]) continue;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) dilated[ny * width + nx] = 1;
          }
        }
      }
    }
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        let surrounded = true;
        for (let dy = -1; dy <= 1 && surrounded; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (!dilated[(y + dy) * width + x + dx]) { surrounded = false; break; }
          }
        }
        if (surrounded) closed[y * width + x] = 1;
      }
    }
    // Preserve the original foreground, including the image border.
    for (let i = 0; i < length; i += 1) {
      if (!backgroundLike[i]) closed[i] = 1;
    }
    return closed;
  }

  function findEdgeBackgroundMask(pixels, width, height) {
    if (!state.removeBackground || width < 3 || height < 3) return null;
    const edge = [];
    for (let x = 0; x < width; x += 1) edge.push(x, (height - 1) * width + x);
    for (let y = 1; y < height - 1; y += 1) edge.push(y * width, y * width + width - 1);

    const buckets = new Map();
    let opaqueEdgeCount = 0;
    edge.forEach((cell) => {
      const offset = cell * 4;
      if (pixels[offset + 3] < 16) return;
      opaqueEdgeCount += 1;
      const r = pixels[offset], g = pixels[offset + 1], b = pixels[offset + 2];
      const key = `${r >> 5}:${g >> 5}:${b >> 5}`;
      const bucket = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
      bucket.count += 1; bucket.r += r; bucket.g += g; bucket.b += b;
      buckets.set(key, bucket);
    });
    const dominant = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
    const background = dominant && dominant.count >= Math.max(3, opaqueEdgeCount * 0.28)
      ? [dominant.r / dominant.count, dominant.g / dominant.count, dominant.b / dominant.count]
      : null;
    const nearBackground = (cell) => {
      const offset = cell * 4;
      if (pixels[offset + 3] < 16) return true;
      if (!background) return false;
      const dr = pixels[offset] - background[0];
      const dg = pixels[offset + 1] - background[1];
      const db = pixels[offset + 2] - background[2];
      return dr * dr + dg * dg + db * db <= 48 * 48;
    };
    if (!background && !pixels.some((_, i) => i % 4 === 3 && pixels[i] < 16)) return null;

    const length = width * height;
    const backgroundLike = new Uint8Array(length);
    for (let cell = 0; cell < length; cell += 1) {
      if (nearBackground(cell)) backgroundLike[cell] = 1;
    }

    // Treat a narrow, uniform dark line running along an entire image edge as
    // a capture border. It should not become a column of beads in the pattern.
    const edgeLines = [
      Array.from({ length: width }, (_, x) => x),
      Array.from({ length: width }, (_, x) => (height - 1) * width + x),
      Array.from({ length: height }, (_, y) => y * width),
      Array.from({ length: height }, (_, y) => y * width + width - 1),
    ];
    edgeLines.forEach((line) => {
      const darkBuckets = new Map();
      let darkCount = 0;
      line.forEach((cell) => {
        const offset = cell * 4;
        if (pixels[offset + 3] < 16) return;
        const r = pixels[offset], g = pixels[offset + 1], b = pixels[offset + 2];
        if (Math.max(r, g, b) > 80 || Math.max(r, g, b) - Math.min(r, g, b) > 20) return;
        darkCount += 1;
        const key = `${r >> 4}:${g >> 4}:${b >> 4}`;
        darkBuckets.set(key, (darkBuckets.get(key) || 0) + 1);
      });
      const mostCommonDark = Math.max(0, ...darkBuckets.values());
      if (darkCount >= line.length * 0.92 && mostCommonDark >= line.length * 0.85) {
        line.forEach((cell) => { backgroundLike[cell] = 1; });
      }
    });

    const foregroundBarrier = state.fillInterior ? closeForegroundMask(backgroundLike, width, height) : null;
    const canTraceOutside = (cell) => backgroundLike[cell] && !foregroundBarrier?.[cell];
    const mask = new Uint8Array(length);
    const pending = new Int32Array(width * height);
    let pendingCount = 0;
    edge.forEach((cell) => {
      if (!mask[cell] && canTraceOutside(cell)) {
        mask[cell] = 1;
        pending[pendingCount] = cell;
        pendingCount += 1;
      }
    });
    while (pendingCount > 0) {
      const cell = pending[--pendingCount];
      const x = cell % width, y = Math.floor(cell / width);
      const neighbors = [
        x > 0 ? cell - 1 : -1, x + 1 < width ? cell + 1 : -1,
        y > 0 ? cell - width : -1, y + 1 < height ? cell + width : -1,
      ];
      neighbors.forEach((next) => {
        if (next >= 0 && !mask[next] && canTraceOutside(next)) {
          mask[next] = 1;
          pending[pendingCount] = next;
          pendingCount += 1;
        }
      });
    }
    return { outsideMask: mask };
  }

function applyImage() {
    const image = state.pixelArtImage || state.sourceImage;
    if (!image) return;
    const dimensions = dimensionsForLongSide(state.patternLongSide, state.aspectRatio);
    state.designWidth = dimensions.width;
    state.designHeight = dimensions.height;
    const samplesPerBead = 4;
    const sample = document.createElement("canvas");
    sample.width = state.designWidth * samplesPerBead;
    sample.height = state.designHeight * samplesPerBead;
    const sampleContext = sample.getContext("2d", { willReadFrequently: true });
    sampleContext.clearRect(0, 0, sample.width, sample.height);
    sampleContext.imageSmoothingEnabled = true;
    sampleContext.imageSmoothingQuality = "high";
    const scale = state.fit === "cover" ? Math.max(sample.width / image.naturalWidth, sample.height / image.naturalHeight) : Math.min(sample.width / image.naturalWidth, sample.height / image.naturalHeight);
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    sampleContext.drawImage(image, (sample.width - width) / 2, (sample.height - height) / 2, width, height);
    const pixels = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
    const backgroundInfo = findEdgeBackgroundMask(pixels, sample.width, sample.height);
    const pattern = quantizeGridPixels(pixels, sample.width, sample.height, state.designWidth, state.designHeight, backgroundInfo?.outsideMask, Boolean(state.pixelArtImage));
    clearEditHistory();
    state.pattern = pattern;
    state.pixelArtPlacement = state.pixelArtImage
      ? { width: state.designWidth, height: state.designHeight, x: 0, y: 0 }
      : null;
    if (state.colorFilter !== null && !state.pattern.includes(state.colorFilter)) state.colorFilter = null;
    state.patternWidth = state.designWidth;
    state.patternHeight = state.designHeight;
    updateDesignUI();
  }

  function toast(message) {
    const box = $("#toast"); box.textContent = message; box.classList.add("show");
    clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => box.classList.remove("show"), 2200);
  }

  function readImage(file) {
    const looksLikeImage = file && (file.type?.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|heic|heif|avif)$/i.test(file.name || ""));
    if (!looksLikeImage) return toast("请选择手机相册中的图片");
    state.aiController?.abort();
    state.aiController = null;
    state.aiBusy = false;
    state.imageLoading = true;
    const uploadId = ++state.aiRequestId;
    updatePixelArtUI();
    const url = URL.createObjectURL(file), image = new Image();
    image.onload = () => {
      if (uploadId !== state.aiRequestId) { URL.revokeObjectURL(url); return; }
      state.imageLoading = false;
      clearTimeout(state.reprocessTimer);
      state.reprocessTimer = 0;
      if (state.sourceImage?.src?.startsWith("blob:")) URL.revokeObjectURL(state.sourceImage.src);
      if (state.pixelArtUrl) URL.revokeObjectURL(state.pixelArtUrl);
      state.sourceImage = image;
      state.sourceFile = file;
      state.pixelArtImage = null;
      state.pixelArtUrl = "";
      state.pixelArtPlacement = null;
      state.pixelArtZoom = 1;
      state.aiBusy = false;
      state.sourceAspectRatio = image.naturalWidth / Math.max(1, image.naturalHeight);
      state.aspectRatio = state.sourceAspectRatio;
      const dimensions = dimensionsForLongSide(state.patternLongSide, state.aspectRatio);
      state.designWidth = dimensions.width;
      state.designHeight = dimensions.height;
      $("#uploadTitle").textContent = file.name || "已选图片";
      $("#uploadCaption").textContent = `${image.naturalWidth} × ${image.naturalHeight} px`;
      state.colorFilter = null; state.guideIndex = 0; state.guideSteps = [];
      applyImage(); updateBoardUI(); updatePixelArtUI(); renderAll(); toast(`已生成 ${state.designWidth} × ${state.designHeight} 格像素画`);
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      if (uploadId === state.aiRequestId) {
        state.imageLoading = false;
        updatePixelArtUI();
        toast("手机浏览器无法解码此图片，请另存为 JPG 或 PNG 后重试");
      }
    };
    image.src = url;
  }

  async function makeAiUploadFile() {
    const supported = ["image/png", "image/jpeg", "image/webp"].includes(state.sourceFile.type);
    if (supported && state.sourceFile.size <= 6 * 1024 * 1024) return state.sourceFile;
    const image = state.sourceImage;
    const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    if (!blob) throw new Error("图片压缩失败，请换一张 JPG 或 PNG 图片");
    if (blob.size > 6 * 1024 * 1024) throw new Error("图片压缩后仍超过 6 MB，请选择较小的图片");
    return new File([blob], "pixel-art-source.jpg", { type: "image/jpeg" });
  }

  async function generateAiPixelArt() {
    if (!state.sourceFile || !pixelArtEndpoint || state.aiBusy) return;
    const requestId = ++state.aiRequestId;
    state.aiBusy = true;
    state.aiController = new AbortController();
    updatePixelArtUI();
    let pendingImageUrl = "";
    try {
      const uploadFile = await makeAiUploadFile();
      if (requestId !== state.aiRequestId) return;
      const body = new FormData();
      body.append("image", uploadFile, uploadFile.name);
      body.append("aspect_ratio", String(state.sourceAspectRatio));
      const response = await fetch(pixelArtEndpoint, { method: "POST", body, signal: state.aiController.signal });
      if (requestId !== state.aiRequestId) return;
      if (!response.ok) {
        let message = "AI 像素画生成失败，请稍后重试";
        try { message = (await response.json()).error || message; } catch {}
        throw new Error(message);
      }
      const imageBlob = await response.blob();
      if (requestId !== state.aiRequestId) return;
      if (!imageBlob.type.startsWith("image/")) throw new Error("AI 接口没有返回图片，请检查接口配置");
      const url = URL.createObjectURL(imageBlob);
      pendingImageUrl = url;
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("生成的像素画无法读取，请重试"));
        image.src = url;
      });
      if (requestId !== state.aiRequestId) { URL.revokeObjectURL(url); pendingImageUrl = ""; return; }
      if (state.pixelArtUrl) URL.revokeObjectURL(state.pixelArtUrl);
      state.pixelArtUrl = url;
      pendingImageUrl = "";
      state.pixelArtImage = image;
      state.pixelArtZoom = 1;
      pixelArtScroller.scrollLeft = pixelArtScroller.scrollTop = 0;
      state.aspectRatio = image.naturalWidth / Math.max(1, image.naturalHeight);
      const dimensions = dimensionsForLongSide(state.patternLongSide, state.aspectRatio);
      state.designWidth = dimensions.width;
      state.designHeight = dimensions.height;
      state.colorFilter = null; state.guideIndex = 0; state.guideSteps = [];
      applyImage(); updateBoardUI(); updatePixelArtUI(); renderAll();
      toast(`像素画已生成，按格点中心颜色匹配 MARD 221 色号（色卡有限，颜色会略有差异）`);
    } catch (error) {
      if (pendingImageUrl) URL.revokeObjectURL(pendingImageUrl);
      if (requestId === state.aiRequestId) toast(error.message || "AI 像素画生成失败，请检查服务配置");
    } finally {
      if (requestId === state.aiRequestId) {
        state.aiController = null;
        state.aiBusy = false;
        updatePixelArtUI();
      }
    }
  }

  function restoreOriginalImage() {
    if (!state.sourceImage) return;
    state.aiController?.abort();
    state.aiController = null;
    state.imageLoading = false;
    state.aiRequestId += 1;
    state.aiBusy = false;
    if (state.pixelArtUrl) URL.revokeObjectURL(state.pixelArtUrl);
    state.pixelArtImage = null;
    state.pixelArtUrl = "";
    state.pixelArtPlacement = null;
    state.pixelArtZoom = 1;
    state.aspectRatio = state.sourceAspectRatio;
    const dimensions = dimensionsForLongSide(state.patternLongSide, state.aspectRatio);
    state.designWidth = dimensions.width;
    state.designHeight = dimensions.height;
    applyImage(); updateBoardUI(); updatePixelArtUI(); renderAll();
  }

  function drawExport() {
    flushPendingPatternResize();
    const cell = 24;
    const counts = countColors();
    const used = COLORS.map((color, i) => ({ ...color, count: counts[i] })).filter((color) => color.count);
    const totalBeads = counts.reduce((sum, count) => sum + count, 0);
    const margin = 34, boardPx = state.boardSize * cell, width = Math.max(760, boardPx + margin * 2), header = 78;
    const legendColumns = 5, legendTop = header + boardPx + 24;
    const rows = Math.ceil(used.length / legendColumns), rowHeight = 28;
    const output = document.createElement("canvas"); output.width = width; output.height = legendTop + 34 + rows * rowHeight + 26;
    const target = output.getContext("2d"); target.fillStyle = "#fff"; target.fillRect(0, 0, output.width, output.height);
    target.fillStyle = "#354238"; target.font = "600 20px sans-serif"; target.fillText("MARD 221 · 拼豆图纸", margin, 33);
    target.fillStyle = "#777d74"; target.font = "12px sans-serif"; target.fillText(`豆板 ${state.boardSize} × ${state.boardSize}　图案 ${state.designWidth} × ${state.designHeight}　${totalBeads} 颗珠子`, margin, 56);
    const pos = offset();
    target.save();
    target.translate((width - boardPx) / 2, header);
    state.pattern.forEach((colorIndex, n) => {
      if (colorIndex < 0) return;
      const x = n % state.designWidth, y = Math.floor(n / state.designWidth);
      target.fillStyle = COLORS[colorIndex].hex;
      target.fillRect((pos.x + x) * cell, (pos.y + y) * cell, cell, cell);
    });
    drawBoardGrid(target, cell, true, state.showGrid);
    target.restore();
    target.textAlign = "left"; target.fillStyle = "#384139"; target.font = "600 13px sans-serif"; target.fillText("色号与珠子用量", margin, legendTop + 14);
    const column = (width - margin * 2) / legendColumns;
    used.forEach((color, i) => {
      const x = margin + (i % legendColumns) * column, y = legendTop + 34 + Math.floor(i / legendColumns) * rowHeight;
      target.fillStyle = color.hex; target.fillRect(x, y, 17, 17); target.strokeStyle = "#0002"; target.strokeRect(x + .5, y + .5, 16, 16);
      target.fillStyle = "#555a53"; target.font = "11px sans-serif"; target.fillText(`${color.code} · ${color.count} 颗`, x + 24, y + 13);
    });
    const filename = `MARD221豆板${state.boardSize}-${state.designWidth}x${state.designHeight}.png`;
    const startDownload = (url, revoke = false) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (revoke) setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast("图纸 PNG 已保存到设备");
    };
    if (typeof output.toBlob === "function") {
      output.toBlob((blob) => {
        if (!blob) { toast("图片保存失败，请重试"); return; }
        startDownload(URL.createObjectURL(blob), true);
      }, "image/png");
    } else {
      startDownload(output.toDataURL("image/png"));
    }
  }

  const imageInput = $("#imageInput");
  imageInput.addEventListener("change", (event) => {
    const file = event.currentTarget.files?.[0];
    if (file) readImage(file);
    event.currentTarget.value = "";
  });
  const upload = $("#uploadCard");
  upload.addEventListener("click", (event) => {
    if (event.target !== imageInput) imageInput.click();
  });
  upload.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      imageInput.click();
    }
  });
  upload.addEventListener("dragover", (event) => { event.preventDefault(); upload.classList.add("dragging"); });
  upload.addEventListener("dragleave", () => upload.classList.remove("dragging"));
  upload.addEventListener("drop", (event) => { event.preventDefault(); upload.classList.remove("dragging"); readImage(event.dataTransfer.files[0]); });
  $("#generateAiButton").addEventListener("click", generateAiPixelArt);
  $("#restoreOriginalButton").addEventListener("click", restoreOriginalImage);
  $("#pixelGridToggle").addEventListener("click", () => {
    state.pixelArtShowGrid = !state.pixelArtShowGrid;
    updatePixelArtUI();
    drawPixelArtPreview();
  });
  $("#pixelZoomOut").addEventListener("click", () => zoomPixelArt(1 / 1.2));
  $("#pixelZoomFit").addEventListener("click", () => zoomPixelArt(null));
  $("#pixelZoomIn").addEventListener("click", () => zoomPixelArt(1.2));
  pixelArtCanvas.addEventListener("pointerdown", (event) => {
    if (!state.pixelArtImage || event.isPrimary === false || event.pointerType !== "mouse" || event.button !== 0) return;
    event.preventDefault();
    state.pixelArtPan = {
      pointerId: event.pointerId, x: event.clientX, y: event.clientY,
      left: pixelArtScroller.scrollLeft, top: pixelArtScroller.scrollTop,
    };
    pixelArtCanvas.classList.add("dragging");
    pixelArtCanvas.setPointerCapture?.(event.pointerId);
  });
  pixelArtCanvas.addEventListener("pointermove", (event) => {
    const pan = state.pixelArtPan;
    if (!pan || pan.pointerId !== event.pointerId) return;
    event.preventDefault();
    pixelArtScroller.scrollLeft = pan.left - (event.clientX - pan.x);
    pixelArtScroller.scrollTop = pan.top - (event.clientY - pan.y);
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => pixelArtCanvas.addEventListener(type, finishPixelArtPan));
  document.querySelectorAll("[data-board]").forEach((button) => button.addEventListener("click", () => setBoardSize(Number(button.dataset.board))));
  $("#patternSizeRange").addEventListener("input", (event) => {
    clearEditHistory();
    state.patternLongSide = Number(event.currentTarget.value);
    const dimensions = dimensionsForLongSide(state.patternLongSide, state.aspectRatio);
    state.designWidth = dimensions.width;
    state.designHeight = dimensions.height;
    state.patternWidth = state.designWidth;
    state.patternHeight = state.designHeight;
    if (state.colorFilter !== null && !state.pattern.includes(state.colorFilter)) state.colorFilter = null;
    updateBoardUI();
    if (state.sourceImage) {
      clearTimeout(state.reprocessTimer);
      state.reprocessTimer = setTimeout(() => { state.reprocessTimer = 0; applyImage(); renderAll(); }, 90);
    } else {
      makeDemo(state.designWidth, state.designHeight);
      renderAll();
    }
  });
  $("#contrastRange").addEventListener("input", (event) => {
    state.contrast = Number(event.target.value);
    $("#contrastReadout").textContent = state.contrast > 0 ? `+${state.contrast}` : String(state.contrast);
    if (state.sourceImage) applyImage();
    renderAll();
  });
  $("#saturationRange").addEventListener("input", (event) => {
    state.saturation = Number(event.target.value);
    $("#saturationReadout").textContent = state.saturation > 0 ? `+${state.saturation}` : String(state.saturation);
    if (state.sourceImage) applyImage();
    renderAll();
  });
  $("#removeBackgroundToggle").addEventListener("change", (event) => {
    state.removeBackground = event.target.checked;
    if (state.sourceImage) applyImage();
    renderAll();
    toast(state.removeBackground ? "已移除与边缘相连的背景格" : "已保留图片背景");
  });
  $("#fillInteriorToggle").addEventListener("change", (event) => {
    state.fillInterior = event.target.checked;
    if (state.sourceImage) applyImage();
    renderAll();
  });
  document.querySelectorAll("[data-fit]").forEach((button) => button.addEventListener("click", () => {
    state.fit = button.dataset.fit;
    document.querySelectorAll("[data-fit]").forEach((item) => item.classList.toggle("active", item === button));
    $(".fit-copy").textContent = state.fit === "cover" ? "填满图案范围，图片边缘会被裁切。" : "完整显示图片，不裁切主体。";
    if (state.sourceImage) { applyImage(); renderAll(); }
  }));
  $("#gridToggle").addEventListener("click", (event) => {
    state.showGrid = !state.showGrid;
    event.currentTarget.classList.toggle("active", state.showGrid);
    event.currentTarget.setAttribute("aria-pressed", String(state.showGrid)); drawPattern();
  });
  const editColorSelect = $("#editColor");
  if (editColorSelect) {
    editColorSelect.innerHTML = COLORS.map((color, index) => `<option value="${index}">${color.code} · ${color.family} · ${color.hex}</option>`).join("");
    editColorSelect.addEventListener("change", (event) => {
      finishEditStroke();
      state.editColor = Number(event.currentTarget.value);
      state.editTool = "paint";
      updateEditUI();
      renderPalette();
    });
  }
  $("#editToggle")?.addEventListener("click", () => setEditing(!state.editing));
  ["paint", "erase", "pick", "pan"].forEach((tool) => $(`#${tool}Tool`)?.addEventListener("click", () => {
    finishEditStroke();
    state.editTool = tool;
    updateEditUI();
  }));
  $("#undoEdit")?.addEventListener("click", () => changeEditHistory("undo"));
  $("#redoEdit")?.addEventListener("click", () => changeEditHistory("redo"));
  canvas.addEventListener("pointerdown", beginEditStroke);
  canvas.addEventListener("pointermove", moveEditStroke);
  canvas.addEventListener("pointerup", (event) => { moveEditStroke(event); finishEditStroke(event); });
  canvas.addEventListener("pointercancel", finishEditStroke);
  canvas.addEventListener("lostpointercapture", finishEditStroke);
  canvas.addEventListener("contextmenu", (event) => { if (state.editing) event.preventDefault(); });
  $("#zoomOut").addEventListener("click", () => { finishEditStroke(); state.zoom = Math.max(0.55, state.zoom / 1.2); drawPattern(); });
  $("#zoomFit").addEventListener("click", () => { finishEditStroke(); state.zoom = 1; drawPattern(); });
  $("#zoomIn").addEventListener("click", () => { finishEditStroke(); state.zoom = Math.min(12, state.zoom * 1.2); drawPattern(); });
  $("#assistantToggle").addEventListener("change", (event) => {
    if (event.target.checked && state.editing) setEditing(false);
    state.assistant = event.target.checked; state.guideIndex = 0; state.colorFilter = null;
    if (state.assistant) state.guideSteps = buildGuideSteps();
    updateAssistant(); renderPalette(); drawPattern();
  });
  $("#previousStep").addEventListener("click", () => { state.colorFilter = null; state.guideIndex = Math.max(0, state.guideIndex - 1); updateAssistant(); renderPalette(); drawPattern(); });
  $("#nextStep").addEventListener("click", () => { state.colorFilter = null; state.guideIndex = Math.min(state.guideSteps.length - 1, state.guideIndex + 1); updateAssistant(); renderPalette(); drawPattern(); });
  $("#saveImageButton").addEventListener("click", drawExport);
  $("#resetButton").addEventListener("click", () => {
    clearTimeout(state.reprocessTimer);
    state.aiController?.abort();
    state.aiController = null;
    state.aiRequestId += 1;
    if (state.sourceImage?.src?.startsWith("blob:")) URL.revokeObjectURL(state.sourceImage.src);
    if (state.pixelArtUrl) URL.revokeObjectURL(state.pixelArtUrl);
    state.sourceImage = null; state.sourceFile = null; state.pixelArtImage = null; state.pixelArtUrl = ""; state.aiBusy = false; state.imageLoading = false;
    state.pixelArtPlacement = null; state.pixelArtZoom = 1; state.pixelArtShowGrid = true;
    state.boardSize = 52; state.patternLongSide = 52; state.designWidth = 52; state.designHeight = 52; state.aspectRatio = 1; state.sourceAspectRatio = 1;
    state.fit = "contain"; state.showGrid = true; state.assistant = false; state.contrast = 0; state.saturation = 0; state.removeBackground = true; state.fillInterior = true; state.zoom = 1; state.colorFilter = null; state.guideIndex = 0; state.guideSteps = [];
    state.editing = false; state.editTool = "paint"; state.editColor = colorAt("H1");
    $("#imageInput").value = ""; $("#uploadTitle").textContent = "点击上传图片"; $("#uploadCaption").textContent = "或将图片拖到这里";
    $("#contrastRange").value = 0; $("#contrastReadout").textContent = "0";
    $("#saturationRange").value = 0; $("#saturationReadout").textContent = "0";
    $("#removeBackgroundToggle").checked = true;
    $("#fillInteriorToggle").checked = true;
    $("#assistantToggle").checked = false; $("#assistantPanel").hidden = true; $("#gridToggle").classList.add("active"); $("#gridToggle").setAttribute("aria-pressed", "true");
    $(".fit-copy").textContent = "完整显示图片，不裁切主体。";
    document.querySelectorAll("[data-fit]").forEach((button) => button.classList.toggle("active", button.dataset.fit === "contain"));
    lastUsedSignature = ""; makeDemo(52, 52); state.patternWidth = 52; state.patternHeight = 52; updateBoardUI(); updatePixelArtUI(); renderPalette(); renderAll(); toast("已恢复 52 × 52 豆板示例图纸");
  });

  makeDemo(52, 52);
  state.patternWidth = state.designWidth;
  state.patternHeight = state.designHeight;
  updateBoardUI(); updatePixelArtUI(); renderPalette(); renderAll();
  window.addEventListener("resize", drawPattern, { passive: true });
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(drawPattern);
    observer.observe(canvasScroller);
    observer.observe(pixelArtScroller);
  }
})();
