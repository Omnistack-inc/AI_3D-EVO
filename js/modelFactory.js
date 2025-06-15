import * as THREE from "three";
import { random } from "./utils.js";

export function createRabbitModel(color) {
  const rabbit = new THREE.Object3D();
  const bodyMat = new THREE.MeshStandardMaterial({ color });
  const bodyGeo = new THREE.BoxGeometry(4, 4, 6); // height = 4
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 2; // Shift up by half height to make base at y=0
  rabbit.add(body);

  const headGeo = new THREE.BoxGeometry(3, 3, 3);
  const head = new THREE.Mesh(headGeo, bodyMat);
  // Position relative to new body center (y=2)
  head.position.set(0, 2 + 1.5, 4); // body_y + head_half_height_offset + forward
  rabbit.add(head);

  const earGeo = new THREE.BoxGeometry(1.5, 5, 1);
  const leftEar = new THREE.Mesh(earGeo, bodyMat);
  // Position relative to new body center (y=2)
  leftEar.position.set(-1.5, 2 + 2.5, 4.5); // body_y + ear_half_height_offset + forward
  rabbit.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, bodyMat);
  // Position relative to new body center (y=2)
  rightEar.position.set(1.5, 2 + 2.5, 4.5); // body_y + ear_half_height_offset + forward
  rabbit.add(rightEar);
  return rabbit;
}

export function createSheepModel() {
  const sheep = new THREE.Object3D();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }); // Wool
  const headMat = new THREE.MeshStandardMaterial({ color: 0x444444 }); // Face/Legs

  // Original lowest point of legs was y=-3. Shift entire model up by 3.
  const yOffset = 3;

  const bodyGeo = new THREE.IcosahedronGeometry(5, 0); // radius 5
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 3 + yOffset; // Original y=3
  sheep.add(body);

  const headGeo = new THREE.BoxGeometry(3, 3, 4);
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 3 + yOffset, 5); // Original y=3
  sheep.add(head);

  const legGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 6); // height 4
  // Legs were centered at y=-1, extending from -3 to 1.
  // New center y = -1 + yOffset = 2. Legs extend from 0 to 4.
  const leg1 = new THREE.Mesh(legGeo, headMat);
  leg1.position.set(2, -1 + yOffset, 2.5);
  sheep.add(leg1);
  const leg2 = new THREE.Mesh(legGeo, headMat);
  leg2.position.set(-2, -1 + yOffset, 2.5);
  sheep.add(leg2);
  const leg3 = new THREE.Mesh(legGeo, headMat);
  leg3.position.set(2, -1 + yOffset, -2.5);
  sheep.add(leg3);
  const leg4 = new THREE.Mesh(legGeo, headMat);
  leg4.position.set(-2, -1 + yOffset, -2.5);
  sheep.add(leg4);

  return sheep;
}

export function createFoxModel(color) {
  const fox = new THREE.Object3D();
  const bodyMat = new THREE.MeshStandardMaterial({ color });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

  const bodyGeo = new THREE.BoxGeometry(5, 4, 8); // height = 4
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 2; // Shift up by half height to make base at y=0
  fox.add(body);

  const headGeo = new THREE.ConeGeometry(2.5, 4, 4);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.rotation.z = Math.PI / 2;
  // Position relative to new body center (y=2)
  head.position.set(0, 2 + 1, 5); // body_y + head_offset_y + forward
  fox.add(head);

  const tailGeo = new THREE.ConeGeometry(1.5, 6, 8);
  const tail = new THREE.Mesh(tailGeo, bodyMat);
  tail.rotation.x = -Math.PI / 4;
  // Position relative to new body center (y=2)
  tail.position.set(0, 2 + 0, -6); // body_y + tail_offset_y + backward
  const tailTip = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 8), tailMat);
  tailTip.position.y = -2.5; // Relative to tail's center
  tail.add(tailTip);
  fox.add(tail);
  return fox;
}

export function createBirdModel(color) {
  const bird = new THREE.Object3D();
  const bodyMat = new THREE.MeshStandardMaterial({ color });
  const bodyGeo = new THREE.BoxGeometry(2, 2, 5);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  bird.add(body);
  const wingGeo = new THREE.BoxGeometry(8, 0.5, 3);
  const leftWing = new THREE.Mesh(wingGeo, bodyMat);
  leftWing.position.set(-5, 0, 0);
  bird.add(leftWing);
  const rightWing = new THREE.Mesh(wingGeo, bodyMat);
  rightWing.position.set(5, 0, 0);
  bird.add(rightWing);
  return bird;
}

export function createVegetationModel() {
  const vegetation = new THREE.Object3D();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // SaddleBrown

  // Define a broader palette for leaves
  const leafColors = [
    0x228b22, // ForestGreen
    0x556b2f, // DarkOliveGreen
    0x6b8e23, // OliveDrab
    0x8fbc8f, // DarkSeaGreen
    0x2e8b57, // SeaGreen
  ];
  const pineLeafColors = [
    0x006400, // DarkGreen
    0x004d00, // Slightly darker green
    0x007a00, // A bit lighter dark green
  ];

  // Randomly select a leaf color
  const randomLeafColor =
    leafColors[Math.floor(Math.random() * leafColors.length)];
  const randomPineLeafColor =
    pineLeafColors[Math.floor(Math.random() * pineLeafColors.length)];

  const leavesMat = new THREE.MeshStandardMaterial({ color: randomLeafColor });
  const pineLeavesMat = new THREE.MeshStandardMaterial({
    color: randomPineLeafColor,
  });

  const type = Math.random();

  if (type > 0.6) {
    // Deciduous Tree (original)
    const trunkHeight = random(12, 18);
    const trunkGeo = new THREE.CylinderGeometry(
      random(1.5, 2),
      random(2, 2.5),
      trunkHeight,
      8
    );
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    vegetation.add(trunk);
    const leavesGeo = new THREE.IcosahedronGeometry(random(8, 12), 0);
    const leaves = new THREE.Mesh(leavesGeo, leavesMat); // Use randomized leavesMat
    leaves.position.y = trunkHeight + 3;
    vegetation.add(leaves);
  } else if (type > 0.2) {
    // Pine Tree (new variation)
    const trunkHeight = random(20, 30); // Taller
    const trunkRadius = random(1, 1.5); // Thinner
    const trunkGeo = new THREE.CylinderGeometry(
      trunkRadius,
      trunkRadius * 1.2, // Slightly wider at base
      trunkHeight,
      8
    );
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    vegetation.add(trunk);

    const canopyHeight = random(15, 20);
    const canopyRadius = random(5, 8);
    const leavesGeo = new THREE.ConeGeometry(canopyRadius, canopyHeight, 8);
    const leaves = new THREE.Mesh(leavesGeo, pineLeavesMat); // Use randomized pineLeavesMat
    leaves.position.y = trunkHeight + canopyHeight / 2 - 2; // Adjust position to sit on trunk
    vegetation.add(leaves);
  } else {
    // Bush (original)
    const bushRadius = random(6, 9);
    const leavesGeo = new THREE.IcosahedronGeometry(bushRadius, 0);
    const leaves = new THREE.Mesh(leavesGeo, leavesMat); // Use randomized leavesMat for bushes too
    leaves.position.y = bushRadius / 2;
    vegetation.add(leaves);
  }
  return vegetation;
}
