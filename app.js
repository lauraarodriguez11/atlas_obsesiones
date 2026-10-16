const canvas = document.getElementById("hexCanvas");
const ctx = canvas.getContext("2d");
const tooltip = document.getElementById("tooltip");

const cx = canvas.width / 2;
const cy = canvas.height / 2;
const R = 270;
const AVATAR_SIZE = 36; // Diámetro de cada imagen circular

// Orden científico Valencia / Arousal
// [0: Alegría, 1: Sorpresa, 2: Miedo, 3: Ira, 4: Asco, 5: Tristeza]
const emotions = [
  { name: "Alegría",  angle: 0 },
  { name: "Sorpresa", angle: Math.PI / 3 },
  { name: "Miedo",    angle: (2 * Math.PI) / 3 },
  { name: "Ira",      angle: Math.PI },
  { name: "Asco",     angle: (4 * Math.PI) / 3 },
  { name: "Tristeza", angle: (5 * Math.PI) / 3 }
];

// Matriz de pesos normalizados (suman 1.0)
// Orden de índices: [Alegría, Sorpresa, Miedo, Ira, Asco, Tristeza]
const items = [
  { name: "Hilbert",       imgSrc: "img/hilbert.png",     weights: [0.45, 0.55, 0.00, 0.00, 0.00, 0.00] },
  { name: "Gatita",        imgSrc: "img/gatita.png",      weights: [0.50, 0.15, 0.35, 0.00, 0.00, 0.00] },
  { name: "Orquídeas",     imgSrc: "img/orquideas.png",   weights: [0.40, 0.60, 0.00, 0.00, 0.00, 0.00] },
  { name: "Luz",           imgSrc: "img/luz.png",         weights: [0.50, 0.00, 0.00, 0.00, 0.00, 0.50] },
  { name: "Avatar",        imgSrc: "img/avatar.png",      weights: [0.35, 0.55, 0.00, 0.00, 0.00, 0.10] },
  { name: "Terror",        imgSrc: "img/terror.png",      weights: [0.00, 0.35, 0.50, 0.00, 0.00, 0.15] },
  { name: "Arcane",        imgSrc: "img/arcane.png",      weights: [0.00, 0.25, 0.00, 0.40, 0.00, 0.35] },
  { name: "Discos",        imgSrc: "img/discos.png",      weights: [0.40, 0.00, 0.15, 0.00, 0.00, 0.45] },
  { name: "Vulneración",   imgSrc: "img/vulneracion.png", weights: [0.00, 0.00, 0.00, 0.60, 0.40, 0.00] },
  { name: "Hermanos",      imgSrc: "img/hermanos.png",    weights: [0.65, 0.15, 0.20, 0.00, 0.00, 0.00] },
  { name: "Padre",         imgSrc: "img/padre.png",       weights: [0.60, 0.15, 0.00, 0.00, 0.00, 0.25] },
  { name: "Naturaleza",    imgSrc: "img/naturaleza.png",  weights: [0.70, 0.20, 0.00, 0.00, 0.00, 0.10] }
];

// Precarga de imágenes
const loadedImages = {};
let loadedCount = 0;

items.forEach(item => {
  const img = new Image();
  img.src = item.imgSrc;
  img.onload = () => {
    loadedCount++;
    if (loadedCount === items.length) render();
  };
  img.onerror = () => {
    // Si la imagen aún no existe o falla, se dibuja un fallback
    loadedCount++;
    if (loadedCount === items.length) render();
  };
  loadedImages[item.name] = img;
});

// Coordenadas calculadas de cada elemento
let projectedPoints = [];

function calculatePositions() {
  projectedPoints = items.map(item => {
    let px = 0;
    let py = 0;
    item.weights.forEach((w, idx) => {
      px += w * (R * Math.cos(emotions[idx].angle));
      py += w * (-R * Math.sin(emotions[idx].angle)); // Invertir Y para canvas
    });
    return {
      ...item,
      x: cx + px,
      y: cy + py
    };
  });
}

function drawHexagon() {
  // Anillos concéntricos de referencia (25%, 50%, 75%, 100%)
  [0.25, 0.5, 0.75, 1.0].forEach(level => {
    ctx.strokeStyle = level === 1.0 ? "#38434f" : "#21262d";
    ctx.lineWidth = level === 1.0 ? 2 : 1;
    ctx.beginPath();
    emotions.forEach((e, i) => {
      const vx = cx + R * level * Math.cos(e.angle);
      const vy = cy - R * level * Math.sin(e.angle);
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    });
    ctx.closePath();
    ctx.stroke();
  });

  // Ejes radiales y etiquetas de los vértices
  emotions.forEach(e => {
    const vx = cx + R * Math.cos(e.angle);
    const vy = cy - R * Math.sin(e.angle);

    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(vx, vy);
    ctx.stroke();

    const lx = cx + (R + 32) * Math.cos(e.angle);
    const ly = cy - (R + 32) * Math.sin(e.angle);

    ctx.fillStyle = "#58a6ff";
    ctx.font = "bold 13px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(e.name, lx, ly);
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawHexagon();

  projectedPoints.forEach(p => {
    const radius = AVATAR_SIZE / 2;
    const img = loadedImages[p.name];

    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (img && img.complete && img.naturalWidth !== 0) {
      ctx.drawImage(img, p.x - radius, p.y - radius, AVATAR_SIZE, AVATAR_SIZE);
    } else {
      // Fallback con círculo de color y primera letra si falta el archivo
      ctx.fillStyle = "#f78166";
      ctx.fill();
      ctx.fillStyle = "#0d1117";
      ctx.font = "bold 12px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.name.slice(0, 2), p.x, p.y);
    }
    ctx.restore();

    // Borde exterior del avatar
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nombre debajo del icono
    ctx.fillStyle = "#8b949e";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(p.name, p.x, p.y + radius + 12);
  });
}

// Interacción con ratón para Tooltip
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  let activeItem = null;
  const radius = AVATAR_SIZE / 2;

  for (const p of projectedPoints) {
    const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
    if (dist <= radius + 4) {
      activeItem = p;
      break;
    }
  }

  if (activeItem) {
    const breakdown = activeItem.weights
      .map((w, idx) => ({ name: emotions[idx].name, pct: Math.round(w * 100) }))
      .filter(entry => entry.pct > 0)
      .map(entry => `${entry.name}:${entry.pct}%`)
      .join(" | ");

    tooltip.innerHTML = `<strong>${activeItem.name}</strong><br/>${breakdown}`;
    tooltip.style.left = `${activeItem.x}px`;
    tooltip.style.top = `${activeItem.y - radius}px`;
    tooltip.classList.remove("hidden");
  } else {
    tooltip.classList.add("hidden");
  }
});

calculatePositions();
render();
