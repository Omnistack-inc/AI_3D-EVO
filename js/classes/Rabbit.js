import { Creature } from "./Creature.js";
import { config } from "../config.js";
import { createRabbitModel } from "../modelFactory.js";
import { distance2D, random } from "../utils.js";

export class Rabbit extends Creature {
  constructor(x, y, z, energy, visionConesVisible) {
    super(
      x,
      y,
      z,
      energy,
      config.rabbit,
      createRabbitModel(config.rabbit.color),
      visionConesVisible
    );
    this.type = "rabbit";
  }
  update(foodItems, allCreatures, visionConesVisible) {
    // Added visionConesVisible for reproduce call
    let closestFood = null,
      minDistance = Infinity;
    for (const f of foodItems) {
      if (this.isTargetInSight(f)) {
        const d = distance2D(this, f);
        if (d < minDistance) {
          minDistance = d;
          closestFood = f;
        }
      }
    }
    if (closestFood) {
      this.vx = closestFood.x - this.x;
      this.vz = closestFood.z - this.z;
    } else {
      this.vx += random(-0.2, 0.2);
      this.vz += random(-0.2, 0.2);
    }
    this.move();

    let consumedFoodId = null;
    if (closestFood && distance2D(this, closestFood) < this.size * 2) {
      this.energy += config.food.energy;
      consumedFoodId = closestFood.id; // Store ID of consumed food
      // closestFood.dispose(); // Disposal will be handled in main.js
    }

    const offspring = this.reproduce(visionConesVisible); // Pass visionConesVisible
    return { consumedFoodId, newOffspring: offspring }; // Return outcomes
  }
}
