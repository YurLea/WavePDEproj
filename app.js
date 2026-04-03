import { AnalyticalSolver } from './DalamberSolver.js';

const phiInputField = document.querySelector('.Phi-function');
const psiInputField = document.querySelector('.Psi-function');
const aInputField = document.querySelector('.a-parameter');
const lInputField = document.querySelector('.l-parameter');
const solveButton = document.querySelector('.solve-button');
const pauseButton = document.querySelector('.pause-button');
const canvas = document.getElementById('string-canvas');
const ctx = canvas.getContext('2d');

const centerY = canvas.height / 2;

let animationId = null;
let currentSolver = null;
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

    currentSolver = new AnalyticalSolver(phi, psi, a, l);
    isPaused = false;
    pauseButton.textContent = 'Pause';

    animate(currentSolver);
  } catch (error) {
    console.error(error);
    alert('Ошибка при создании решателя. Проверьте введённые данные.');
  }
});

pauseButton.addEventListener('click', function () {
  if (!currentSolver) {
    return;
  }

  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
});

function animate(solver) {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }

  const initialValues = solver.u;
  let initialMaxAbs = 1e-6;

  for (const v of initialValues) {
    initialMaxAbs = Math.max(initialMaxAbs, Math.abs(v));
  }

  const yScale = (0.4 * canvas.height) / initialMaxAbs;

  function frame() {
    try {
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
      ctx.strokeStyle = '#2563eb';
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

      // подпись времени
      ctx.fillStyle = '#111827';
      ctx.font = '16px sans-serif';
      ctx.fillText('t = ' + solver.t.toFixed(3), 10, 24);

      // если не пауза — двигаем время
      if (!isPaused) {
        solver.makeTimeStep();
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