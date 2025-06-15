import * as THREE from "three";
import { Creature } from "./Creature.js";
import { config } from "../config.js";
import { createSheepModel } from "../modelFactory.js";
import { distance2D, random } from "../utils.js";

export class Sheep extends Creature {
  constructor(x, y, z, energy, visionConesVisible) {
    super(
      x,
      y,
      z,
      energy,
      config.sheep,
      createSheepModel(),
      visionConesVisible
    );
    this.type = "sheep";
  }

  flock(allCreatures) {
    // Pass allCreatures for flocking behavior
    let separation = new THREE.Vector2();
    let alignment = new THREE.Vector2();
    let cohesion = new THREE.Vector2();
    let neighborCount = 0;

    for (const other of allCreatures) {
      if (other !== this && other.type === "sheep") {
        let d = distance2D(this, other);
        if (d > 0 && d < this.config.flockRadius) {
          let diff = new THREE.Vector2(this.x - other.x, this.z - other.z);
          diff.normalize();
          diff.divideScalar(d);
          separation.add(diff);
          alignment.add(new THREE.Vector2(other.vx, other.vz));
          cohesion.add(new THREE.Vector2(other.x, other.z));
          neighborCount++;
        }
      }
    }

    if (neighborCount > 0) {
      alignment.divideScalar(neighborCount);
      cohesion.divideScalar(neighborCount);
      cohesion.sub(new THREE.Vector2(this.x, this.z));
    }
    return { separation, alignment, cohesion };
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

    const { separation, alignment, cohesion } = this.flock(allCreatures);

    separation.multiplyScalar(this.config.separationWeight);
    alignment.multiplyScalar(this.config.alignmentWeight);
    cohesion.multiplyScalar(this.config.cohesionWeight);

    this.vx += separation.x + alignment.x + cohesion.x;
    this.vz += separation.y + alignment.y + cohesion.y;

    if (closestFood) {
      this.vx += (closestFood.x - this.x) * 0.05;
      this.vz += (closestFood.z - this.z) * 0.05;
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
