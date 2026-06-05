const R = 8.314;

const gasInputs = {
  temperature: document.querySelector("#temperature"),
  volume: document.querySelector("#volume"),
  moles: document.querySelector("#moles"),
};

const gasOutputs = {
  temp: document.querySelector("#tempOutput"),
  volume: document.querySelector("#volumeOutput"),
  moles: document.querySelector("#molesOutput"),
  pressure: document.querySelector("#pressureReadout"),
  pressureBadge: document.querySelector("#pressureBadge"),
  kinetic: document.querySelector("#kineticReadout"),
  state: document.querySelector("#stateReadout"),
  equation: document.querySelector("#gasEquation"),
};

const calorInputs = {
  material: document.querySelector("#material"),
  mass: document.querySelector("#mass"),
  initialTemp: document.querySelector("#initialTemp"),
  finalTemp: document.querySelector("#finalTemp"),
};

const calorOutputs = {
  mass: document.querySelector("#massOutput"),
  initialTemp: document.querySelector("#initialTempOutput"),
  finalTemp: document.querySelector("#finalTempOutput"),
  heat: document.querySelector("#heatReadout"),
  meaning: document.querySelector("#heatMeaning"),
  fill: document.querySelector("#thermoFill"),
};

const gasCanvas = document.querySelector("#gasCanvas");
const gasCtx = gasCanvas.getContext("2d");
const processCanvas = document.querySelector("#processCanvas");
const processCtx = processCanvas.getContext("2d");

const particles = Array.from({ length: 72 }, (_, index) => ({
  x: 90 + (index % 12) * 42,
  y: 92 + Math.floor(index / 12) * 36,
  vx: Math.cos(index * 1.9),
  vy: Math.sin(index * 2.4),
  r: 4 + (index % 3),
}));

const processes = {
  isotermico: {
    title: "Proceso isotermico",
    description: "La temperatura permanece constante. Si el gas se expande, su presion disminuye para conservar PV.",
    constant: "Temperatura",
    example: "Un gas se expande lentamente en contacto con un bano termico.",
    key: "El calor que entra se transforma en trabajo.",
    color: "#d9822b",
  },
  isobarico: {
    title: "Proceso isobarico",
    description: "La presion permanece constante. Al aumentar la temperatura, el volumen tambien aumenta.",
    constant: "Presion",
    example: "Un cilindro con piston libre que sube al calentarse.",
    key: "W = P DeltaV porque la presion no cambia.",
    color: "#2d6cdf",
  },
  isocorico: {
    title: "Proceso isocorico",
    description: "El volumen permanece constante. No hay trabajo de expansion porque DeltaV es cero.",
    constant: "Volumen",
    example: "Calentar gas dentro de un recipiente rigido cerrado.",
    key: "Todo el calor modifica la energia interna.",
    color: "#0f766e",
  },
  adiabatico: {
    title: "Proceso adiabatico",
    description: "No hay intercambio de calor con el exterior. La temperatura cambia por compresion o expansion.",
    constant: "Q = 0",
    example: "Compresion rapida del aire en una bomba manual.",
    key: "La energia interna cambia por trabajo.",
    color: "#c2413b",
  },
};

const quiz = [
  {
    prompt: "Si sube la temperatura de un gas y el volumen se mantiene constante, la presion...",
    options: ["aumenta", "disminuye", "queda igual"],
    answer: "aumenta",
  },
  {
    prompt: "En un proceso isocorico, el trabajo del gas es...",
    options: ["cero", "maximo", "negativo siempre"],
    answer: "cero",
  },
  {
    prompt: "Para calentar mas masa del mismo material se necesita...",
    options: ["mas calor", "menos calor", "la misma energia"],
    answer: "mas calor",
  },
];

let activeProcess = "isotermico";
let lastGasState = { pressureKpa: 0, speed: 1 };

function formatNumber(value, digits = 1) {
  return Number(value).toLocaleString("es-MX", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.round(rect.width * scale));
  const height = Math.max(190, Math.round(rect.height * scale));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width, height, scale };
}

