export const random = (min, max) => Math.random() * (max - min) + min;
export const distance2D = (a, b) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2);
