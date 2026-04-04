import { AnalyticalSolver } from './DalamberSolver.js';
import { NumericSolver } from './NumericSolver.js';

const phiInputField = document.querySelector('.Phi-function');
const psiInputField = document.querySelector('.Psi-function');
const aInputField = document.querySelector('.a-parameter');
const lInputField = document.querySelector('.l-parameter');
const solveButton = document.querySelector('.solve-button');
const pauseButton = document.querySelector('.pause-button');

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

solveButton.addEventListener('click', function () {
  try {
    const phi = phiInputField.value.trim();
    const psi = psiInputField.value.trim();
    const a = Number(aInputField.value);
    const l = Number(lInputField.value);

    if (!phi || !psi) {
      alert('Введите функции φ(x) и ψ(x).');
      return;
    }

    if (!Number.isFinite(a) || !Number.isFinite(l) || a <= 0 || l <= 0) {
      alert('Параметры a и l должны быть положительными числами.');
      return;
    }

    currentAnalyticalSolver = new AnalyticalSolver(phi, psi, a, l);
    currentNumericSolver = new NumericSolver(phi, psi, a, l);

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
      drawSolver(
        analyticalSolver,
        analyticalCanvas,
        analyticalCtx,
        analyticalCenterY,
        analyticalYScale,
        '#2563eb',
        'Analytical'
      );

      drawSolver(
        numericSolver,
        numericSolver,
        numericCanvas,
        numericCenterY,
        numericYScale,
        '#dc2626',
        'Numeric'
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
      alert('Ошибк�� во время анимации. Проверьте введённые функции.');
    }
  }

  frame();
}

function drawSolver(solver, canvas, ctx, centerY, yScale, color, title) {
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

  // подписи
  ctx.fillStyle = '#111827';
  ctx.font = '16px sans-serif';
  ctx.fillText(title, 10, 24);
  ctx.fillText('t = ' + solver.t.toFixed(3), 10, 46);
}