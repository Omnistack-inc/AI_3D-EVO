export const random = (min, max) => Math.random() * (max - min) + min;
export const distance2D = (a, b) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2);
export function isPositionInWater(x, z, waterBodies) {
  if (!waterBodies || waterBodies.length === 0) {
    return false;
  }

  for (const waterBody of waterBodies) {
    const waterHalfWidth = waterBody.width / 2;
    const waterHalfDepth = waterBody.depth / 2;
    const waterMinX = waterBody.x - waterHalfWidth;
    const waterMaxX = waterBody.x + waterHalfWidth;
    const waterMinZ = waterBody.z - waterHalfDepth;
    const waterMaxZ = waterBody.z + waterHalfDepth;

    if (x > waterMinX && x < waterMaxX && z > waterMinZ && z < waterMaxZ) {
      return true; // Position is in this water body
    }
  }
  return false; // Position is not in any water body
}
