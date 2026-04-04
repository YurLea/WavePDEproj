export class NumericSolver {
  constructor(phiFunction, psiFunction, a, l) {
    this.a = a;
    this.l = l;

    this.dt = 0.05;
    this.dx = 0.05;

    this.t = 0;

    this.n = Math.floor(this.l / this.dx) + 1;
    this.r = (this.a * this.a * this.dt * this.dt) / (this.dx * this.dx);

    this.phiExpr = math.compile(phiFunction);
    this.psiExpr = math.compile(psiFunction);

    this.uPrev = new Array(this.n).fill(0);      // u^0
    this.currLayer = new Array(this.n).fill(0);  // u^1

    this.initialize();
  }

  phi(x) {
    return this.phiExpr.evaluate({ x });
  }

  psi(x) {
    return this.psiExpr.evaluate({ x });
  }

  initialize() {
    // Проверка устойчивости
    if (this.r > 1) {
      console.warn(
        `Explicit scheme may be unstable: r = ${this.r} > 1. ` +
        `Need a*dt/dx <= 1.`
      );
    }

    // Начальный слой u^0
    for (let i = 0; i < this.n; i++) {
      let x = i * this.dx;
      if (x > this.l) x = this.l;
      this.uPrev[i] = this.phi(x);
    }

    this.applyBorder(this.uPrev);

    // Первый слой u^1
    this.currLayer[0] = 0;

    for (let i = 1; i < this.n - 1; i++) {
      let x = i * this.dx;
      if (x > this.l) x = this.l;

      const laplacian =
        this.uPrev[i + 1] - 2 * this.uPrev[i] + this.uPrev[i - 1];

      this.currLayer[i] =
        this.uPrev[i] +
        this.dt * this.psi(x) +
        0.5 * this.r * laplacian;
    }

    this.currLayer[this.n - 1] = this.currLayer[this.n - 2];

    this.t = this.dt;
  }

  applyBorder(layer) {
    layer[0] = 0;
    layer[this.n - 1] = layer[this.n - 2];
  }

  makeTimeStep() {
    const nextLayer = new Array(this.n).fill(0);

    nextLayer[0] = 0;

    for (let i = 1; i < this.n - 1; i++) {
      nextLayer[i] =
        2 * this.currLayer[i] -
        this.uPrev[i] +
        this.r * (
          this.currLayer[i + 1] -
          2 * this.currLayer[i] +
          this.currLayer[i - 1]
        );
    }

    nextLayer[this.n - 1] = nextLayer[this.n - 2];

    this.uPrev = [...this.currLayer];
    this.currLayer = nextLayer;
    this.t += this.dt;
  }

  getUAt(x) {
    const i = Math.round(x / this.dx);
    const idx = Math.max(0, Math.min(this.n - 1, i));
    return this.currLayer[idx];
  }

  get u() {
    return [...this.currLayer];
  }
}