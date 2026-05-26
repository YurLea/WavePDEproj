export class NumericSolver {
  constructor(phiFunction, psiFunction, a, l) {
    this.a = a;
    this.l = l;

    this.dx = 0.005;
    this.dt = (0.5 * this.dx) / this.a;

    this.t = 0;

    this.n = Math.floor(this.l / this.dx) + 1;
    this.lambda = (this.a * this.dt) / this.dx;
    this.r = this.lambda * this.lambda;

    this.phiExpr = math.compile(phiFunction);
    this.psiExpr = math.compile(psiFunction);

    this.layer1 = new Array(this.n); // u^(n-1)
    this.layer2 = new Array(this.n); // u^n
    this.layer3 = new Array(this.n); // u^(n+1) — буфер

    this.phiValues = new Array(this.n);
    this.psiValues = new Array(this.n);
    for (let i = 0; i < this.n; i++) {
      let x = i * this.dx;
      if (x > this.l) x = this.l;
      this.phiValues[i] = this.phiExpr.evaluate({ x });
      this.psiValues[i] = this.psiExpr.evaluate({ x });
    }

    this.initialize();
  }

  initialize() {
    for (let i = 0; i < this.n; i++) {
      this.layer2[i] = this.phiValues[i];
    }
    this.layer2[0] = 0;
    this.layer2[this.n - 1] = this.layer2[this.n - 2];

    this.layer3[0] = 0;

    for (let i = 1; i < this.n - 1; i++) {
      const secondDiff =
        this.layer2[i + 1] - 2 * this.layer2[i] + this.layer2[i - 1];

      this.layer3[i] =
        this.layer2[i] +
        this.dt * this.psiValues[i] +
        0.5 * this.r * secondDiff;
    }

    this.layer3[this.n - 1] = this.layer3[this.n - 2];

    this.layer1 = this.layer2;
    this.layer2 = this.layer3;
    this.layer3 = new Array(this.n);
    this.t += this.dt;
  }

  makeTimeStep() {
    this.layer3[0] = 0;

    for (let i = 1; i < this.n - 1; i++) {
      const secondDiff =
        this.layer2[i + 1] - 2 * this.layer2[i] + this.layer2[i - 1];

      this.layer3[i] =
        2 * this.layer2[i] - this.layer1[i] + this.r * secondDiff;
    }

    this.layer3[this.n - 1] = this.layer3[this.n - 2];

    const tmp = this.layer1;
    this.layer1 = this.layer2;
    this.layer2 = this.layer3;
    this.layer3 = tmp;

    this.t += this.dt;
  }

  getUAt(x) {
    const i = Math.round(x / this.dx);
    const idx = Math.max(0, Math.min(this.n - 1, i));
    return this.layer2[idx];
  }

  get u() {
    return [...this.layer2];
  }
}
