import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { config } from "./config.js";

export let scene, camera, renderer, controls;
export const clock = new THREE.Clock();
export const container = document.getElementById("simulation-container");

export function init3D() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a202c);

  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 150, 200);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const ambientLight = new THREE.AmbientLight(0xcccccc, 1.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 100, 75);
  scene.add(directionalLight);

  const planeGeometry = new THREE.PlaneGeometry(
    config.world.width,
    config.world.depth
  );
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d3748,
    side: THREE.DoubleSide,
  });
  const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  groundPlane.rotation.x = -Math.PI / 2;
  scene.add(groundPlane);

  const grid = new THREE.GridHelper(config.world.width, 20, 0x4a5568, 0x4a5568);
  scene.add(grid);
}
