export class UserFormulaSolver {
  constructor(userFormula, dt, dx, l, n) {
    this.userFormula = math.compile(userFormula);
    this.dt = dt;
    this.t = 0;
    this.dx = dx;
    this.l = l;
    this.n = n;
  }

  makeTimeStep(){
    this.t += this.dt;
  }

  uAtX(x){
    return this.userFormula.evaluate({x: x, t: this.t});
  }

  get u(){
    const values = [];

    for (let i = 0; i < this.n; i++) {
      let nextX = i * this.dx;
      if (nextX > this.l) nextX = this.l;
      values.push(this.uAtX(nextX));
    }

    return values;
  }
}