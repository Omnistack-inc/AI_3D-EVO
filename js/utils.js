export const random = (min, max) => Math.random() * (max - min) + min;
export const distance2D = (a, b) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2);

// Merge two overlapping water bodies into one
// IMPORTANT: Merged bodies will always be rectangular (AABB of the two)
export function mergeWaterBodies(body1, body2) {
  // Calculate bounds for both bodies
  // For circles, use their bounding box (x +/- radius, z +/- radius)
  const body1MinX =
    body1.shapeType === "circle"
      ? body1.x - body1.radius
      : body1.x - body1.width / 2;
  const body1MaxX =
    body1.shapeType === "circle"
      ? body1.x + body1.radius
      : body1.x + body1.width / 2;
  const body1MinZ =
    body1.shapeType === "circle"
      ? body1.z - body1.radius
      : body1.z - body1.depth / 2;
  const body1MaxZ =
    body1.shapeType === "circle"
      ? body1.z + body1.radius
      : body1.z + body1.depth / 2;

  const body2MinX =
    body2.shapeType === "circle"
      ? body2.x - body2.radius
      : body2.x - body2.width / 2;
  const body2MaxX =
    body2.shapeType === "circle"
      ? body2.x + body2.radius
      : body2.x + body2.width / 2;
  const body2MinZ =
    body2.shapeType === "circle"
      ? body2.z - body2.radius
      : body2.z - body2.depth / 2;
  const body2MaxZ =
    body2.shapeType === "circle"
      ? body2.z + body2.radius
      : body2.z + body2.depth / 2;

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
    shapeType: "rectangle", // Merged bodies are always rectangular
    x: mergedX,
    z: mergedZ,
    width: mergedWidth,
    depth: mergedDepth,
    // No radius for merged bodies
  };
}

export function isPositionInWater(x, z, waterBodies) {
  if (!waterBodies || waterBodies.length === 0) {
    return false;
  }

  for (const waterBody of waterBodies) {
    if (waterBody.shapeType === "rectangle") {
      const waterHalfWidth = waterBody.width / 2;
      const waterHalfDepth = waterBody.depth / 2;
      const waterMinX = waterBody.x - waterHalfWidth;
      const waterMaxX = waterBody.x + waterHalfWidth;
      const waterMinZ = waterBody.z - waterHalfDepth;
      const waterMaxZ = waterBody.z + waterHalfDepth;

      if (x > waterMinX && x < waterMaxX && z > waterMinZ && z < waterMaxZ) {
        return true; // Position is in this rectangular water body
      }
    } else if (waterBody.shapeType === "circle") {
      const distance = Math.sqrt(
        (x - waterBody.x) ** 2 + (z - waterBody.z) ** 2
      );
      if (distance < waterBody.radius) {
        return true; // Position is in this circular water body
      }
    }
  }
  return false; // Position is not in any water body
}

// Check if two water bodies are overlapping (AABB check for simplicity, even for circles)
// More precise circle-to-circle or circle-to-rectangle collision is complex for merging logic here.
// Using AABB for overlap detection simplifies merging into a new AABB.
export function areWaterBodiesOverlapping(body1, body2) {
  const body1MinX =
    body1.shapeType === "circle"
      ? body1.x - body1.radius
      : body1.x - body1.width / 2;
  const body1MaxX =
    body1.shapeType === "circle"
      ? body1.x + body1.radius
      : body1.x + body1.width / 2;
  const body1MinZ =
    body1.shapeType === "circle"
      ? body1.z - body1.radius
      : body1.z - body1.depth / 2;
  const body1MaxZ =
    body1.shapeType === "circle"
      ? body1.z + body1.radius
      : body1.z + body1.depth / 2;

  const body2MinX =
    body2.shapeType === "circle"
      ? body2.x - body2.radius
      : body2.x - body2.width / 2;
  const body2MaxX =
    body2.shapeType === "circle"
      ? body2.x + body2.radius
      : body2.x + body2.width / 2;
  const body2MinZ =
    body2.shapeType === "circle"
      ? body2.z - body2.radius
      : body2.z - body2.depth / 2;
  const body2MaxZ =
    body2.shapeType === "circle"
      ? body2.z + body2.radius
      : body2.z + body2.depth / 2;

  // Check for overlap in x and z dimensions
  return (
    body1MinX < body2MaxX &&
    body1MaxX > body2MinX &&
    body1MinZ < body2MaxZ &&
    body1MaxZ > body2MinZ
  );
}
