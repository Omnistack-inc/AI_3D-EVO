export const config = {
  simulation: { tickDuration: 75 }, // Target time in ms for each simulation tick.
  world: { width: 800, depth: 800 }, // Size of the simulation area.
  water: {
    enabled: true,
    numberOfBodies: 5, // Default number of water bodies set to 5
    shapeTypes: ["rectangle", "circle"], // Available shapes for water bodies
    // x, z, width, depth will be randomized for each body.
    // These are now general properties for water bodies, not for a single one.
    minWidth: 50, // Minimum width for any randomized rectangular water body
    maxWidth: 250, // Maximum width for any randomized rectangular water body
    minDepth: 50, // Minimum depth for any randomized rectangular water body
    maxDepth: 250, // Maximum depth for any randomized rectangular water body
    minCircleRadius: 30, // Minimum radius for circular water bodies
    maxCircleRadius: 120, // Maximum radius for circular water bodies
    color: 0x4682b4, // SteelBlue color for water
  },
  food: { initialCount: 150, energy: 25, regenRate: 20 },
  rabbit: {
    initialCount: 25,
    color: 0xa0a0a0,
    initialEnergy: 100,
    reproduceEnergy: 200,
    energyDecay: 0.15,
    size: 2.5,
    initialSpeed: 1.5,
    initialSense: 70,
    fieldOfView: Math.PI / 2,
  },
  sheep: {
    initialCount: 15,
    color: 0xe0e0e0,
    initialEnergy: 120,
    reproduceEnergy: 250,
    energyDecay: 0.2,
    size: 3.5,
    initialSpeed: 1.2,
    initialSense: 60,
    fieldOfView: Math.PI / 2,
    // Boids-specific parameters
    flockRadius: 50, // How far a sheep can see its flockmates.
    separationWeight: 0.05, // How strongly a sheep avoids its neighbors.
    alignmentWeight: 0.03, // How strongly a sheep tries to match its neighbors' direction.
    cohesionWeight: 0.01, // How strongly a sheep is drawn to the center of its flock.
  },
  fox: {
    initialCount: 4,
    color: 0xd46a34,
    initialEnergy: 120,
    reproduceEnergy: 250,
    energyDecay: 0.25,
    preyEnergyBonus: 80,
    size: 4,
    initialSpeed: 1.8,
    initialSense: 100,
    fieldOfView: Math.PI / 1.5,
  },
  bird: {
    initialCount: 6,
    color: 0x57c4e5,
    initialEnergy: 100,
    reproduceEnergy: 180,
    energyDecay: 0.2,
    size: 3,
    initialSpeed: 2.0,
    initialSense: 120,
    fieldOfView: Math.PI,
    preyEnergyBonus: 60,
    cruiseAltitude: 50,
  },
  mutation: { rate: 0.1, maxFactor: 0.2 }, // Chance and magnitude of genetic mutation upon reproduction.
};
