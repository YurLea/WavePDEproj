export class AnalyticalSolver {
  constructor(phiFunction, psiFunction, a, l) {
    this.a = a;
    this.l = l;
    this.t = 0;
    this.dx = 0.01;
    this.dt = 0.9 * this.dx / this.a;
    this.n = Math.floor(this.l / this.dx) + 1;
    this.phiExpr = math.compile(phiFunction);
    this.psiExpr = math.compile(psiFunction);
  }

  phiPeriodic(x) {
    const l = this.l;
    const period = 4 * l;
    const r = ((x % period) + period) % period;

    let arg;
    let sign;

    if (r >= 0 && r <= l) {
      arg = r;
      sign = 1;
    } else if (r <= 2 * l) {
      arg = 2 * l - r;
      sign = 1;
    } else if (r <= 3 * l) {
      arg = r - 2 * l;
      sign = -1;
    } else {
      arg = 4 * l - r;
      sign = -1;
    }

    return sign * this.phiExpr.evaluate({x: arg})
  }

  psiTilde(x) {
    const l = this.l;
    const period = 4 * l;
    const r = ((x % period) + period) % period;

    let arg;
    let sign;

    if (r >= 0 && r <= l) {
      arg = r;
      sign = 1;
    } else if (r <= 2 * l) {
      arg = 2 * l - r;
      sign = 1;
    } else if (r <= 3 * l) {
      arg = r - 2 * l;
      sign = -1;
    } else {
      arg = 4 * l - r;
      sign = -1;
    }

    return sign * this.psiExpr.evaluate({x: arg})
  }

  integratePsi(left, right) {
    if (right === left) return 0;

    if (right < left) {
      [left, right] = [right, left];
    }

    const m = Math.max(10, Math.ceil((right - left) / this.dx));
    const h = (right - left) / m;

    let integral = 0;
    for (let k = 0; k <= m; k++) {
      const s = left + k * h;
      const value = this.psiTilde(s);

      if (k === 0 || k === m) {
        integral += value / 2;
      } else {
        integral += value;
      }
    }

    return integral * h;
  }

  getUAt(x) {
    const spatialPeriod = 4 * this.l;
    const at = (this.a * this.t) % spatialPeriod;

    return (
      0.5 * (this.phiPeriodic(x - at) + this.phiPeriodic(x + at)) +
      this.integratePsi(x - at, x + at) / (2 * this.a)
    );
  }

  get u() {
    const values = [];

    for (let i = 0; i < this.n; i++) {
      let x = i * this.dx;
      if (x > this.l) x = this.l;
      values.push(this.getUAt(x));
    }

    return values;
  }

  makeTimeStep() {
    this.t += this.dt;

    const timePeriod = (4 * this.l) / this.a;
    if (this.t >= timePeriod) {
      this.t -= timePeriod;
    }
  }
}