function updateGas() {
  const temperature = Number(gasInputs.temperature.value);
  const volumeLiters = Number(gasInputs.volume.value);
  const moles = Number(gasInputs.moles.value);
  const volumeM3 = volumeLiters / 1000;
  const pressurePa = (moles * R * temperature) / volumeM3;
  const pressureKpa = pressurePa / 1000;

  gasOutputs.temp.textContent = `${temperature} K`;
  gasOutputs.volume.textContent = `${formatNumber(volumeLiters, 1)} L`;
  gasOutputs.moles.textContent = `${formatNumber(moles, 2)} mol`;
  gasOutputs.pressure.textContent = `${formatNumber(pressureKpa, 1)} kPa`;
  gasOutputs.pressureBadge.textContent = `${formatNumber(pressureKpa, 0)} kPa`;
  gasOutputs.kinetic.textContent = temperature < 280 ? "baja" : temperature < 430 ? "media" : "alta";
  gasOutputs.state.textContent = pressureKpa > 500 ? "alta presion" : volumeLiters > 17 ? "expansion" : "equilibrio";
  gasOutputs.equation.textContent = `P = (${formatNumber(moles, 2)} mol)(8.314)(${temperature} K) / ${volumeM3.toFixed(3)} m3`;

  lastGasState = {
    pressureKpa,
    speed: Math.max(0.7, temperature / 260),
    chamberRatio: Math.min(1, Math.max(0.32, volumeLiters / 24)),
  };
}

function drawGas() {
  const { width, height } = resizeCanvas(gasCanvas);
  gasCtx.clearRect(0, 0, width, height);

  const margin = width * 0.08;
  const chamberWidth = (width - margin * 2) * lastGasState.chamberRatio;
  const chamberHeight = height * 0.68;
  const chamberX = margin;
  const chamberY = height * 0.16;
  const pistonX = chamberX + chamberWidth;

  gasCtx.fillStyle = "#111a1d";
  gasCtx.fillRect(0, 0, width, height);
  gasCtx.strokeStyle = "#d7d2c6";
  gasCtx.lineWidth = Math.max(2, width * 0.004);
  gasCtx.strokeRect(chamberX, chamberY, chamberWidth, chamberHeight);

  gasCtx.fillStyle = "#7d8a8f";
  gasCtx.fillRect(pistonX - 10, chamberY - 18, 20, chamberHeight + 36);
  gasCtx.fillStyle = "#d9822b";
  gasCtx.fillRect(pistonX + 9, chamberY + chamberHeight * 0.45, width * 0.16, 14);

  gasCtx.fillStyle = "rgba(217, 130, 43, 0.18)";
  gasCtx.fillRect(chamberX + 2, chamberY + 2, Math.max(0, chamberWidth - 4), Math.max(0, chamberHeight - 4));

  const speed = lastGasState.speed;
  for (const p of particles) {
    p.x += p.vx * speed;
    p.y += p.vy * speed;

    const minX = chamberX + p.r + 6;
    const maxX = pistonX - p.r - 10;
    const minY = chamberY + p.r + 6;
    const maxY = chamberY + chamberHeight - p.r - 6;

    if (p.x < minX || p.x > maxX) p.vx *= -1;
    if (p.y < minY || p.y > maxY) p.vy *= -1;
    p.x = Math.min(maxX, Math.max(minX, p.x));
    p.y = Math.min(maxY, Math.max(minY, p.y));

    gasCtx.beginPath();
    gasCtx.fillStyle = p.r > 5 ? "#f7b267" : "#88d8cf";
    gasCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    gasCtx.fill();
  }

  gasCtx.fillStyle = "#f7f4ee";
  gasCtx.font = `${Math.max(14, width * 0.025)}px system-ui`;
  gasCtx.fillText(`P = ${formatNumber(lastGasState.pressureKpa, 1)} kPa`, chamberX, height * 0.93);

  requestAnimationFrame(drawGas);
}

function updateCalor() {
  const c = Number(calorInputs.material.value);
  const mass = Number(calorInputs.mass.value);
  const ti = Number(calorInputs.initialTemp.value);
  const tf = Number(calorInputs.finalTemp.value);
  const delta = tf - ti;
  const q = mass * c * delta;
  const qKj = q / 1000;
  const fillPercent = Math.max(6, Math.min(92, ((tf + 10) / 160) * 86 + 6));

  calorOutputs.mass.textContent = `${formatNumber(mass, 2)} kg`;
  calorOutputs.initialTemp.textContent = `${ti} °C`;
  calorOutputs.finalTemp.textContent = `${tf} °C`;
  calorOutputs.heat.textContent = `${formatNumber(qKj, 1)} kJ`;
  calorOutputs.fill.style.height = `${fillPercent}%`;
  calorOutputs.meaning.textContent =
    q >= 0
      ? `El sistema absorbe ${formatNumber(Math.abs(qKj), 1)} kJ de energia para calentarse.`
      : `El sistema libera ${formatNumber(Math.abs(qKj), 1)} kJ de energia al enfriarse.`;
}

