(() => {
  // MARD 221 swatches and HEX values from the public Pixel Beads MARD chart.
  const COLORS = [
    { code: "A1", family: "黄橙系", hex: "#F9F0CD" },
    { code: "A2", family: "黄橙系", hex: "#FBFBD4" },
    { code: "A3", family: "黄橙系", hex: "#FAFC9F" },
    { code: "A4", family: "黄橙系", hex: "#FFE953" },
    { code: "A5", family: "黄橙系", hex: "#F4D738" },
    { code: "A6", family: "黄橙系", hex: "#FDAD49" },
    { code: "A7", family: "黄橙系", hex: "#FF7C2F" },
    { code: "A8", family: "黄橙系", hex: "#EACA49" },
    { code: "A9", family: "黄橙系", hex: "#FF995A" },
    { code: "A10", family: "黄橙系", hex: "#FF9D55" },
    { code: "A11", family: "黄橙系", hex: "#FFDD99" },
    { code: "A12", family: "黄橙系", hex: "#FCB58F" },
    { code: "A13", family: "黄橙系", hex: "#FFBB59" },
    { code: "A14", family: "黄橙系", hex: "#FF6D40" },
    { code: "A15", family: "黄橙系", hex: "#FDFF44" },
    { code: "A16", family: "黄橙系", hex: "#FEF9AE" },
    { code: "A17", family: "黄橙系", hex: "#FFE36E" },
    { code: "A18", family: "黄橙系", hex: "#FECF98" },
    { code: "A19", family: "黄橙系", hex: "#FD7B72" },
    { code: "A20", family: "黄橙系", hex: "#EFCD67" },
    { code: "A21", family: "黄橙系", hex: "#FFE395" },
    { code: "A22", family: "黄橙系", hex: "#FFF3A4" },
    { code: "A23", family: "黄橙系", hex: "#F3D5BF" },
    { code: "A24", family: "黄橙系", hex: "#FBF8C9" },
    { code: "A25", family: "黄橙系", hex: "#FFD67D" },
    { code: "A26", family: "黄橙系", hex: "#FFBB27" },
    { code: "B1", family: "绿色系", hex: "#E6EE32" },
    { code: "B2", family: "绿色系", hex: "#5BE419" },
    { code: "B3", family: "绿色系", hex: "#7CEE9D" },
    { code: "B4", family: "绿色系", hex: "#1EF942" },
    { code: "B5", family: "绿色系", hex: "#00BD35" },
    { code: "B6", family: "绿色系", hex: "#5AE8BA" },
    { code: "B7", family: "绿色系", hex: "#03AC88" },
    { code: "B8", family: "绿色系", hex: "#029D26" },
    { code: "B9", family: "绿色系", hex: "#26523A" },
    { code: "B10", family: "绿色系", hex: "#95D3C2" },
    { code: "B11", family: "绿色系", hex: "#5D722A" },
    { code: "B12", family: "绿色系", hex: "#156F40" },
    { code: "B13", family: "绿色系", hex: "#D9F794" },
    { code: "B14", family: "绿色系", hex: "#ADE945" },
    { code: "B15", family: "绿色系", hex: "#2E5132" },
    { code: "B16", family: "绿色系", hex: "#C6ED9C" },
    { code: "B17", family: "绿色系", hex: "#9BB13A" },
    { code: "B18", family: "绿色系", hex: "#E6EE49" },
    { code: "B19", family: "绿色系", hex: "#25B88C" },
    { code: "B20", family: "绿色系", hex: "#C2F0CC" },
    { code: "B21", family: "绿色系", hex: "#146A6B" },
    { code: "B22", family: "绿色系", hex: "#0B3C43" },
    { code: "B23", family: "绿色系", hex: "#303921" },
    { code: "B24", family: "绿色系", hex: "#EEFCA5" },
    { code: "B25", family: "绿色系", hex: "#4E846D" },
    { code: "B26", family: "绿色系", hex: "#8C7A36" },
    { code: "B27", family: "绿色系", hex: "#D1DCC1" },
    { code: "B28", family: "绿色系", hex: "#9EE5B9" },
    { code: "B29", family: "绿色系", hex: "#C5E254" },
    { code: "B30", family: "绿色系", hex: "#ECFBD0" },
    { code: "B31", family: "绿色系", hex: "#C4E6B5" },
    { code: "B32", family: "绿色系", hex: "#9BAB5A" },
    { code: "C1", family: "蓝青系", hex: "#E8FFE7" },
    { code: "C2", family: "蓝青系", hex: "#BCF9F6" },
    { code: "C3", family: "蓝青系", hex: "#A0E2FB" },
    { code: "C4", family: "蓝青系", hex: "#42CCFF" },
    { code: "C5", family: "蓝青系", hex: "#01ACEB" },
    { code: "C6", family: "蓝青系", hex: "#50A9F0" },
    { code: "C7", family: "蓝青系", hex: "#0188D3" },
    { code: "C8", family: "蓝青系", hex: "#1054C0" },
    { code: "C9", family: "蓝青系", hex: "#314BCA" },
    { code: "C10", family: "蓝青系", hex: "#3EBCE2" },
    { code: "C11", family: "蓝青系", hex: "#03B9B9" },
    { code: "C12", family: "蓝青系", hex: "#1C334D" },
    { code: "C13", family: "蓝青系", hex: "#CDE8FF" },
    { code: "C14", family: "蓝青系", hex: "#D5FDFF" },
    { code: "C15", family: "蓝青系", hex: "#23C4C6" },
    { code: "C16", family: "蓝青系", hex: "#1757A8" },
    { code: "C17", family: "蓝青系", hex: "#50D3EC" },
    { code: "C18", family: "蓝青系", hex: "#1C3344" },
    { code: "C19", family: "蓝青系", hex: "#1787A2" },
    { code: "C20", family: "蓝青系", hex: "#0082BE" },
    { code: "C21", family: "蓝青系", hex: "#BEDDFF" },
    { code: "C22", family: "蓝青系", hex: "#67B4BE" },
    { code: "C23", family: "蓝青系", hex: "#C2DCEB" },
    { code: "C24", family: "蓝青系", hex: "#7DC4FF" },
    { code: "C25", family: "蓝青系", hex: "#A9E5E5" },
    { code: "C26", family: "蓝青系", hex: "#2F99B3" },
    { code: "C27", family: "蓝青系", hex: "#EBF5FC" },
    { code: "C28", family: "蓝青系", hex: "#BBCFED" },
    { code: "C29", family: "蓝青系", hex: "#4B5BA3" },
    { code: "D1", family: "蓝紫系", hex: "#AEB4F2" },
    { code: "D2", family: "蓝紫系", hex: "#858EDD" },
    { code: "D3", family: "蓝紫系", hex: "#3054AF" },
    { code: "D4", family: "蓝紫系", hex: "#182A84" },
    { code: "D5", family: "蓝紫系", hex: "#B843C5" },
    { code: "D6", family: "蓝紫系", hex: "#AC7BDE" },
    { code: "D7", family: "蓝紫系", hex: "#6E399A" },
    { code: "D8", family: "蓝紫系", hex: "#E2D3FF" },
    { code: "D9", family: "蓝紫系", hex: "#D5B9F8" },
    { code: "D10", family: "蓝紫系", hex: "#361B50" },
    { code: "D11", family: "蓝紫系", hex: "#B9BAE1" },
    { code: "D12", family: "蓝紫系", hex: "#DE9AD4" },
    { code: "D13", family: "蓝紫系", hex: "#B90295" },
    { code: "D14", family: "蓝紫系", hex: "#8B279B" },
    { code: "D15", family: "蓝紫系", hex: "#2F1F90" },
    { code: "D16", family: "蓝紫系", hex: "#E2E1EE" },
    { code: "D17", family: "蓝紫系", hex: "#C4D4F6" },
    { code: "D18", family: "蓝紫系", hex: "#A45EC7" },
    { code: "D19", family: "蓝紫系", hex: "#D8C3D7" },
    { code: "D20", family: "蓝紫系", hex: "#9C32B2" },
    { code: "D21", family: "蓝紫系", hex: "#9A009B" },
    { code: "D22", family: "蓝紫系", hex: "#333995" },
    { code: "D23", family: "蓝紫系", hex: "#EADAFC" },
    { code: "D24", family: "蓝紫系", hex: "#7786E5" },
    { code: "D25", family: "蓝紫系", hex: "#484FC7" },
    { code: "D26", family: "蓝紫系", hex: "#E9C3F6" },
    { code: "E1", family: "粉红系", hex: "#FDD3CC" },
    { code: "E2", family: "粉红系", hex: "#FECDDF" },
    { code: "E3", family: "粉红系", hex: "#FF97C3" },
    { code: "E4", family: "粉红系", hex: "#E8649E" },
    { code: "E5", family: "粉红系", hex: "#F551A2" },
    { code: "E6", family: "粉红系", hex: "#FF346B" },
    { code: "E7", family: "粉红系", hex: "#C63578" },
    { code: "E8", family: "粉红系", hex: "#FFDBE9" },
    { code: "E9", family: "粉红系", hex: "#E970CC" },
    { code: "E10", family: "粉红系", hex: "#D33893" },
    { code: "E11", family: "粉红系", hex: "#FCDDD2" },
    { code: "E12", family: "粉红系", hex: "#FFA1C5" },
    { code: "E13", family: "粉红系", hex: "#B6006D" },
    { code: "E14", family: "粉红系", hex: "#FFD1BA" },
    { code: "E15", family: "粉红系", hex: "#F2CFD0" },
    { code: "E16", family: "粉红系", hex: "#FFECDE" },
    { code: "E17", family: "粉红系", hex: "#FFE2EA" },
    { code: "E18", family: "粉红系", hex: "#FFC9D6" },
    { code: "E19", family: "粉红系", hex: "#FFD2E7" },
    { code: "E20", family: "粉红系", hex: "#D8C7D1" },
    { code: "E21", family: "粉红系", hex: "#BD9DA1" },
    { code: "E22", family: "粉红系", hex: "#CC78A7" },
    { code: "E23", family: "粉红系", hex: "#937A8D" },
    { code: "E24", family: "粉红系", hex: "#F6E4F9" },
    { code: "F1", family: "红色系", hex: "#FD957B" },
    { code: "F2", family: "红色系", hex: "#FC3D45" },
    { code: "F3", family: "红色系", hex: "#F74941" },
    { code: "F4", family: "红色系", hex: "#FC283C" },
    { code: "F5", family: "红色系", hex: "#D80127" },
    { code: "F6", family: "红色系", hex: "#B0443D" },
    { code: "F7", family: "红色系", hex: "#971937" },
    { code: "F8", family: "红色系", hex: "#BC0127" },
    { code: "F9", family: "红色系", hex: "#E2677A" },
    { code: "F10", family: "红色系", hex: "#A74D22" },
    { code: "F11", family: "红色系", hex: "#6F201F" },
    { code: "F12", family: "红色系", hex: "#FD4D6A" },
    { code: "F13", family: "红色系", hex: "#DD422F" },
    { code: "F14", family: "红色系", hex: "#FFA9AD" },
    { code: "F15", family: "红色系", hex: "#C80020" },
    { code: "F16", family: "红色系", hex: "#FFD9C8" },
    { code: "F17", family: "红色系", hex: "#F79B71" },
    { code: "F18", family: "红色系", hex: "#D37C46" },
    { code: "F19", family: "红色系", hex: "#C1444A" },
    { code: "F20", family: "红色系", hex: "#CD9391" },
    { code: "F21", family: "红色系", hex: "#F4B1B4" },
    { code: "F22", family: "红色系", hex: "#FFD0CB" },
    { code: "F23", family: "红色系", hex: "#F57E66" },
    { code: "F24", family: "红色系", hex: "#FCC1C4" },
    { code: "F25", family: "红色系", hex: "#E54B4F" },
    { code: "G1", family: "棕肤系", hex: "#FFE2CE" },
    { code: "G2", family: "棕肤系", hex: "#FFCAAA" },
    { code: "G3", family: "棕肤系", hex: "#F4C3A5" },
    { code: "G4", family: "棕肤系", hex: "#E1B383" },
    { code: "G5", family: "棕肤系", hex: "#ED9435" },
    { code: "G6", family: "棕肤系", hex: "#F59734" },
    { code: "G7", family: "棕肤系", hex: "#9D5B3E" },
    { code: "G8", family: "棕肤系", hex: "#592A21" },
    { code: "G9", family: "棕肤系", hex: "#E6B483" },
    { code: "G10", family: "棕肤系", hex: "#C88135" },
    { code: "G11", family: "棕肤系", hex: "#E0C593" },
    { code: "G12", family: "棕肤系", hex: "#EBBB83" },
    { code: "G13", family: "棕肤系", hex: "#B7714A" },
    { code: "G14", family: "棕肤系", hex: "#8D614C" },
    { code: "G15", family: "棕肤系", hex: "#FCF9E0" },
    { code: "G16", family: "棕肤系", hex: "#F2D9BA" },
    { code: "G17", family: "棕肤系", hex: "#56403C" },
    { code: "G18", family: "棕肤系", hex: "#FFE4CC" },
    { code: "G19", family: "棕肤系", hex: "#E1943A" },
    { code: "G20", family: "棕肤系", hex: "#A94023" },
    { code: "G21", family: "棕肤系", hex: "#CB8E77" },
    { code: "H1", family: "黑白系", hex: "#E2E2E2" },
    { code: "H2", family: "黑白系", hex: "#FFFFFF" },
    { code: "H3", family: "黑白系", hex: "#B3B3B3" },
    { code: "H4", family: "黑白系", hex: "#868686" },
    { code: "H5", family: "黑白系", hex: "#474747" },
    { code: "H6", family: "黑白系", hex: "#2C2C2C" },
    { code: "H7", family: "黑白系", hex: "#000000" },
    { code: "H8", family: "黑白系", hex: "#E7D6DB" },
    { code: "H9", family: "黑白系", hex: "#E4E7E3" },
    { code: "H10", family: "黑白系", hex: "#EEE9EA" },
    { code: "H11", family: "黑白系", hex: "#CECDD5" },
    { code: "H12", family: "黑白系", hex: "#FFF5ED" },
    { code: "H13", family: "黑白系", hex: "#F3E1C9" },
    { code: "H14", family: "黑白系", hex: "#CFD7D3" },
    { code: "H15", family: "黑白系", hex: "#98A6A8" },
    { code: "H16", family: "黑白系", hex: "#3B2F23" },
    { code: "H17", family: "黑白系", hex: "#F1EDED" },
    { code: "H18", family: "黑白系", hex: "#FFFDF0" },
    { code: "H19", family: "黑白系", hex: "#F6EFE2" },
    { code: "H20", family: "黑白系", hex: "#949FA3" },
    { code: "H21", family: "黑白系", hex: "#F7F3E4" },
    { code: "H22", family: "黑白系", hex: "#CACAD5" },
    { code: "H23", family: "黑白系", hex: "#9A9D94" },
    { code: "M1", family: "大地系", hex: "#BCC6B8" },
    { code: "M2", family: "大地系", hex: "#8AA385" },
    { code: "M3", family: "大地系", hex: "#697D80" },
    { code: "M4", family: "大地系", hex: "#DACEBE" },
    { code: "M5", family: "大地系", hex: "#D0CCAA" },
    { code: "M6", family: "大地系", hex: "#B0A782" },
    { code: "M7", family: "大地系", hex: "#B4A497" },
    { code: "M8", family: "大地系", hex: "#B38281" },
    { code: "M9", family: "大地系", hex: "#A58767" },
    { code: "M10", family: "大地系", hex: "#C5B1BC" },
    { code: "M11", family: "大地系", hex: "#9F7494" },
    { code: "M12", family: "大地系", hex: "#644749" },
    { code: "M13", family: "大地系", hex: "#D19066" },
    { code: "M14", family: "大地系", hex: "#C77361" },
    { code: "M15", family: "大地系", hex: "#757D7B" },
  ];
  window.MARD221_COLORS = COLORS;
  if (document.body.hasAttribute("data-board-app")) return;
  const COLOR_INDEX = new Map(COLORS.map((color, i) => [color.code, i]));
  const at = (code) => COLOR_INDEX.get(code) ?? 0;
  const state = { width: 52, height: 52, board: "52x52", fit: "contain", showGrid: true, showCodes: true, selected: at("H1"), pattern: [], sourceImage: null, toastTimer: 0 };
  const $ = (selector) => document.querySelector(selector);
  const canvas = $("#patternCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const paletteList = $("#paletteList");

  function makeSample(width = state.width, height = state.height) {
    const bg = at("H1");
    const body = at("M1");
    const edge = at("H7");
    const eye = at("H7");
    const nose = at("F2");
    const ear = at("G4");
    state.width = width;
    state.height = height;
    state.pattern = Array.from({ length: width * height }, (_, n) => {
      const x = n % width;
      const y = Math.floor(n / width);
      const nx = (x - (width - 1) / 2) / width;
      const ny = (y - (height - 1) / 2) / height;
      const d = nx * nx / 0.16 + ny * ny / 0.2;
      if (d > 1) return bg;
      if (Math.abs(nx) > 0.26 && ny < -0.28 && ny > -0.48) return ear;
      if (Math.abs(nx) < 0.13 && ny > 0.08 && ny < 0.18) return nose;
      if (Math.abs(nx) > 0.23 && Math.abs(nx) < 0.36 && ny > -0.17 && ny < -0.02) return eye;
      return d > 0.87 ? edge : body;
    });
  }

  function updateBoardButtons() {
    document.querySelectorAll("[data-board]").forEach((button) => button.classList.toggle("active", button.dataset.board === state.board));
  }

  function updateDimensionLabels() {
    $("#widthInput").value = state.width;
    $("#heightInput").value = state.height;
    $("#sizeSlider").value = Math.min(200, state.width);
    $("#sizeReadout").textContent = `${state.width} × ${state.height}`;
    $("#canvasDimensions").textContent = `${state.width} × ${state.height}`;
    $("#canvasMetaSize").textContent = `${state.width} × ${state.height} 格`;
  }

  function setDimensions(width, height) {
    const w = Math.max(8, Math.min(200, Math.round(width)));
    const h = Math.max(8, Math.min(200, Math.round(height)));
    if (w !== state.width || h !== state.height) {
      const old = state.pattern;
      const oldW = state.width;
      const oldH = state.height;
      state.width = w;
      state.height = h;
      state.pattern = Array.from({ length: w * h }, (_, n) => {
        const x = Math.min(oldW - 1, Math.floor((n % w) * oldW / w));
        const y = Math.min(oldH - 1, Math.floor(Math.floor(n / w) * oldH / h));
        return old[y * oldW + x] ?? at("H1");
      });
      state.board = "custom";
      updateBoardButtons();
      if (state.sourceImage) applySourceImage();
    }
    updateDimensionLabels();
    renderAll();
  }

  function cellSize() {
    const longest = Math.max(state.width, state.height);
    return longest > 140 ? 9 : longest > 90 ? 11 : longest > 60 ? 13 : 16;
  }

  function textColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 > 168 ? "#202820" : "#ffffff";
  }

  function drawPattern() {
    const cell = cellSize();
    canvas.width = state.width * cell;
    canvas.height = state.height * cell;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < state.height; y += 1) {
      for (let x = 0; x < state.width; x += 1) {
        ctx.fillStyle = COLORS[state.pattern[y * state.width + x] ?? at("H1")].hex;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    if (state.showGrid) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(45, 54, 47, .34)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= state.width; x += 1) { ctx.moveTo(x * cell + 0.5, 0); ctx.lineTo(x * cell + 0.5, canvas.height); }
      for (let y = 0; y <= state.height; y += 1) { ctx.moveTo(0, y * cell + 0.5); ctx.lineTo(canvas.width, y * cell + 0.5); }
      ctx.stroke();
    }
    if (state.showCodes) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `500 ${Math.max(3.5, Math.min(9, cell * 0.48))}px "DM Mono", monospace`;
      for (let y = 0; y < state.height; y += 1) {
        for (let x = 0; x < state.width; x += 1) {
          const color = COLORS[state.pattern[y * state.width + x] ?? at("H1")];
          ctx.fillStyle = textColor(color.hex);
          ctx.fillText(color.code, x * cell + cell / 2, y * cell + cell / 2 + 0.3, cell + 2);
        }
      }
    }
  }

  function countsByColor() {
    const counts = new Uint32Array(COLORS.length);
    state.pattern.forEach((i) => { counts[i] += 1; });
    return counts;
  }

  function updateCounts() {
    const counts = countsByColor();
    let used = 0;
    COLORS.forEach((color, i) => {
      if (counts[i]) used += 1;
      const row = paletteList.querySelector(`[data-color="${i}"]`);
      if (row) row.querySelector(".color-quantity").innerHTML = `${counts[i]}<small>颗</small>`;
    });
    $("#usedColors").textContent = String(used);
    $("#paletteCount").textContent = `${COLORS.length} COLORS`;
    $("#printLegend").innerHTML = COLORS.map((color, i) => counts[i] ? `<span class="print-legend-item"><i class="print-legend-swatch" style="background:${color.hex}"></i><span class="print-legend-label">${color.code} · ${counts[i]} 颗</span></span>` : "").join("");
  }

  function renderPalette() {
    paletteList.innerHTML = COLORS.map((color, i) => `<button class="color-row${i === state.selected ? " active" : ""}" type="button" role="listitem" data-color="${i}" aria-pressed="${i === state.selected}" aria-label="${color.code} ${color.family}"><span class="color-swatch" style="background:${color.hex}"></span><span class="color-info"><strong>${color.code} · ${color.family}</strong><span class="color-code">MARD 221 · ${color.hex}</span></span><span class="color-quantity">0<small>颗</small></span></button>`).join("");
    paletteList.querySelectorAll("[data-color]").forEach((button) => button.addEventListener("click", () => {
      state.selected = Number(button.dataset.color);
      updateBrush();
      paletteList.querySelectorAll("[data-color]").forEach((row) => {
        const active = Number(row.dataset.color) === state.selected;
        row.classList.toggle("active", active);
        row.setAttribute("aria-pressed", String(active));
      });
    }));
    updateCounts();
  }

  function updateBrush() {
    const color = COLORS[state.selected];
    $("#brushSwatch").style.background = color.hex;
    $("#brushName").textContent = `${color.code} · ${color.family}`;
  }

  function updateStats() {
    $("#totalCount").textContent = state.pattern.length.toLocaleString("zh-CN");
    $("#canvasSubtitle").textContent = state.sourceImage ? "图片已转换为 MARD 221 色板，可逐格调整" : "MARD 221 图纸已就绪，导入图片开始制作";
  }

  function renderAll() {
    drawPattern();
    updateStats();
    updateCounts();
  }

  function nearestColorIndex(r, g, b) {
    let best = 0;
    let min = Infinity;
    COLORS.forEach((color, i) => {
      const cr = parseInt(color.hex.slice(1, 3), 16);
      const cg = parseInt(color.hex.slice(3, 5), 16);
      const cb = parseInt(color.hex.slice(5, 7), 16);
      const dr = r - cr, dg = g - cg, db = b - cb;
      const distance = dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;
      if (distance < min) { min = distance; best = i; }
    });
    return best;
  }

  function applySourceImage() {
    if (!state.sourceImage) return;
    const sample = document.createElement("canvas");
    sample.width = state.width;
    sample.height = state.height;
    const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
    sampleCtx.fillStyle = COLORS[at("H1")].hex;
    sampleCtx.fillRect(0, 0, state.width, state.height);
    const img = state.sourceImage;
    const scale = state.fit === "cover" ? Math.max(state.width / img.naturalWidth, state.height / img.naturalHeight) : Math.min(state.width / img.naturalWidth, state.height / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    sampleCtx.drawImage(img, (state.width - w) / 2, (state.height - h) / 2, w, h);
    const data = sampleCtx.getImageData(0, 0, state.width, state.height).data;
    state.pattern = Array.from({ length: state.width * state.height }, (_, i) => nearestColorIndex(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]));
    renderAll();
  }

  function toast(message) {
    const box = $("#toast");
    box.textContent = message;
    box.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => box.classList.remove("show"), 2300);
  }

  function readImage(file) {
    if (!file || !file.type.startsWith("image/")) return toast("请选择图片文件");
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (state.sourceImage?.src?.startsWith("blob:")) URL.revokeObjectURL(state.sourceImage.src);
      state.sourceImage = image;
      $("#uploadTitle").textContent = file.name;
      $("#uploadCaption").textContent = `${image.naturalWidth} × ${image.naturalHeight} px`;
      applySourceImage();
      toast("图片已转换为 MARD 221 色号图纸");
    };
    image.onerror = () => { URL.revokeObjectURL(url); toast("图片无法读取，请换一张试试"); };
    image.src = url;
  }

  function paintAt(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / rect.width * state.width);
    const y = Math.floor((event.clientY - rect.top) / rect.height * state.height);
    if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;
    const index = y * state.width + x;
    if (state.pattern[index] === state.selected) return;
    state.pattern[index] = state.selected;
    renderAll();
  }

  function drawExport() {
    const longest = Math.max(state.width, state.height);
    const cell = Math.max(10, Math.min(24, Math.floor(2200 / longest)));
    const counts = countsByColor();
    const used = COLORS.map((color, i) => ({ ...color, count: counts[i] })).filter((color) => color.count);
    const margin = 34, boardWidth = state.width * cell, boardHeight = state.height * cell;
    const width = Math.max(760, boardWidth + margin * 2), header = 78;
    const rows = Math.ceil(used.length / 3), rowHeight = 30, legendTop = header + boardHeight + 25;
    const output = document.createElement("canvas");
    output.width = width;
    output.height = legendTop + 34 + rows * rowHeight + 26;
    const c = output.getContext("2d");
    c.fillStyle = "white"; c.fillRect(0, 0, output.width, output.height);
    c.fillStyle = "#354238"; c.font = "600 20px 'Noto Sans SC', sans-serif"; c.fillText("MARD 221 · 拼豆图纸", margin, 33);
    c.fillStyle = "#777d74"; c.font = "12px sans-serif"; c.fillText(`${state.width} × ${state.height} 格　${state.pattern.length} 颗珠子　${used.length} 种颜色`, margin, 56);
    const bx = Math.round((width - boardWidth) / 2), by = header;
    state.pattern.forEach((colorIndex, n) => {
      const x = n % state.width, y = Math.floor(n / state.width), color = COLORS[colorIndex];
      c.fillStyle = color.hex; c.fillRect(bx + x * cell, by + y * cell, cell, cell);
    });
    if (state.showGrid) {
      c.beginPath(); c.strokeStyle = "rgba(45,54,47,.38)"; c.lineWidth = Math.max(1, cell / 22);
      for (let x = 0; x <= state.width; x += 1) { c.moveTo(bx + x * cell + .5, by); c.lineTo(bx + x * cell + .5, by + boardHeight); }
      for (let y = 0; y <= state.height; y += 1) { c.moveTo(bx, by + y * cell + .5); c.lineTo(bx + boardWidth, by + y * cell + .5); }
      c.stroke();
    }
    if (state.showCodes) {
      c.textAlign = "center"; c.textBaseline = "middle"; c.font = `500 ${Math.max(5, Math.min(11, cell * .48))}px monospace`;
      state.pattern.forEach((index, n) => {
        const color = COLORS[index], x = n % state.width, y = Math.floor(n / state.width);
        c.fillStyle = textColor(color.hex); c.fillText(color.code, bx + x * cell + cell / 2, by + y * cell + cell / 2, cell + 2);
      });
    }
    c.textAlign = "left"; c.fillStyle = "#384139"; c.font = "600 13px sans-serif"; c.fillText("色号与珠子用量", margin, legendTop + 14);
    const colWidth = (width - margin * 2) / 3;
    used.forEach((color, i) => {
      const x = margin + i % 3 * colWidth, y = legendTop + 34 + Math.floor(i / 3) * rowHeight;
      c.fillStyle = color.hex; c.fillRect(x, y, 17, 17); c.strokeStyle = "#0002"; c.strokeRect(x + .5, y + .5, 16, 16);
      c.fillStyle = "#555a53"; c.font = "11px sans-serif"; c.fillText(`${color.code} · ${color.count} 颗`, x + 24, y + 13);
    });
    const link = document.createElement("a");
    link.download = `MARD221拼豆图纸-${state.width}x${state.height}.png`;
    link.href = output.toDataURL("image/png"); link.click();
    toast("已导出带格子色号和用量清单的 PNG");
  }

  $("#imageInput").addEventListener("change", (event) => readImage(event.target.files[0]));
  const upload = $("#uploadCard");
  upload.addEventListener("dragover", (event) => { event.preventDefault(); upload.classList.add("dragging"); });
  upload.addEventListener("dragleave", () => upload.classList.remove("dragging"));
  upload.addEventListener("drop", (event) => { event.preventDefault(); upload.classList.remove("dragging"); readImage(event.dataTransfer.files[0]); });
  document.querySelectorAll("[data-board]").forEach((button) => button.addEventListener("click", () => {
    const preset = button.dataset.board;
    if (preset === "custom") { state.board = "custom"; updateBoardButtons(); toast("输入宽度和高度，支持 8–200 格"); return; }
    const [w, h] = preset.split("x").map(Number);
    state.board = preset;
    updateBoardButtons();
    setDimensions(w, h);
  }));
  $("#widthInput").addEventListener("change", (event) => {
    const value = Math.max(8, Math.min(200, Math.round(Number(event.currentTarget.value) || 52)));
    event.currentTarget.value = value;
    setDimensions(value, state.height);
  });
  $("#heightInput").addEventListener("change", (event) => {
    const value = Math.max(8, Math.min(200, Math.round(Number(event.currentTarget.value) || 52)));
    event.currentTarget.value = value;
    setDimensions(state.width, value);
  });
  $("#sizeSlider").addEventListener("input", (event) => {
    const w = Number(event.currentTarget.value);
    setDimensions(w, Math.max(8, Math.min(200, Math.round(w * state.height / state.width))));
  });
  document.querySelectorAll("[data-fit]").forEach((button) => button.addEventListener("click", () => {
    state.fit = button.dataset.fit;
    document.querySelectorAll("[data-fit]").forEach((item) => item.classList.toggle("active", item === button));
    $(".fit-copy").textContent = state.fit === "cover" ? "填满画布，边缘图片会被裁切。" : "完整显示图片，不裁切主体。";
    if (state.sourceImage) applySourceImage();
  }));
  $("#codeToggle").addEventListener("change", (event) => { state.showCodes = event.target.checked; drawPattern(); });
  $("#gridToggle").addEventListener("click", (event) => {
    state.showGrid = !state.showGrid;
    event.currentTarget.classList.toggle("active", state.showGrid);
    event.currentTarget.setAttribute("aria-pressed", String(state.showGrid));
    drawPattern();
  });
  $("#brushButton").addEventListener("click", () => paletteList.scrollIntoView({ behavior: "smooth", block: "start" }));
  canvas.addEventListener("pointerdown", (event) => { canvas.setPointerCapture(event.pointerId); paintAt(event); });
  canvas.addEventListener("pointermove", (event) => { if (event.buttons === 1) paintAt(event); });
  $("#exportButton").addEventListener("click", drawExport);
  $("#resetButton").addEventListener("click", () => {
    if (state.sourceImage?.src?.startsWith("blob:")) URL.revokeObjectURL(state.sourceImage.src);
    state.sourceImage = null; state.fit = "contain"; state.showGrid = true; state.showCodes = true; state.selected = at("H1");
    $("#imageInput").value = ""; $("#uploadTitle").textContent = "点击上传图片"; $("#uploadCaption").textContent = "或将图片拖到这里";
    $("#codeToggle").checked = true; $("#gridToggle").classList.add("active"); $("#gridToggle").setAttribute("aria-pressed", "true");
    document.querySelectorAll("[data-fit]").forEach((button) => button.classList.toggle("active", button.dataset.fit === "contain"));
    $(".fit-copy").textContent = "完整显示图片，不裁切主体。";
    state.board = "52x52"; makeSample(52, 52); updateBoardButtons(); updateDimensionLabels(); updateBrush(); renderAll(); toast("已恢复 52 钉豆板示例图纸");
  });

  makeSample(52, 52);
  updateDimensionLabels();
  updateBoardButtons();
  renderPalette();
  updateBrush();
  renderAll();
})();
