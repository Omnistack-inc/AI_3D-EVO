export const config = {
  simulation: { tickDuration: 33 }, // Target time in ms for each simulation tick.
  world: { width: 800, depth: 800 }, // Size of the simulation area.
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
