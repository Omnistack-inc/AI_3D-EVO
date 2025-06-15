import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { config } from "./config.js";

export let scene, camera, renderer, controls;
export const clock = new THREE.Clock();
export const container = document.getElementById("simulation-container");

export function init3D() {
  scene = new THREE.Scene();
  // Changed background to a sky blue color
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    5000
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

  // Load the grass texture
  const textureLoader = new THREE.TextureLoader();
  const grassTexture = textureLoader.load("textures/grass.png"); // Assuming grass.png is in a 'textures' folder
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  const textureRepeat = Math.max(config.world.width, config.world.depth) / 50; // Adjust 50 to control texture scale
  grassTexture.repeat.set(textureRepeat, textureRepeat);

  const planeGeometry = new THREE.PlaneGeometry(
    config.world.width,
    config.world.depth
  );
  // Apply the texture to the ground plane material
  const planeMaterial = new THREE.MeshStandardMaterial({
    map: grassTexture, // Use the loaded texture
    side: THREE.DoubleSide,
  });
  const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  groundPlane.rotation.x = -Math.PI / 2;
  scene.add(groundPlane);

  const grid = new THREE.GridHelper(config.world.width, 20, 0x4a5568, 0x4a5568);
  scene.add(grid);

  // Water body creation is now handled in main.js's setup() for randomization per simulation run
}
