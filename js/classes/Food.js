import { scene } from "../sceneSetup.js";
import { createVegetationModel } from "../modelFactory.js";

export class Food {
  constructor(x, z) {
    this.x = x;
    this.y = 0;
    this.z = z;
    this.id = Math.random();
    this.mesh = createVegetationModel();
    this.mesh.position.set(this.x, 0, this.z);
    scene.add(this.mesh);
  }
  dispose() {
    scene.remove(this.mesh);
    while (this.mesh.children.length > 0) {
      const child = this.mesh.children[0];
      this.mesh.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
  }
}
