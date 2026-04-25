import { UserFormulaSolver } from './UserFormulaSolver.js';
import { NumericSolver } from './NumericSolver.js';
import { maxAbsDeviation, meanAbsDeviation } from './DeviationFunctions.js';
import { create, all } from 'https://cdn.jsdelivr.net/npm/mathjs@12.4.2/+esm';

const math = create(all, {});

const phiInputField = document.querySelector('.Phi-function');
const psiInputField = document.querySelector('.Psi-function');
const aInputField = document.querySelector('.a-parameter');
const lInputField = document.querySelector('.l-parameter');
const solveButton = document.querySelector('.solve-button');
const pauseButton = document.querySelector('.pause-button');
const deviationButton = document.querySelector('.deviation-button');
const userSolutionInputField = document.querySelector('.User-function');
const maxDevEl = document.getElementById('max-dev');
const meanDevEl = document.getElementById('mean-dev');

const analyticalCanvas = document.getElementById('string-canvas');
const analyticalCtx = analyticalCanvas.getContext('2d');

const numericCanvas = document.getElementById('string-canvas-2');
const numericCtx = numericCanvas.getContext('2d');

const analyticalCenterY = analyticalCanvas.height / 2;
const numericCenterY = numericCanvas.height / 2;

let animationId = null;
let currentAnalyticalSolver = null;
let currentNumericSolver = null;
let isPaused = false;
let showDeviationPoint = false;

document.querySelectorAll('.math-help-row').forEach((row) => {
  const btn = row.querySelector('.help-btn');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();

    const isOpen = row.classList.contains('open');

    document.querySelectorAll('.math-help-row.open').forEach((other) => {
      other.classList.remove('open');
      other.querySelector('.help-btn')?.setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      row.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.math-help-row.open').forEach((row) => {
    row.classList.remove('open');
    row.querySelector('.help-btn')?.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.math-help-row.open').forEach((row) => {
      row.classList.remove('open');
      row.querySelector('.help-btn')?.setAttribute('aria-expanded', 'false');
    });
  }
});

function toNumber(value) {
  return Number(math.evaluate(value));
}

solveButton.addEventListener('click', function () {
  try {
    const phi = phiInputField.value.trim();
    const psi = psiInputField.value.trim();
    const u = userSolutionInputField.value.trim();
    const a = toNumber(aInputField.value);
    const l = toNumber(lInputField.value);

    if (!phi || !psi) {
      alert('Введите функции φ(x) и ψ(x).');
      return;
    }

    if (!Number.isFinite(a) || !Number.isFinite(l) || a <= 0 || l <= 0) {
      alert('Параметры a и l должны быть положительными числами.');
      return;
    }

    //currentAnalyticalSolver.makeTimeStep();
    currentNumericSolver = new NumericSolver(phi, psi, a, l);
    currentAnalyticalSolver = new UserFormulaSolver(u,
      currentNumericSolver.dt,
      currentNumericSolver.dx,
      l,
      currentNumericSolver.n);

    isPaused = false;
    pauseButton.textContent = 'Pause';

    animate(currentAnalyticalSolver, currentNumericSolver);
  } catch (error) {
    console.error(error);
    alert('Ошибка при создании решателя. Проверьте введённые данные.');
  }
});

pauseButton.addEventListener('click', function () {
  if (!currentAnalyticalSolver || !currentNumericSolver) {
    return;
  }

  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
});

deviationButton.addEventListener('click', function () {
  if (!currentAnalyticalSolver || !currentNumericSolver) {
    return;
  }

  showDeviationPoint = !showDeviationPoint;
})

function animate(analyticalSolver, numericSolver) {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }

  const analyticalInitialValues = analyticalSolver.u;
  const numericInitialValues = numericSolver.u;

  let initialMaxAbs = 1e-6;

  for (const v of analyticalInitialValues) {
    initialMaxAbs = Math.max(initialMaxAbs, Math.abs(v));
  }

  for (const v of numericInitialValues) {
    initialMaxAbs = Math.max(initialMaxAbs, Math.abs(v));
  }

  const analyticalYScale = (0.4 * analyticalCanvas.height) / initialMaxAbs;
  const numericYScale = (0.4 * numericCanvas.height) / initialMaxAbs;

  function frame() {
    try {
      const [maxDev, maxCoord] = maxAbsDeviation(numericSolver, analyticalSolver);
      const meanDev = meanAbsDeviation(numericSolver, analyticalSolver);

      maxDevEl.textContent = maxDev.toFixed(6);
      meanDevEl.textContent = meanDev.toFixed(6);

      drawSolver(
        analyticalSolver,
        analyticalCanvas,
        analyticalCtx,
        analyticalCenterY,
        analyticalYScale,
        '#2563eb',
        'Analytical',
        maxCoord
      );

      drawSolver(
        numericSolver,
        numericCanvas,
        numericCtx,
        numericCenterY,
        numericYScale,
        '#dc2626',
        'Numeric',
        maxCoord
      );

      if (!isPaused) {
        analyticalSolver.makeTimeStep();
        numericSolver.makeTimeStep();
      }

      animationId = requestAnimationFrame(frame);
    } catch (error) {
      console.error(error);
      cancelAnimationFrame(animationId);
      animationId = null;
      alert('Ошибка во время анимации. Проверьте введённые функции.');
    }
  }

  frame();
}

function drawSolver(solver, canvas, ctx, centerY, yScale, color, title, maxCoord = null) {
  const values = solver.u;
  const l = solver.l;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ось равновесия
  ctx.beginPath();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvas.width, centerY);
  ctx.stroke();

  // струна
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  for (let i = 0; i < values.length; i++) {
    let xPhysical = i * solver.dx;
    if (xPhysical > l) xPhysical = l;

    const canvasX = (xPhysical / l) * canvas.width;
    const canvasY = centerY - values[i] * yScale;

    if (i === 0) {
      ctx.moveTo(canvasX, canvasY);
    } else {
      ctx.lineTo(canvasX, canvasY);
    }
  }

  ctx.stroke();

  // подсветка точки maxCoord
  if (showDeviationPoint && Number.isFinite(maxCoord)) {
    const xPhysical = Math.max(0, Math.min(l, maxCoord * solver.dx));
    const canvasX = (xPhysical / l) * canvas.width;

    let valueAtX;
    if (typeof solver.getUAt === 'function') {
      valueAtX = solver.getUAt(xPhysical);
    } else if (typeof solver.uAtX === 'function') {
      valueAtX = solver.uAtX(xPhysical);
    } else {
      const idx = Math.max(0, maxCoord);
      valueAtX = values[idx];
    }

    const canvasY = centerY - valueAtX * yScale;

    // вертикальная линия
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.5;
    ctx.moveTo(canvasX, 0);
    ctx.lineTo(canvasX, canvas.height);
    ctx.stroke();
    ctx.restore();

    // точка
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.arc(canvasX, canvasY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // подпись
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '14px sans-serif';
    ctx.fillText('max Δ', Math.min(canvasX + 8, canvas.width - 50), Math.max(canvasY - 10, 16));
    ctx.restore();
  }

  // подписи
  ctx.fillStyle = '#111827';
  ctx.font = '16px sans-serif';
  ctx.fillText(title, 10, 24);
  ctx.fillText('t = ' + solver.t.toFixed(3), 10, 46);
}