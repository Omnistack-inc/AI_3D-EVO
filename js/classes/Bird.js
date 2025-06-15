import { Creature } from "./Creature.js";
import { config } from "../config.js";
import { createBirdModel } from "../modelFactory.js";
import { distance2D, random } from "../utils.js";

export class Bird extends Creature {
  constructor(x, y, z, energy, visionConesVisible) {
    super(
      x,
      y,
      z,
      energy,
      config.bird,
      createBirdModel(config.bird.color),
      visionConesVisible
    );
    this.type = "bird";
    this.state = "cruising"; // cruising, diving, eating
    this.target = null; // Can be food or creature
    this.targetType = null; // 'food' or 'creature'
  }

  update(foodItems, allCreatures, visionConesVisible) {
    // Added visionConesVisible for reproduce call
    let closestTarget = null;
    let minDistance = Infinity;
    let potentialTargetType = null;

    // Check for prey first (creatures)
    for (const c of allCreatures) {
      if (
        (c.type === "rabbit" || c.type === "sheep") &&
        c.id !== this.id &&
        this.isTargetInSight(c)
      ) {
        const d = distance2D(this, c);
        if (d < minDistance) {
          minDistance = d;
          closestTarget = c;
          potentialTargetType = "creature";
        }
      }
    }
    // Then check for food, only if no closer creature prey is found or if food is closer
    for (const f of foodItems) {
      if (this.isTargetInSight(f)) {
        const d = distance2D(this, f);
        if (d < minDistance) {
          minDistance = d;
          closestTarget = f;
          potentialTargetType = "food";
        }
      }
    }

    let consumedFoodId = null;
    let huntedCreatureId = null;

    if (this.state === "cruising") {
      if (closestTarget) {
        this.state = "diving";
        this.target = closestTarget;
        this.targetType = potentialTargetType;
      }
      this.vy = (config.bird.cruiseAltitude - this.y) * 0.05;
    } else if (this.state === "diving") {
      if (
        !this.target ||
        this.target.energy <= 0 ||
        (this.targetType === "creature" &&
          !allCreatures.find((c) => c.id === this.target.id)) ||
        (this.targetType === "food" &&
          !foodItems.find((f) => f.id === this.target.id))
      ) {
        this.state = "cruising";
        this.target = null;
        this.targetType = null;
      } else {
        this.vy = (0 - this.y) * 0.1; // Dive towards ground
        if (this.y < 1) {
          // Adjusted dive height check for eating
          this.y = 0; // Land
          this.state = "eating";
        }
      }
    } else if (this.state === "eating") {
      if (
        !this.target ||
        distance2D(this, this.target) > this.size * 2 ||
        (this.targetType === "creature" &&
          !allCreatures.find((c) => c.id === this.target.id)) ||
        (this.targetType === "food" &&
          !foodItems.find((f) => f.id === this.target.id))
      ) {
        this.state = "cruising";
        this.target = null;
        this.targetType = null;
      } else {
        if (this.targetType === "creature") {
          this.energy += this.config.preyEnergyBonus + this.target.energy * 0.5;
          huntedCreatureId = this.target.id;
        } else if (this.targetType === "food") {
          this.energy += config.food.energy;
          consumedFoodId = this.target.id;
        }
        // Disposal will be handled in main.js
        this.state = "cruising";
        this.target = null;
        this.targetType = null;
      }
    }

    this.y += this.vy;
    this.y = Math.max(0, this.y); // Birds don't go underground

    if (this.target && this.state === "diving") {
      // Only steer towards target if diving
      this.vx = this.target.x - this.x;
      this.vz = this.target.z - this.z;
    } else {
      this.vx += random(-0.2, 0.2);
      this.vz += random(-0.2, 0.2);
    }

    this.move(); // move() handles x, z updates and mesh position/rotation
    const offspring = this.reproduce(visionConesVisible); // Pass visionConesVisible
    return { consumedFoodId, huntedCreatureId, newOffspring: offspring }; // Return outcomes
  }
}
