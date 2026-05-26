export class UserFormulaSolver {
  constructor(userFormula, dt, dx, l, n) {
    this.userFormula = math.compile(userFormula);
    this.dt = dt;
    this.dx = dx;
    this.l = l;
    this.n = n;

    this.xGrid = new Array(this.n);
    for (let i = 0; i < this.n; i++) {
      let nextX = i * this.dx;
      if (nextX > this.l) nextX = this.l;
      this.xGrid[i] = nextX;
    }

    this.t = this.dt;

    this.values = new Array(this.n);
    this.recalculateValues();
  }

  recalculateValues() {
    for (let i = 0; i < this.n; i++) {
      this.values[i] = this.userFormula.evaluate({
        x: this.xGrid[i],
        t: this.t,
      });
    }
  }

  makeTimeStep() {
    this.t += this.dt;
    this.recalculateValues();
  }

  uAtX(x) {
    return this.userFormula.evaluate({ x: x, t: this.t });
  }

  get u() {
    return this.values;
  }
}
