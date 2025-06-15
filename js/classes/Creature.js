import * as THREE from "three";
import { scene } from "../sceneSetup.js";
import { random, isPositionInWater } from "../utils.js";
import { config } from "../config.js";
import { waterBodiesData } from "../main.js"; // Import waterBodiesData

export class Creature {
  constructor(x, y, z, energy, speciesConfig, model, visionConesVisible) {
    // Added visionConesVisible
    this.id = Math.random();
    this.x = x;
    this.y = y;
    this.z = z;
    this.energy = energy;
    this.isHunted = false; // Flag to indicate if the creature has been hunted in the current tick
    this.vx = random(-1, 1);
    this.vy = 0;
    this.vz = random(-1, 1);
    this.config = speciesConfig;
    this.size = this.config.size;
    this.speed = this.config.initialSpeed;
    this.sense = this.config.initialSense;

    this.mesh = new THREE.Object3D();
    this.mesh.position.set(this.x, this.y, this.z);
    scene.add(this.mesh);

    this.bodyModel = model;
    this.bodyModel.scale.set(this.size * 0.5, this.size * 0.5, this.size * 0.5);
    this.mesh.add(this.bodyModel);

    const coneGeo = new THREE.ConeGeometry(
      this.sense * 0.4,
      this.sense,
      16,
      1,
      true
    );
    coneGeo.translate(0, -this.sense / 2, 0);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
    });
    this.visionCone = new THREE.Mesh(coneGeo, coneMat);
    this.visionCone.rotation.x = -Math.PI / 2;
    this.visionCone.visible = visionConesVisible; // Use passed parameter
    this.mesh.add(this.visionCone);
  }

  move() {
    this.energy -= this.config.energyDecay;
    const mag = Math.sqrt(this.vx ** 2 + this.vz ** 2);
    if (mag > 0) {
      this.vx /= mag;
      this.vz /= mag;
    }

    let nextX = this.x + this.vx * this.speed;
    let nextZ = this.z + this.vz * this.speed;

    const halfWidth = config.world.width / 2;
    const halfDepth = config.world.depth / 2;

    // Boundary collision (existing logic)
    if (nextX < -halfWidth || nextX > halfWidth) {
      this.vx *= -1;
      nextX = Math.max(-halfWidth, Math.min(nextX, halfWidth));
    }
    if (nextZ < -halfDepth || nextZ > halfDepth) {
      this.vz *= -1;
      nextZ = Math.max(-halfDepth, Math.min(nextZ, halfDepth));
    }

    // Water collision detection - updated to use waterBodiesData array
    if (config.water && config.water.enabled && waterBodiesData.length > 0) {
      for (const waterBody of waterBodiesData) {
        const waterHalfWidth = waterBody.width / 2;
        const waterHalfDepth = waterBody.depth / 2;
        const waterMinX = waterBody.x - waterHalfWidth;
        const waterMaxX = waterBody.x + waterHalfWidth;
        const waterMinZ = waterBody.z - waterHalfDepth;
        const waterMaxZ = waterBody.z + waterHalfDepth;

        if (
          nextX > waterMinX &&
          nextX < waterMaxX &&
          nextZ > waterMinZ &&
          nextZ < waterMaxZ
        ) {
          // Creature is trying to move into this water body.
          this.vx *= -1;
          this.vz *= -1;
          // Attempt to place the creature just outside the water boundary it was about to enter
          if (this.x <= waterMinX && nextX > waterMinX)
            nextX = waterMinX - this.size / 2;
          else if (this.x >= waterMaxX && nextX < waterMaxX)
            nextX = waterMaxX + this.size / 2;
          if (this.z <= waterMinZ && nextZ > waterMinZ)
            nextZ = waterMinZ - this.size / 2;
          else if (this.z >= waterMaxZ && nextZ < waterMaxZ)
            nextZ = waterMaxZ + this.size / 2;
          break; // Collision detected with one water body, no need to check others
        }
      }
    }

    this.x = nextX;
    this.z = nextZ;

    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.lookAt(
      new THREE.Vector3(this.x + this.vx, this.y + this.vy, this.z + this.vz)
    );
  }

  isTargetInSight(target) {
    const creatureDirection = new THREE.Vector3();
    this.mesh.getWorldDirection(creatureDirection);
    const toTarget = new THREE.Vector3(
      target.x - this.x,
      target.y - this.y,
      target.z - this.z
    );
    const d = toTarget.length();
    if (d > this.sense || d === 0) return false;
    toTarget.normalize();
    const angle = creatureDirection.angleTo(toTarget);
    return angle < this.config.fieldOfView / 2;
  }

  reproduce(visionConesVisible) {
    // Added visionConesVisible parameter
    if (this.energy >= this.config.reproduceEnergy) {
      this.energy /= 2;

      let offspringX = this.x;
      let offspringZ = this.z;
      let offspringY = this.y; // Usually 0 for ground creatures, altitude for birds

      // For ground creatures, ensure offspring doesn't spawn in water.
      // Check against all water bodies.
      if (
        this.type !== "bird" &&
        isPositionInWater(offspringX, offspringZ, waterBodiesData)
      ) {
        // If parent is at the edge and offspring would be in water, try to find a nearby valid spot.
        // This is a simplified approach. A more robust solution might involve several attempts or a different strategy.
        // For now, we'll try to nudge the offspring slightly.
        // This logic might need refinement if parents can get extremely close to water edges
        // or if multiple water bodies are very close to each other.

        // Attempt to move offspring away from the water body it's in.
        // This is a placeholder for more sophisticated logic.
        // A simple strategy: try small offsets in 8 directions.
        const offsets = [
          { dx: 0, dz: this.size },
          { dx: 0, dz: -this.size },
          { dx: this.size, dz: 0 },
          { dx: -this.size, dz: 0 },
          { dx: this.size, dz: this.size },
          { dx: this.size, dz: -this.size },
          { dx: -this.size, dz: this.size },
          { dx: -this.size, dz: -this.size },
        ];

        let foundValidSpawn = false;
        for (const offset of offsets) {
          const newX = offspringX + offset.dx;
          const newZ = offspringZ + offset.dz;
          if (!isPositionInWater(newX, newZ, waterBodiesData)) {
            offspringX = newX;
            offspringZ = newZ;
            foundValidSpawn = true;
            break;
          }
        }

        if (!foundValidSpawn) {
          // Fallback: if no simple nudge works, don't reproduce this tick to avoid invalid spawn.
          // Or, could place randomly, but that might be too far from parent.
          // console.warn(`Could not find valid spawn for offspring of ${this.type} near water. Reproduction skipped.`);
          this.energy *= 2; // Refund energy
          return null;
        }
      }

      const offspring = new this.constructor(
        offspringX,
        offspringY, // Use parent's y for birds, 0 for others typically
        offspringZ,
        this.energy,
        // this.config, // This was incorrect, should use the global species config
        visionConesVisible // Pass visionConesVisible
      );
      if (Math.random() < config.mutation.rate) {
        offspring.speed *=
          1 + random(-config.mutation.maxFactor, config.mutation.maxFactor);
        offspring.speed = Math.max(0.5, offspring.speed);
      }
      if (Math.random() < config.mutation.rate) {
        offspring.sense *=
          1 + random(-config.mutation.maxFactor, config.mutation.maxFactor);
        offspring.sense = Math.max(10, offspring.sense);
        // Ensure visionCone and its geometry exist before trying to dispose and replace
        if (offspring.visionCone && offspring.visionCone.geometry) {
          offspring.visionCone.geometry.dispose();
        }
        const newConeGeo = new THREE.ConeGeometry(
          offspring.sense * 0.4,
          offspring.sense,
          16,
          1,
          true
        );
        newConeGeo.translate(0, -offspring.sense / 2, 0);
        if (offspring.visionCone) {
          offspring.visionCone.geometry = newConeGeo;
        } else {
          // Fallback if visionCone wasn't created, though it should be by constructor
          const coneMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.05,
            side: THREE.DoubleSide,
          });
          offspring.visionCone = new THREE.Mesh(newConeGeo, coneMat);
          offspring.visionCone.rotation.x = -Math.PI / 2;
          offspring.visionCone.visible = visionConesVisible;
          offspring.mesh.add(offspring.visionCone);
        }
      }
      return offspring; // Return the offspring instead of pushing to a global array
    }
    return null; // Return null if reproduction conditions are not met
  }

  dispose() {
    scene.remove(this.mesh);
    while (this.mesh.children.length > 0) {
      const child = this.mesh.children[0];
      this.mesh.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      while (child.children.length > 0) {
        const subChild = child.children[0];
        child.remove(subChild);
        if (subChild.geometry) subChild.geometry.dispose();
        if (subChild.material) subChild.material.dispose();
      }
    }
  }
}
