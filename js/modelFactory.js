import * as THREE from "three";
import { random } from "./utils.js";

export function createRabbitModel(color) {
  const rabbit = new THREE.Object3D();
  const bodyMat = new THREE.MeshStandardMaterial({ color });
  const bodyGeo = new THREE.BoxGeometry(4, 4, 6);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  rabbit.add(body);
  const headGeo = new THREE.BoxGeometry(3, 3, 3);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.set(0, 2.5, 4);
  rabbit.add(head);
  const earGeo = new THREE.BoxGeometry(1.5, 5, 1);
  const leftEar = new THREE.Mesh(earGeo, bodyMat);
  leftEar.position.set(-1.5, 3, 4.5);
  rabbit.add(leftEar);
  const rightEar = new THREE.Mesh(earGeo, bodyMat);
  rightEar.position.set(1.5, 3, 4.5);
  rabbit.add(rightEar);
  return rabbit;
}

export function createSheepModel() {
  const sheep = new THREE.Object3D();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }); // Wool
  const headMat = new THREE.MeshStandardMaterial({ color: 0x444444 }); // Face/Legs

  const bodyGeo = new THREE.IcosahedronGeometry(5, 0);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 3;
  sheep.add(body);

  const headGeo = new THREE.BoxGeometry(3, 3, 4);
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 3, 5);
  sheep.add(head);

  const legGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 6);
  const leg1 = new THREE.Mesh(legGeo, headMat);
  leg1.position.set(2, -1, 2.5);
  sheep.add(leg1);
  const leg2 = new THREE.Mesh(legGeo, headMat);
  leg2.position.set(-2, -1, 2.5);
  sheep.add(leg2);
  const leg3 = new THREE.Mesh(legGeo, headMat);
  leg3.position.set(2, -1, -2.5);
  sheep.add(leg3);
  const leg4 = new THREE.Mesh(legGeo, headMat);
  leg4.position.set(-2, -1, -2.5);
  sheep.add(leg4);

  return sheep;
}

export function createFoxModel(color) {
  const fox = new THREE.Object3D();
  const bodyMat = new THREE.MeshStandardMaterial({ color });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const bodyGeo = new THREE.BoxGeometry(5, 4, 8);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  fox.add(body);
  const headGeo = new THREE.ConeGeometry(2.5, 4, 4);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.rotation.z = Math.PI / 2;
  head.position.set(0, 1, 5);
  fox.add(head);
  const tailGeo = new THREE.ConeGeometry(1.5, 6, 8);
  const tail = new THREE.Mesh(tailGeo, bodyMat);
  tail.rotation.x = -Math.PI / 4;
  tail.position.set(0, 0, -6);
  const tailTip = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 8), tailMat);
  tailTip.position.y = -2.5;
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
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });

  if (Math.random() > 0.4) {
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
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = trunkHeight + 3;
    vegetation.add(leaves);
  } else {
    const bushRadius = random(6, 9);
    const leavesGeo = new THREE.IcosahedronGeometry(bushRadius, 0);
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = bushRadius / 2;
    vegetation.add(leaves);
  }
  return vegetation;
}
