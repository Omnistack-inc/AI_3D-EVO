import { Creature } from "./Creature.js";
import { config } from "../config.js";
import { createFoxModel } from "../modelFactory.js";
import { distance2D, random } from "../utils.js";

export class Fox extends Creature {
  constructor(x, y, z, energy, visionConesVisible) {
    super(
      x,
      y,
      z,
      energy,
      config.fox,
      createFoxModel(config.fox.color),
      visionConesVisible
    );
    this.type = "fox";
  }
  update(foodItems, allCreatures, visionConesVisible) {
    // Added visionConesVisible for reproduce call. foodItems not used by Fox but kept for consistency.
    let closestPrey = null,
      minDistance = Infinity;
    for (const c of allCreatures) {
      if (
        (c.type === "rabbit" ||
          c.type === "sheep" ||
          (c.type === "bird" && c.y < 5)) &&
        c.id !== this.id &&
        this.isTargetInSight(c)
      ) {
        const d = distance2D(this, c);
        if (d < minDistance) {
          minDistance = d;
          closestPrey = c;
        }
      }
    }

    if (closestPrey) {
      this.vx = closestPrey.x - this.x;
      this.vz = closestPrey.z - this.z;
    } else {
      this.vx += random(-0.2, 0.2);
      this.vz += random(-0.2, 0.2);
    }

    this.move();
    let huntedCreatureId = null;
    if (closestPrey && distance2D(this, closestPrey) < this.size * 2) {
      this.energy += this.config.preyEnergyBonus + closestPrey.energy * 0.5;
      huntedCreatureId = closestPrey.id; // Store ID of hunted creature
      // closestPrey.dispose(); // Disposal will be handled in main.js
    }

    const offspring = this.reproduce(visionConesVisible); // Pass visionConesVisible
    return { huntedCreatureId, newOffspring: offspring }; // Return outcomes
  }
}
