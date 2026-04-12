export function maxAbsDeviation(solver1, solver2) {
  const u1 = solver1.u;
  const u2 = solver2.u;
  const n = Math.min(u1.length, u2.length);

  let maxDev = 0;
  let maxCoord = 0;

  for (let i = 0; i < n; i++) {
    const dev = Math.abs(u1[i] - u2[i]);
    if (dev > maxDev) {
      maxDev = dev;
      maxCoord = i;
    }
  }

  return [maxDev, maxCoord];
}

export function meanAbsDeviation(solver1, solver2) {
  const u1 = solver1.u;
  const u2 = solver2.u;
  const n = Math.min(u1.length, u2.length);

  if (n === 0) return 0;

  let sum = 0;

  for (let i = 0; i < n; i++) {
    sum += Math.abs(u1[i] - u2[i]);
  }

  return sum / n;
}