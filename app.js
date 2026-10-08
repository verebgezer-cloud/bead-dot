(() => {
  const COLORS = [
    { code: "P01", name: "奶油白", hex: "#F5F0DF" },
    { code: "P02", name: "暖沙色", hex: "#D9BE94" },
    { code: "P03", name: "焦糖棕", hex: "#A9754F" },
    { code: "P04", name: "豆沙粉", hex: "#D99491" },
    { code: "P05", name: "珊瑚橘", hex: "#E8795B" },
    { code: "P06", name: "柠檬黄", hex: "#EAC958" },
    { code: "P07", name: "鼠尾草绿", hex: "#91A985" },
    { code: "P08", name: "森林绿", hex: "#50735E" },
    { code: "P09", name: "天青蓝", hex: "#80B5CC" },
    { code: "P10", name: "湖水蓝", hex: "#4D8399" },
    { code: "P11", name: "雾霾紫", hex: "#A59AB7" },
    { code: "P12", name: "石墨灰", hex: "#737B7D" },
  ];
  const CAT = [
    "................",
    "....11....11....",
    "...1111..1111...",
    "...1111111111...",
    "..111111111111..",
    "..111111111111..",
    "..111111111111..",
    "..111111111111..",
    "..111111111111..",
    "...1111111111...",
    "...1111111111...",
    "....11111111....",
    "....11111111....",
    ".....11..11.....",
    "....11....11....",
    "................",
  ];
  const state = {
    width: 32,
    height: 32,
    fit: "contain",
    showGrid: true,
    selected: 0,
    pattern: [],
    sourceImage: null,
    toastTimer: null,
  };
  const $ = (selector) => document.querySelector(selector);
  const canvas = $("#patternCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const paletteList = $("#paletteList");
  const colorsForCodes = COLORS.map((color) => ({ ...color }));

  function makeSample() {
    const size = 32;
    const next = Array.from({ length: size * size }, () => 0);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const sx = Math.floor((x / size) * 16);
        const sy = Math.floor((y / size) * 16);
        if (CAT[sy][sx] === "1") next[y * size + x] = 11;
      }
    }
    const pixels = [
      [10, 14, 8], [21, 14, 8], [11, 21, 3], [20, 21, 3],
      [15, 17, 11], [16, 17, 11], [14, 18, 11], [17, 18, 11],
      [15, 20, 4], [16, 20, 4], [15, 23, 4], [16, 23, 4],
      [9, 17, 2], [22, 17, 2], [8, 22, 2], [23, 22, 2],
      [12, 26, 5], [13, 26, 5], [19, 26, 5], [20, 26, 5],
      [11, 29, 9], [12, 29, 9], [13, 29, 9], [18, 29, 9], [19, 29, 9], [20, 29, 9],
    ];
    for (const [x, y, color] of pixels) next[y * size + x] = color;
    state.width = size;
    state.height = size;
    state.pattern = next;
  }

  function safeDimension(input) {
    const parsed = Math.round(Number(input.value));
    const value = Number.isFinite(parsed) ? Math.max(8, Math.min(120, parsed)) : 32;
    input.value = String(value);
    return value;
  }

  function setDimensions(width, height, render = true) {
    const newWidth = Math.max(8, Math.min(120, Math.round(width)));
    const newHeight = Math.max(8, Math.min(120, Math.round(height)));
    if (newWidth === state.width && newHeight === state.height) {
      updateDimensionLabels();
      if (render) drawPattern();
      return;
    }
    const oldWidth = state.width;
    const oldHeight = state.height;
    const oldPattern = state.pattern;
    state.width = newWidth;
    state.height = newHeight;
    state.pattern = Array.from({ length: newWidth * newHeight }, (_, index) => {
      const x = index % newWidth;
      const y = Math.floor(index / newWidth);
      if (state.sourceImage) return 0;
      const oldX = Math.min(oldWidth - 1, Math.floor((x / newWidth) * oldWidth));
      const oldY = Math.min(oldHeight - 1, Math.floor((y / newHeight) * oldHeight));
      return oldPattern[oldY * oldWidth + oldX] || 0;
    });
    updateDimensionLabels();
    if (state.sourceImage) applySourceImage();
    else if (render) renderAll();
  }

  function updateDimensionLabels() {
    $("#widthInput").value = state.width;
    $("#heightInput").value = state.height;
    $("#sizeSlider").value = Math.min(80, state.width);
    $("#sizeReadout").textContent = `${state.width} × ${state.height}`;
    $("#canvasDimensions").textContent = `${state.width} × ${state.height}`;
    $("#canvasMetaSize").textContent = `${state.width} × ${state.height} px`;
  }

  function renderAll() {
    drawPattern();
    renderPalette();
    updateStats();
  }

  function drawPattern() {
    const cell = state.width > 76 || state.height > 76 ? 12 : state.width > 48 || state.height > 48 ? 14 : 17;
    canvas.width = state.width * cell;
    canvas.height = state.height * cell;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < state.height; y += 1) {
      for (let x = 0; x < state.width; x += 1) {
        const index = state.pattern[y * state.width + x] ?? 0;
        const color = colorsForCodes[index] || colorsForCodes[0];
        const inset = state.showGrid ? 0 : 0;
        ctx.fillStyle = color.hex;
        ctx.fillRect(x * cell + inset, y * cell + inset, cell, cell);
      }
    }
    if (state.showGrid) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(82, 88, 80, 0.27)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= state.width; x += 1) {
        ctx.moveTo(x * cell + 0.5, 0);
        ctx.lineTo(x * cell + 0.5, canvas.height);
      }
      for (let y = 0; y <= state.height; y += 1) {
        ctx.moveTo(0, y * cell + 0.5);
        ctx.lineTo(canvas.width, y * cell + 0.5);
      }
      ctx.stroke();
    }
  }

  function countColors() {
    const counts = Array(COLORS.length).fill(0);
    for (const index of state.pattern) counts[index] = (counts[index] || 0) + 1;
    return counts;
  }

  function renderPalette() {
    const counts = countColors();
    const activeColors = COLORS.map((color, index) => ({ ...color, index, count: counts[index] })).filter((color) => color.count > 0);
    $("#usedColors").textContent = String(activeColors.length);
    $("#paletteCount").textContent = `${String(activeColors.length).padStart(2, "0")} COLORS`;
    if (!activeColors.length) {
      paletteList.innerHTML = '<p class="empty-palette">当前图纸还没有用到颜色。</p>';
      return;
    }
    paletteList.innerHTML = activeColors.map((color) => `
      <button class="color-row${state.selected === color.index ? " active" : ""}" type="button" role="listitem" data-color="${color.index}" aria-label="选择${color.name}，色号 ${color.code}，${color.count} 颗" aria-pressed="${state.selected === color.index}">
        <span class="color-swatch" style="background:${color.hex}"></span>
        <span class="color-info"><strong>${color.name}</strong><span class="color-code">${color.code} · ${color.hex}</span></span>
        <span class="color-quantity">${color.count}<small>颗</small></span>
      </button>`).join("");
    $("#printLegend").innerHTML = activeColors.map((color) => `
      <span class="print-legend-item"><i class="print-legend-swatch" style="background:${color.hex}"></i><span class="print-legend-label">${color.code} ${color.name} · ${color.count} 颗</span></span>`).join("");
    paletteList.querySelectorAll(".color-row").forEach((button) => {
      button.addEventListener("click", () => {
        state.selected = Number(button.dataset.color);
        updateBrush();
        renderPalette();
      });
    });
  }

  function updateStats() {
    const total = state.pattern.length;
    $("#totalCount").textContent = total.toLocaleString("zh-CN");
    $("#canvasSubtitle").textContent = state.sourceImage ? "图片已转为拼豆色板，可继续手动调整" : "示例图纸已就绪，导入图片开始制作";
    renderPalette();
  }

  function updateBrush() {
    const color = COLORS[state.selected];
    $("#brushSwatch").style.background = color.hex;
    $("#brushName").textContent = `${color.name} · ${color.code}`;
    renderPalette();
  }

  function nearestColorIndex(r, g, b) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let index = 0; index < COLORS.length; index += 1) {
      const hex = COLORS[index].hex;
      const cr = parseInt(hex.slice(1, 3), 16);
      const cg = parseInt(hex.slice(3, 5), 16);
      const cb = parseInt(hex.slice(5, 7), 16);
      const distance = (r - cr) ** 2 * 0.299 + (g - cg) ** 2 * 0.587 + (b - cb) ** 2 * 0.114;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    return bestIndex;
  }

  function applySourceImage() {
    if (!state.sourceImage) return;
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = state.width;
    sampleCanvas.height = state.height;
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    sampleCtx.fillStyle = "#ffffff";
    sampleCtx.fillRect(0, 0, state.width, state.height);
    const image = state.sourceImage;
    const scale = state.fit === "cover"
      ? Math.max(state.width / image.naturalWidth, state.height / image.naturalHeight)
      : Math.min(state.width / image.naturalWidth, state.height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const drawX = (state.width - drawWidth) / 2;
    const drawY = (state.height - drawHeight) / 2;
    sampleCtx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    const imageData = sampleCtx.getImageData(0, 0, state.width, state.height).data;
    state.pattern = new Array(state.width * state.height);
    for (let offset = 0; offset < imageData.length; offset += 4) {
      state.pattern[offset / 4] = nearestColorIndex(imageData[offset], imageData[offset + 1], imageData[offset + 2]);
    }
    renderAll();
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2100);
  }

  function readImage(file) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("请选择 PNG、JPG、WEBP 或 GIF 图片");
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (state.sourceImage?.src?.startsWith("blob:")) URL.revokeObjectURL(state.sourceImage.src);
      state.sourceImage = image;
      $("#uploadTitle").textContent = file.name;
      $("#uploadCaption").textContent = `${image.naturalWidth} × ${image.naturalHeight} px`;
      applySourceImage();
      showToast("图片已转成拼豆图纸，可以继续逐格改色");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      showToast("这张图片无法读取，请换一张试试");
    };
    image.src = url;
  }

  function editAtPointer(event) {
    const bounds = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - bounds.left) / bounds.width) * state.width);
    const y = Math.floor(((event.clientY - bounds.top) / bounds.height) * state.height);
    if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;
    const index = y * state.width + x;
    if (state.pattern[index] === state.selected) return;
    state.pattern[index] = state.selected;
    renderAll();
  }

  function exportPattern() {
    const cell = Math.max(14, Math.min(32, Math.floor(1800 / Math.max(state.width, state.height))));
    const counts = countColors();
    const usedColors = COLORS.map((color, index) => ({ ...color, index, count: counts[index] })).filter((color) => color.count > 0);
    const boardWidth = state.width * cell;
    const boardHeight = state.height * cell;
    const margin = 34;
    const outputWidth = Math.max(720, boardWidth + margin * 2);
    const headerHeight = 80;
    const legendTitleHeight = 34;
    const legendRowHeight = 32;
    const legendRows = Math.ceil(usedColors.length / 3);
    const output = document.createElement("canvas");
    output.width = outputWidth;
    output.height = headerHeight + boardHeight + 25 + legendTitleHeight + legendRows * legendRowHeight + 26;
    const outputCtx = output.getContext("2d");
    outputCtx.fillStyle = "#ffffff";
    outputCtx.fillRect(0, 0, output.width, output.height);
    outputCtx.fillStyle = "#354238";
    outputCtx.font = "600 20px 'Noto Sans SC', sans-serif";
    outputCtx.fillText("豆点 · 拼豆图纸", margin, 34);
    outputCtx.fillStyle = "#777d74";
    outputCtx.font = "11px 'DM Sans', sans-serif";
    outputCtx.fillText(`${state.width} × ${state.height} 格    ${state.pattern.length.toLocaleString("zh-CN")} 颗珠子    ${usedColors.length} 种颜色`, margin, 57);
    outputCtx.fillStyle = "#e6e9e4";
    outputCtx.fillRect(margin, 69, outputWidth - margin * 2, 1);
    const boardX = Math.round((outputWidth - boardWidth) / 2);
    const boardY = headerHeight;
    state.pattern.forEach((colorIndex, index) => {
      const x = index % state.width;
      const y = Math.floor(index / state.width);
      outputCtx.fillStyle = COLORS[colorIndex].hex;
      outputCtx.fillRect(boardX + x * cell, boardY + y * cell, cell, cell);
    });
    if (state.showGrid) {
      outputCtx.strokeStyle = "rgba(70, 75, 68, .32)";
      outputCtx.lineWidth = Math.max(1, cell / 24);
      outputCtx.beginPath();
      for (let x = 0; x <= state.width; x += 1) {
        outputCtx.moveTo(boardX + x * cell + 0.5, boardY);
        outputCtx.lineTo(boardX + x * cell + 0.5, boardY + boardHeight);
      }
      for (let y = 0; y <= state.height; y += 1) {
        outputCtx.moveTo(boardX, boardY + y * cell + 0.5);
        outputCtx.lineTo(boardX + boardWidth, boardY + y * cell + 0.5);
      }
      outputCtx.stroke();
    }
    const legendTop = boardY + boardHeight + 25;
    outputCtx.fillStyle = "#384139";
    outputCtx.font = "600 12px 'Noto Sans SC', sans-serif";
    outputCtx.fillText("色号与珠子用量", margin, legendTop + 12);
    const columnWidth = (outputWidth - margin * 2) / 3;
    usedColors.forEach((color, index) => {
      const x = margin + (index % 3) * columnWidth;
      const y = legendTop + legendTitleHeight + Math.floor(index / 3) * legendRowHeight;
      outputCtx.fillStyle = color.hex;
      outputCtx.fillRect(x, y + 1, 18, 18);
      outputCtx.strokeStyle = "#0000001a";
      outputCtx.lineWidth = 1;
      outputCtx.strokeRect(x + 0.5, y + 1.5, 17, 17);
      outputCtx.fillStyle = "#555a53";
      outputCtx.font = "11px 'Noto Sans SC', sans-serif";
      outputCtx.fillText(`${color.code} ${color.name} · ${color.count} 颗`, x + 26, y + 14);
    });
    const link = document.createElement("a");
    link.download = `豆点拼豆图纸-${state.width}x${state.height}.png`;
    link.href = output.toDataURL("image/png");
    link.click();
    showToast("图纸已导出为 PNG 图片");
  }

  $("#imageInput").addEventListener("change", (event) => readImage(event.target.files[0]));
  const uploadCard = $("#uploadCard");
  uploadCard.addEventListener("dragover", (event) => { event.preventDefault(); uploadCard.classList.add("dragging"); });
  uploadCard.addEventListener("dragleave", () => uploadCard.classList.remove("dragging"));
  uploadCard.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadCard.classList.remove("dragging");
    readImage(event.dataTransfer.files[0]);
  });

  $("#widthInput").addEventListener("change", (event) => setDimensions(safeDimension(event.currentTarget), state.height));
  $("#heightInput").addEventListener("change", (event) => setDimensions(state.width, safeDimension(event.currentTarget)));
  $("#sizeSlider").addEventListener("input", (event) => {
    const size = Number(event.currentTarget.value);
    const proportion = state.height / state.width;
    setDimensions(size, Math.round(size * proportion));
  });
  document.querySelectorAll("[data-fit]").forEach((button) => button.addEventListener("click", () => {
    state.fit = button.dataset.fit;
    document.querySelectorAll("[data-fit]").forEach((candidate) => candidate.classList.toggle("active", candidate === button));
    $(".fit-copy").textContent = state.fit === "cover" ? "填满整个画布，边缘图片会被裁切。" : "完整显示图片，不裁切主体。";
    if (state.sourceImage) applySourceImage();
  }));

  $("#gridToggle").addEventListener("click", (event) => {
    state.showGrid = !state.showGrid;
    event.currentTarget.classList.toggle("active", state.showGrid);
    event.currentTarget.setAttribute("aria-pressed", String(state.showGrid));
    drawPattern();
  });
  $("#brushButton").addEventListener("click", () => paletteList.scrollIntoView({ behavior: "smooth", block: "start" }));
  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    editAtPointer(event);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (event.buttons === 1) editAtPointer(event);
  });
  $("#exportButton").addEventListener("click", exportPattern);
  $("#printButton").addEventListener("click", () => window.print());
  $("#resetButton").addEventListener("click", () => {
    if (state.sourceImage?.src?.startsWith("blob:")) URL.revokeObjectURL(state.sourceImage.src);
    state.sourceImage = null;
    state.fit = "contain";
    state.showGrid = true;
    state.selected = 0;
    $("#imageInput").value = "";
    $("#uploadTitle").textContent = "点击上传图片";
    $("#uploadCaption").textContent = "或将图片拖到这里";
    document.querySelectorAll("[data-fit]").forEach((button) => button.classList.toggle("active", button.dataset.fit === "contain"));
    $(".fit-copy").textContent = "完整显示图片，不裁切主体。";
    $("#gridToggle").classList.add("active");
    $("#gridToggle").setAttribute("aria-pressed", "true");
    makeSample();
    updateDimensionLabels();
    updateBrush();
    renderAll();
    showToast("已恢复示例图纸");
  });

  makeSample();
  updateDimensionLabels();
  updateBrush();
  renderAll();
})();