function drawProcess() {
  const { width, height } = resizeCanvas(processCanvas);
  const data = processes[activeProcess];
  const pad = width * 0.12;
  const bottom = height - pad;
  const left = pad;
  const right = width - pad * 0.65;
  const top = pad * 0.65;

  processCtx.clearRect(0, 0, width, height);
  processCtx.fillStyle = "#10191b";
  processCtx.fillRect(0, 0, width, height);

  processCtx.strokeStyle = "#d7d2c6";
  processCtx.lineWidth = Math.max(2, width * 0.004);
  processCtx.beginPath();
  processCtx.moveTo(left, top);
  processCtx.lineTo(left, bottom);
  processCtx.lineTo(right, bottom);
  processCtx.stroke();

  processCtx.fillStyle = "#f7f4ee";
  processCtx.font = `${Math.max(13, width * 0.022)}px system-ui`;
  processCtx.fillText("P", left - 24, top + 8);
  processCtx.fillText("V", right - 8, bottom + 30);

  processCtx.strokeStyle = data.color;
  processCtx.lineWidth = Math.max(4, width * 0.008);
  processCtx.beginPath();

  if (activeProcess === "isobarico") {
    const y = top + (bottom - top) * 0.38;
    processCtx.moveTo(left + 22, y);
    processCtx.lineTo(right - 18, y);
  } else if (activeProcess === "isocorico") {
    const x = left + (right - left) * 0.45;
    processCtx.moveTo(x, bottom - 22);
    processCtx.lineTo(x, top + 20);
  } else {
    for (let i = 0; i <= 90; i += 1) {
      const t = i / 90;
      const x = left + 24 + t * (right - left - 64);
      const curvePower = activeProcess === "adiabatico" ? 1.55 : 1.05;
      const y = bottom - 30 - (bottom - top - 80) / Math.pow(1 + t * 2.4, curvePower);
      if (i === 0) processCtx.moveTo(x, y);
      else processCtx.lineTo(x, y);
    }
  }

  processCtx.stroke();

  processCtx.fillStyle = data.color;
  processCtx.beginPath();
  processCtx.arc(right - 24, activeProcess === "isocorico" ? top + 22 : top + (bottom - top) * 0.38, 7, 0, Math.PI * 2);
  processCtx.fill();
}

function setProcess(processKey) {
  activeProcess = processKey;
  const data = processes[processKey];

  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.process === processKey);
  });

  document.querySelector("#processTitle").textContent = data.title;
  document.querySelector("#processDescription").textContent = data.description;
  document.querySelector("#processConstant").textContent = data.constant;
  document.querySelector("#processExample").textContent = data.example;
  document.querySelector("#processKey").textContent = data.key;
  drawProcess();
}

function renderQuiz() {
  const list = document.querySelector("#quizList");
  list.innerHTML = quiz
    .map((question, index) => {
      const options = question.options
        .map(
          (option) => `
            <label>
              <input type="radio" name="quiz-${index}" value="${option}">
              <span>${option}</span>
            </label>
          `,
        )
        .join("");

      return `
        <div class="quiz-question">
          <p>${index + 1}. ${question.prompt}</p>
          <div class="quiz-options">${options}</div>
        </div>
      `;
    })
    .join("");
}

function checkQuiz() {
  const correct = quiz.reduce((score, question, index) => {
    const selected = document.querySelector(`input[name="quiz-${index}"]:checked`);
    return score + (selected?.value === question.answer ? 1 : 0);
  }, 0);

  const feedback = document.querySelector("#quizFeedback");
  feedback.textContent =
    correct === quiz.length
      ? "Excelente: conectaste las leyes con los experimentos."
      : `Resultado: ${correct}/${quiz.length}. Revisa las estaciones y vuelve a intentarlo.`;
}

function setupNotebook() {
  const note = document.querySelector("#notebookText");
  const status = document.querySelector("#noteStatus");
  note.value = localStorage.getItem("termoLabNote") || "";

  document.querySelector("#saveNote").addEventListener("click", () => {
    localStorage.setItem("termoLabNote", note.value.trim());
    status.textContent = "Conclusion guardada en este navegador.";
  });

  document.querySelector("#clearNote").addEventListener("click", () => {
    note.value = "";
    localStorage.removeItem("termoLabNote");
    status.textContent = "Bitacora limpia.";
  });
}

Object.values(gasInputs).forEach((input) => input.addEventListener("input", updateGas));
Object.values(calorInputs).forEach((input) => input.addEventListener("input", updateCalor));
document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => setProcess(button.dataset.process));
});
document.querySelector("#checkQuiz").addEventListener("click", checkQuiz);
window.addEventListener("resize", drawProcess);

renderQuiz();
setupNotebook();
updateGas();
updateCalor();
setProcess(activeProcess);
requestAnimationFrame(drawGas);
