export const random = (min, max) => Math.random() * (max - min) + min;
export const distance2D = (a, b) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2);

// Check if two water bodies are overlapping
export function areWaterBodiesOverlapping(body1, body2) {
  const body1HalfWidth = body1.width / 2;
  const body1HalfDepth = body1.depth / 2;
  const body2HalfWidth = body2.width / 2;
  const body2HalfDepth = body2.depth / 2;

  // Calculate bounds for body1
  const body1MinX = body1.x - body1HalfWidth;
  const body1MaxX = body1.x + body1HalfWidth;
  const body1MinZ = body1.z - body1HalfDepth;
  const body1MaxZ = body1.z + body1HalfDepth;

  // Calculate bounds for body2
  const body2MinX = body2.x - body2HalfWidth;
  const body2MaxX = body2.x + body2HalfWidth;
  const body2MinZ = body2.z - body2HalfDepth;
  const body2MaxZ = body2.z + body2HalfDepth;

  // Check for overlap in x and z dimensions
  return (
    body1MinX < body2MaxX &&
    body1MaxX > body2MinX &&
    body1MinZ < body2MaxZ &&
    body1MaxZ > body2MinZ
  );
}

// Merge two overlapping water bodies into one
export function mergeWaterBodies(body1, body2) {
  // Calculate bounds for both bodies
  const body1MinX = body1.x - body1.width / 2;
  const body1MaxX = body1.x + body1.width / 2;
  const body1MinZ = body1.z - body1.depth / 2;
  const body1MaxZ = body1.z + body1.depth / 2;

  const body2MinX = body2.x - body2.width / 2;
  const body2MaxX = body2.x + body2.width / 2;
  const body2MinZ = body2.z - body2.depth / 2;
  const body2MaxZ = body2.z + body2.depth / 2;

  // Calculate the bounds of the merged body
  const mergedMinX = Math.min(body1MinX, body2MinX);
  const mergedMaxX = Math.max(body1MaxX, body2MaxX);
  const mergedMinZ = Math.min(body1MinZ, body2MinZ);
  const mergedMaxZ = Math.max(body1MaxZ, body2MaxZ);

  // Calculate dimensions of the merged water body
  const mergedWidth = mergedMaxX - mergedMinX;
  const mergedDepth = mergedMaxZ - mergedMinZ;
  const mergedX = mergedMinX + mergedWidth / 2;
  const mergedZ = mergedMinZ + mergedDepth / 2;

  // Return the new merged water body data
  return {
    x: mergedX,
    z: mergedZ,
    width: mergedWidth,
    depth: mergedDepth,
  };
}

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
