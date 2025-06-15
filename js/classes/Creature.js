import * as THREE from "three";
import { scene } from "../sceneSetup.js";
import { random } from "../utils.js";
import { config } from "../config.js";

export class Creature {
  constructor(x, y, z, energy, speciesConfig, model, visionConesVisible) {
    // Added visionConesVisible
    this.id = Math.random();
    this.x = x;
    this.y = y;
    this.z = z;
    this.energy = energy;
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
    this.x += this.vx * this.speed;
    this.z += this.vz * this.speed;
    const halfWidth = config.world.width / 2;
    const halfDepth = config.world.depth / 2;
    if (this.x < -halfWidth || this.x > halfWidth) {
      this.vx *= -1;
      this.x = Math.max(-halfWidth, Math.min(this.x, halfWidth));
    }
    if (this.z < -halfDepth || this.z > halfDepth) {
      this.vz *= -1;
      this.z = Math.max(-halfDepth, Math.min(this.z, halfDepth));
    }
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
      // Pass visionConesVisible to the offspring's constructor
      const offspring = new this.constructor(
        this.x,
        this.y,
        this.z,
        this.energy,
        this.config,
        this.bodyModel.clone(),
        visionConesVisible
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
