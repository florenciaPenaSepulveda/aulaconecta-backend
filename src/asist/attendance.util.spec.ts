import { toPercentage } from './attendance.util';

describe('toPercentage', () => {
  it('calcula el porcentaje con un decimal', () => {
    expect(toPercentage(2, 1)).toBe(66.7);
    expect(toPercentage(10, 0)).toBe(100);
    expect(toPercentage(0, 5)).toBe(0);
  });

  it('devuelve cero cuando no hay registros', () => {
    expect(toPercentage(0, 0)).toBe(0);
  });
});
