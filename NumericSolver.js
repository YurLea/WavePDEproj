export class NumericSolver {
  constructor(phiFunction, psiFunction, a, l) {
    this.a = a;
    this.l = l;

    this.dx = 0.007;
    this.dt = 0.5 * this.dx / this.a; // условие устойчивости

    this.t = 0;

    this.n = Math.floor(this.l / this.dx) + 1;
    this.lambda = (this.a * this.dt) / this.dx;
    this.r = this.lambda * this.lambda;

    this.phiExpr = math.compile(phiFunction);
    this.psiExpr = math.compile(psiFunction);

    this.uPrev = new Array(this.n).fill(0);     // u^(n-1)
    this.currLayer = new Array(this.n).fill(0); // u^n

    this.isFirstStep = true;

    this.initialize();
  }

  phi(x) {
    return this.phiExpr.evaluate({ x });
  }

  psi(x) {
    return this.psiExpr.evaluate({ x });
  }

  applyBorder(layer) {
    layer[0] = 0;
    layer[this.n - 1] = layer[this.n - 2];
  }

  initialize() {
    for (let i = 0; i < this.n; i++) {
      let x = i * this.dx;
      if (x > this.l) x = this.l;
      this.currLayer[i] = this.phi(x);
    }

    this.applyBorder(this.currLayer);

    // на t = 0
    this.uPrev = [...this.currLayer];
  }

  buildFirstLayer() {
    const firstLayer = new Array(this.n).fill(0);
    firstLayer[0] = 0;

    for (let i = 1; i < this.n - 1; i++) {
      let x = i * this.dx;
      if (x > this.l) x = this.l;

      const secondDiff =
        this.currLayer[i + 1] - 2 * this.currLayer[i] + this.currLayer[i - 1];

      firstLayer[i] =
        this.currLayer[i] +
        this.dt * this.psi(x) +
        0.5 * this.r * secondDiff;
    }

    firstLayer[this.n - 1] = firstLayer[this.n - 2];

    this.uPrev = [...this.currLayer];
    this.currLayer = firstLayer;
    this.t += this.dt;
    this.isFirstStep = false;
  }

  makeTimeStep() {
    if (this.isFirstStep) {
      this.buildFirstLayer();
      return;
    }

    const nextLayer = new Array(this.n).fill(0);
    nextLayer[0] = 0;

    for (let i = 1; i < this.n - 1; i++) {
      const secondDiff =
        this.currLayer[i + 1] - 2 * this.currLayer[i] + this.currLayer[i - 1];

      nextLayer[i] =
        2 * this.currLayer[i] -
        this.uPrev[i] +
        this.r * secondDiff;
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