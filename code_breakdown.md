# EvoSim 3D - Code Breakdown

This document provides a comprehensive breakdown of the JavaScript logic for the EvoSim 3D simulation.

## Table of Contents

1.  [Configuration (`js/config.js`)](#configuration-jsconfigjs)
2.  [Main Simulation Logic (`js/main.js`)](#main-simulation-logic-jsmainjs)
3.  [3D Scene Setup (`js/sceneSetup.js`)](#3d-scene-setup-jsscenesetupjs)
4.  [UI Controller (`js/uiController.js`)](#ui-controller-jsuicontrollerjs)
5.  [Model Factory (`js/modelFactory.js`)](#model-factory-jsmodelfactoryjs)
6.  [Utilities (`js/utils.js`)](#utilities-jsutilsjs)
7.  [Base Creature Class (`js/classes/Creature.js`)](#base-creature-class-jsclassescreaturejs)
8.  [Rabbit Class (`js/classes/Rabbit.js`)](#rabbit-class-jsclassesrabbitjs)
9.  [Sheep Class (`js/classes/Sheep.js`)](#sheep-class-jsclassessheepjs)
10. [Fox Class (`js/classes/Fox.js`)](#fox-class-jsclassesfoxjs)
11. [Bird Class (`js/classes/Bird.js`)](#bird-class-jsclassesbirdjs)
12. [Food Class (`js/classes/Food.js`)](#food-class-jsclassesfoodjs)

---

## Configuration (`js/config.js`)

The `config.js` file centralizes all the simulation parameters. This allows for easy tweaking of the ecosystem's behavior.

```javascript
export const config = {
  simulation: { tickDuration: 75 }, // Target time in ms for each simulation tick.
  world: { width: 800, depth: 800 }, // Size of the simulation area.
  water: {
    enabled: true,
    numberOfBodies: 1, // New parameter for the number of water bodies
    // x, z, width, depth will be randomized for each body.
    // These are now general properties for water bodies, not for a single one.
    minWidth: 50, // Minimum width for any randomized water body
    maxWidth: 250, // Maximum width for any randomized water body
    minDepth: 50, // Minimum depth for any randomized water body
    maxDepth: 250, // Maximum depth for any randomized water body
    color: 0x4682b4, // SteelBlue color for water
  },
  food: { initialCount: 150, energy: 25, regenRate: 20 },
  rabbit: {
    initialCount: 25,
    color: 0xa0a0a0,
    initialEnergy: 100,
    reproduceEnergy: 200,
    energyDecay: 0.15,
    size: 2.5,
    initialSpeed: 1.5,
    initialSense: 70,
    fieldOfView: Math.PI / 2,
  },
  sheep: {
    initialCount: 15,
    color: 0xe0e0e0,
    initialEnergy: 120,
    reproduceEnergy: 250,
    energyDecay: 0.2,
    size: 3.5,
    initialSpeed: 1.2,
    initialSense: 60,
    fieldOfView: Math.PI / 2,
    // Boids-specific parameters
    flockRadius: 50, // How far a sheep can see its flockmates.
    separationWeight: 0.05, // How strongly a sheep avoids its neighbors.
    alignmentWeight: 0.03, // How strongly a sheep tries to match its neighbors''' direction.
    cohesionWeight: 0.01, // How strongly a sheep is drawn to the center of its flock.
  },
  fox: {
    initialCount: 4,
    color: 0xd46a34,
    initialEnergy: 120,
    reproduceEnergy: 250,
    energyDecay: 0.25,
    preyEnergyBonus: 80,
    size: 4,
    initialSpeed: 1.8,
    initialSense: 100,
    fieldOfView: Math.PI / 1.5,
  },
  bird: {
    initialCount: 6,
    color: 0x57c4e5,
    initialEnergy: 100,
    reproduceEnergy: 180,
    energyDecay: 0.2,
    size: 3,
    initialSpeed: 2.0,
    initialSense: 120,
    fieldOfView: Math.PI,
    preyEnergyBonus: 60,
    cruiseAltitude: 50,
  },
  mutation: { rate: 0.1, maxFactor: 0.2 }, // Chance and magnitude of genetic mutation upon reproduction.
};
```

**Key Parameters:**

*   `simulation.tickDuration`: Controls the speed of the simulation.
*   `world.width`, `world.depth`: Defines the boundaries of the simulation area.
*   `water`: Configuration for water bodies, including number, size randomization, and color.
*   `food`: Parameters for food items, including initial count, energy provided, and regeneration rate.
*   Species-specific configurations (e.g., `rabbit`, `sheep`, `fox`, `bird`):
    *   `initialCount`: Number of individuals at the start.
    *   `color`: Visual color in the simulation.
    *   `initialEnergy`, `reproduceEnergy`, `energyDecay`: Parameters governing energy dynamics.
    *   `size`, `initialSpeed`, `initialSense`, `fieldOfView`: Physical and sensory attributes.
    *   `flockRadius`, `separationWeight`, `alignmentWeight`, `cohesionWeight` (for Sheep): Parameters for flocking behavior.
    *   `preyEnergyBonus` (for Fox, Bird): Energy gained from hunting.
    *   `cruiseAltitude` (for Bird): Typical flying height.
*   `mutation`: Parameters for genetic mutation during reproduction.

---

## Main Simulation Logic (`js/main.js`)

`main.js` is the heart of the simulation. It initializes the environment, manages the simulation loop, and handles the interactions between creatures and food.

```javascript
import * as THREE from "three";
// OrbitControls is imported in sceneSetup.js where it'''s used
import { config } from "./config.js";
import { random, isPositionInWater } from "./utils.js"; // Added isPositionInWater
import {
  init3D,
  scene,
  camera,
  renderer,
  controls,
  clock,
  // leafPoints, // Import particle system variables - No longer directly used in main.js after manual edit
  // particleVelocities,
  // particleCount,
} from "./sceneSetup.js";
// Model creation functions are used by species classes, not directly in main.js for now
// import { createRabbitModel, createSheepModel, createFoxModel, createBirdModel, createVegetationModel } from '''./modelFactory.js''';
import {
  updateStats,
  setupEventListeners,
  initUI,
  isVisionConesVisible,
} from "./uiController.js"; // Added isVisionConesVisible
// Creature class is used by species classes
// import { Creature } from '''./classes/Creature.js''';
import { Rabbit } from "./classes/Rabbit.js";
import { Sheep } from "./classes/Sheep.js";
import { Fox } from "./classes/Fox.js";
import { Bird } from "./classes/Bird.js";
import { Food } from "./classes/Food.js";

// --- Simulation State ---
export let simulationRunning = false;
export let time = 0;
export let creatures = [];
export let food = [];
export let waterBodiesData = []; // Array to store data for each water body
let waterBodyMeshes = []; // Array to store meshes for each water body
let elapsedSinceTick = 0;
// let currentWaterMesh = null; // Replaced by waterBodyMeshes array

// --- Simulation Control Functions ---
export function startSimulation() {
  simulationRunning = true;
}
export function stopSimulation() {
  simulationRunning = false;
}
export function resetSimulation() {
  simulationRunning = false;
  // Ensure UI reflects reset state immediately for button states
  const startBtn = document.getElementById("start-btn");
  const stopBtn = document.getElementById("stop-btn");
  if (startBtn) startBtn.textContent = "Start";
  if (startBtn) startBtn.classList.remove("opacity-50", "cursor-not-allowed");
  if (stopBtn) stopBtn.classList.add("opacity-50", "cursor-not-allowed");

  // Remove old water meshes before setting up new ones
  waterBodyMeshes.forEach((mesh) => {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  waterBodyMeshes = [];
  waterBodiesData = []; // Clear the data array as well

  setup();
}

// --- Core Simulation Functions ---
function setup() {
  // Clear previous data just in case, though resetSimulation should handle it
  waterBodyMeshes.forEach((mesh) => {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  waterBodyMeshes = [];
  waterBodiesData = [];

  // Randomize and create water bodies
  if (config.water && config.water.enabled && config.water.numberOfBodies > 0) {
    const worldHalfW = config.world.width / 2;
    const worldHalfD = config.world.depth / 2;

    for (let i = 0; i < config.water.numberOfBodies; i++) {
      const waterWidth = random(config.water.minWidth, config.water.maxWidth);
      const waterDepth = random(config.water.minDepth, config.water.maxDepth);
      const waterX = random(
        -worldHalfW + waterWidth / 2,
        worldHalfW - waterWidth / 2
      );
      const waterZ = random(
        -worldHalfD + waterDepth / 2,
        worldHalfD - waterDepth / 2
      );

      const singleWaterBodyData = {
        x: waterX,
        z: waterZ,
        width: waterWidth,
        depth: waterDepth,
      };
      waterBodiesData.push(singleWaterBodyData);

      const waterGeometry = new THREE.PlaneGeometry(waterWidth, waterDepth),
        waterMaterial = new THREE.MeshStandardMaterial({
          color: config.water.color,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
        });
      const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
      waterMesh.rotation.x = -Math.PI / 2;
      waterMesh.position.set(waterX, 1, waterZ); // y slightly above ground - increased to 1
      scene.add(waterMesh);
      waterBodyMeshes.push(waterMesh);
    }
  }

  creatures.forEach((c) => c.dispose());
  food.forEach((f) => f.dispose());

  time = 0;
  creatures = [];
  food = [];
  const halfW = config.world.width / 2,
    halfD = config.world.depth / 2;
  const visionConesOn = isVisionConesVisible(); // Get current state

  for (let i = 0; i < config.food.initialCount; i++) {
    spawnFood();
  }

  function getValidSpawnPosition() {
    let x, z;
    do {
      x = random(-halfW, halfW); // Corrected to use halfW for x as well
      z = random(-halfD, halfD);
    } while (isPositionInWater(x, z, waterBodiesData)); // Pass the array of water bodies
    return { x, z };
  }

  for (let i = 0; i < config.rabbit.initialCount; i++) {
    const pos = getValidSpawnPosition();
    creatures.push(
      new Rabbit(pos.x, 0, pos.z, config.rabbit.initialEnergy, visionConesOn)
    );
  }
  for (let i = 0; i < config.sheep.initialCount; i++) {
    const pos = getValidSpawnPosition();
    creatures.push(
      new Sheep(pos.x, 0, pos.z, config.sheep.initialEnergy, visionConesOn)
    );
  }
  for (let i = 0; i < config.fox.initialCount; i++) {
    const pos = getValidSpawnPosition();
    creatures.push(
      new Fox(pos.x, 0, pos.z, config.fox.initialEnergy, visionConesOn)
    );
  }
  for (let i = 0; i < config.bird.initialCount; i++) {
    // Birds can spawn over water as they fly, so no check needed here for initial spawn
    // Their movement logic already handles altitude.
    creatures.push(
      new Bird(
        random(-halfW, halfW), // Corrected to use halfW for x
        config.bird.cruiseAltitude,
        random(-halfD, halfD),
        config.bird.initialEnergy,
        visionConesOn
      )
    );
  }
  updateStats(time, creatures, food); // Pass state to updateStats
}

function spawnFood() {
  const halfW = config.world.width / 2,
    halfD = config.world.depth / 2;
  let x, z;
  do {
    x = random(-halfW, halfW); // Corrected to use halfW for x
    z = random(-halfD, halfD);
  } while (isPositionInWater(x, z, waterBodiesData)); // Pass the array of water bodies
  food.push(new Food(x, z));
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();

  // --- Animate Falling Leaves (moved to sceneSetup.js animateParticles) ---

  if (simulationRunning) {
    elapsedSinceTick += clock.getDelta() * 1000;

    if (elapsedSinceTick > config.simulation.tickDuration) {
      const ticksToRun = Math.floor(
        elapsedSinceTick / config.simulation.tickDuration
      );
      const currentVisionConesVisible = isVisionConesVisible();

      for (let i = 0; i < ticksToRun; i++) {
        time++;
        if (time % Math.floor(100 / config.food.regenRate) === 0) {
          spawnFood();
        }

        const newOffspringList = [];
        const consumedFoodIds = new Set();
        const huntedCreatureIds = new Set();

        for (let j = 0; j < creatures.length; j++) {
          const c = creatures[j];
          if (c.energy > 0) {
            const updateResult = c.update(
              food,
              creatures,
              currentVisionConesVisible
            );
            if (updateResult) {
              if (updateResult.newOffspring) {
                newOffspringList.push(updateResult.newOffspring);
              }
              if (updateResult.consumedFoodId) {
                consumedFoodIds.add(updateResult.consumedFoodId);
              }
              if (updateResult.huntedCreatureId) {
                huntedCreatureIds.add(updateResult.huntedCreatureId);
              }
            }
          }
        }

        if (consumedFoodIds.size > 0) {
          const newFoodArray = [];
          for (let j = 0; j < food.length; j++) {
            if (consumedFoodIds.has(food[j].id)) {
              food[j].dispose();
            } else {
              newFoodArray.push(food[j]);
            }
          }
          food = newFoodArray;
        }

        const nextCreaturesArray = [];
        for (let j = 0; j < creatures.length; j++) {
          const c = creatures[j];
          if (c.energy > 0 && !huntedCreatureIds.has(c.id)) {
            nextCreaturesArray.push(c);
          } else {
            c.dispose();
          }
        }
        creatures = nextCreaturesArray.concat(newOffspringList);
      }
      elapsedSinceTick %= config.simulation.tickDuration;
      updateStats(time, creatures, food); // Correctly placed after ticks, before render
    }
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera); // Correctly placed to render every frame
  }
}

// --- Initialize ---
document.addEventListener("DOMContentLoaded", () => {
  init3D(); // Initializes Three.js scene, camera, renderer, skybox, ground
  // animateParticles was called here but is now integrated into sceneSetup.js
  initUI(); // Initializes UI elements and their default values
  setupEventListeners( // Sets up event listeners for UI controls
    startSimulation,
    stopSimulation,
    resetSimulation,
    () => simulationRunning, // Callback to get current simulation running state
    () => creatures // Callback to get current creatures array (for vision cone toggle)
  );
  setup(); // Sets up initial simulation state (creatures, food, water)
  animate(); // Starts the main animation loop
});
```

**Key Functions and Logic:**

*   **State Variables**: `simulationRunning`, `time`, `creatures`, `food`, `waterBodiesData`, `waterBodyMeshes`, `elapsedSinceTick`.
*   **Control Functions**:
    *   `startSimulation()`: Sets `simulationRunning` to true.
    *   `stopSimulation()`: Sets `simulationRunning` to false.
    *   `resetSimulation()`: Stops the simulation, clears existing creatures, food, and water bodies, and calls `setup()` to re-initialize.
*   **`setup()`**:
    *   Clears any existing water body meshes and data.
    *   Randomly generates and places water bodies based on `config.water` settings. Each water body is a `THREE.PlaneGeometry` with a semi-transparent blue material.
    *   Disposes of old creatures and food items.
    *   Resets `time`, `creatures`, and `food` arrays.
    *   Spawns initial food items and creatures (Rabbits, Sheep, Foxes, Birds) at valid positions (not in water for ground creatures).
    *   Calls `updateStats()` to initialize the UI.
*   **`spawnFood()`**: Creates a new `Food` instance at a random valid position (not in water) and adds it to the `food` array.
*   **`animate()`**:
    *   The main render loop, called via `requestAnimationFrame`.
    *   Updates `OrbitControls`.
    *   If `simulationRunning` is true:
        *   Accumulates `elapsedSinceTick`.
        *   When `elapsedSinceTick` exceeds `config.simulation.tickDuration`, it processes one or more simulation ticks.
        *   For each tick:
            *   Increments `time`.
            *   Spawns new food if `time` meets regeneration criteria.
            *   Iterates through all creatures:
                *   Calls the `update()` method of each creature.
                *   Collects results: `newOffspring`, `consumedFoodId`, `huntedCreatureId`.
            *   Processes consumed food: removes them from the `food` array and disposes of their 3D models.
            *   Processes hunted creatures and creatures with zero energy: removes them from the `creatures` array and disposes of their 3D models.
            *   Adds new offspring to the `creatures` array.
        *   Resets `elapsedSinceTick`.
        *   Calls `updateStats()` to refresh the UI.
    *   Renders the `scene` using the `renderer` and `camera`.
*   **Initialization (`DOMContentLoaded`)**:
    *   Calls `init3D()` to set up the Three.js environment.
    *   Calls `initUI()` to prepare UI elements.
    *   Calls `setupEventListeners()` to attach listeners to UI controls.
    *   Calls `setup()` to initialize the simulation state.
    *   Calls `animate()` to start the simulation loop.

---

## 3D Scene Setup (`js/sceneSetup.js`)

`sceneSetup.js` is responsible for initializing the Three.js environment, including the scene, camera, renderer, lighting, ground plane, skybox, and the falling leaves particle system.

```javascript
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { config } from "./config.js";

// Declare particle system variables here to be exported and assigned in init3D
export let scene, camera, renderer, controls, container;
export let leafPoints, particleVelocities, particleCount; // Exported for potential external access/modification
export const clock = new THREE.Clock();

// Function to animate particles, called within the main animate loop via init3D
function animateParticles() {
  if (leafPoints && particleVelocities && particleCount) {
    const positions = leafPoints.geometry.attributes.position.array;
    const timeFactor = clock.getElapsedTime(); // Use elapsed time for consistent sway

    for (let i = 0; i < particleCount; i++) {
      const vel = particleVelocities[i];
      positions[i * 3 + 1] -= vel.ySpeed; // Fall down

      // Add sway
      positions[i * 3] +=
        Math.sin(vel.swayAngle + timeFactor * vel.ySpeed) * vel.xSway;
      positions[i * 3 + 2] +=
        Math.cos(vel.swayAngle + timeFactor * vel.ySpeed) * vel.zSway;

      // If particle falls below ground, reset to top
      if (positions[i * 3 + 1] < -10) {
        // -10 as a buffer below ground
        positions[i * 3] =
          Math.random() * config.world.width - config.world.width / 2;
        positions[i * 3 + 1] = Math.random() * 100 + 150; // Reset Y high above
        positions[i * 3 + 2] =
          Math.random() * config.world.depth - config.world.depth / 2;
      }
    }
    leafPoints.geometry.attributes.position.needsUpdate = true;
  }
  requestAnimationFrame(animateParticles); // Keep the particle animation loop running
}

export function init3D() {
  container = document.getElementById("simulation-container");
  if (!container) {
    console.error(
      "THREE.JS SETUP: Simulation container element not found in DOM!"
    );
    return;
  }
  if (container.clientWidth === 0 || container.clientHeight === 0) {
    console.warn(
      "THREE.JS SETUP: Simulation container has zero dimensions. Check CSS. Rendering might be incorrect or fail."
    );
  }

  scene = new THREE.Scene();

  // --- Skybox Setup ---
  const loader = new THREE.CubeTextureLoader();
  loader.setPath("textures/skybox/");
  const textureCube = loader.load([
    "px.jpg",
    "nx.jpg",
    "py.jpg",
    "ny.jpg",
    "pz.jpg",
    "nz.jpg",
  ]);
  scene.background = textureCube;

  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    5000
  );
  camera.position.set(0, 150, 200);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const ambientLight = new THREE.AmbientLight(0xcccccc, 1.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 100, 75);
  scene.add(directionalLight);

  const textureLoader = new THREE.TextureLoader();
  const grassTexture = textureLoader.load("textures/grass.png");
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  const textureRepeat = Math.max(config.world.width, config.world.depth) / 50;
  grassTexture.repeat.set(textureRepeat, textureRepeat);

  const planeGeometry = new THREE.PlaneGeometry(
    config.world.width,
    config.world.depth
  );
  const planeMaterial = new THREE.MeshStandardMaterial({
    map: grassTexture,
    side: THREE.DoubleSide,
  });
  const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  groundPlane.rotation.x = -Math.PI / 2;
  scene.add(groundPlane);

  // --- Falling Leaves Particle System (Initialization) ---
  particleCount = 500; // Assign to the exported variable
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  particleVelocities = []; // Assign to the exported variable

  const leafTexture = new THREE.TextureLoader().load("textures/leaf.png");
  const particleMaterial = new THREE.PointsMaterial({
    map: leafTexture,
    size: 2,
    transparent: true,
    alphaTest: 0.5,
    blending: THREE.NormalBlending,
    depthWrite: false, // Important for correct rendering with transparency
  });

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] =
      Math.random() * config.world.width - config.world.width / 2; // X
    positions[i * 3 + 1] = Math.random() * 200 + 100; // Y (start high)
    positions[i * 3 + 2] =
      Math.random() * config.world.depth - config.world.depth / 2; // Z
    particleVelocities.push({
      ySpeed: Math.random() * 0.1 + 0.05, // Random falling speed
      xSway: Math.random() * 0.02 - 0.01, // Random sway magnitude in X
      zSway: Math.random() * 0.02 - 0.01, // Random sway magnitude in Z
      swayAngle: Math.random() * Math.PI * 2, // Initial random sway phase
    });
  }
  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );
  leafPoints = new THREE.Points(particlesGeometry, particleMaterial); // Assign to the exported variable
  scene.add(leafPoints);
  // --- End Falling Leaves Particle System ---

  animateParticles(); // Start the particle animation loop
}
```

**Key Components and Logic:**

*   **Exports**: `scene`, `camera`, `renderer`, `controls`, `container`, `clock`, and particle system variables (`leafPoints`, `particleVelocities`, `particleCount`).
*   **`init3D()`**:
    *   Gets the `simulation-container` DOM element.
    *   Creates a new `THREE.Scene`.
    *   **Skybox Setup**:
        *   Uses `THREE.CubeTextureLoader` to load six images for the skybox faces (px, nx, py, ny, pz, nz).
        *   Sets `scene.background` to the loaded `textureCube`.
    *   Creates a `THREE.PerspectiveCamera`.
    *   Creates a `THREE.WebGLRenderer` and appends its DOM element to the `container`.
    *   Initializes `OrbitControls` for camera manipulation.
    *   Adds `THREE.AmbientLight` and `THREE.DirectionalLight` to the scene.
    *   Creates the ground plane:
        *   Loads a grass texture (`textures/grass.png`) using `THREE.TextureLoader`.
        *   Sets texture wrapping and repeat for tiling.
        *   Creates a `THREE.PlaneGeometry` and a `THREE.MeshStandardMaterial` using the grass texture.
        *   Creates a `THREE.Mesh` for the ground, rotates it to be horizontal, and adds it to the scene.
    *   **Falling Leaves Particle System**:
        *   `particleCount`: Defines the number of leaves.
        *   `particlesGeometry`: A `THREE.BufferGeometry` to hold particle positions.
        *   `particleVelocities`: An array to store individual falling speed and sway parameters for each particle.
        *   Loads a leaf texture (`textures/leaf.png`).
        *   `particleMaterial`: A `THREE.PointsMaterial` using the leaf texture, configured for transparency and blending.
        *   Initializes particle positions randomly within the world bounds and at varying heights.
        *   Initializes `particleVelocities` with random falling speeds and sway parameters for each leaf.
        *   Creates `leafPoints` (a `THREE.Points` object) and adds it to the scene.
    *   Calls `animateParticles()` to start the independent animation loop for the leaves.
*   **`animateParticles()`**:
    *   This function is called recursively using `requestAnimationFrame` to create a separate animation loop for the particles, independent of the main simulation ticks.
    *   Updates the Y position of each particle to make it fall (`positions[i * 3 + 1] -= vel.ySpeed`).
    *   Adds a swaying motion to X and Z positions using `Math.sin` and `Math.cos` combined with `timeFactor` and individual sway parameters.
    *   If a particle falls below a certain threshold (e.g., -10 Y), its position is reset to a random location at the top of the simulation area, creating a continuous falling effect.
    *   Sets `leafPoints.geometry.attributes.position.needsUpdate = true` to tell Three.js to re-render the particle positions.

---

## UI Controller (`js/uiController.js`)

`uiController.js` handles the interactions with the HTML user interface, including updating statistics and managing control inputs.

```javascript
import { config } from "./config.js";
// scene, camera, renderer, container are imported for the resize handler
import { scene, camera, renderer, container } from "./sceneSetup.js";

// UI Elements - Declare variables here, assign in initUI
let timeElapsedEl, totalCreaturesEl, foodCountEl;
let rabbitCountEl, rabbitSpeedEl, rabbitSenseEl;
let sheepCountEl, sheepSpeedEl, sheepSenseEl;
let foxCountEl, foxSpeedEl, foxSenseEl;
let birdCountEl, birdSpeedEl, birdSenseEl;

let tickDurationInput, foodRegenRateInput, mutationRateInput;
let rabbitStartCountInput,
  sheepStartCountInput,
  foxStartCountInput,
  birdStartCountInput;
let toggleVisionConesInput, waterBodiesCountInput;

let tickDurationValueEl, foodRegenValueEl, mutationRateValueEl;
let rabbitStartCountValueEl,
  sheepStartCountValueEl,
  foxStartCountValueEl,
  birdStartCountValueEl;
let waterBodiesCountValueEl;

let startBtn, stopBtn, resetBtn;

export function updateStats(time, creatures, food) {
  // Ensure elements are initialized before trying to update them
  if (!timeElapsedEl) {
    // console.warn("updateStats called before UI elements are initialized.");
    return;
  }

  let rabbitCount = 0,
    sheepCount = 0,
    foxCount = 0,
    birdCount = 0;
  let totalRabbitSpeed = 0,
    totalRabbitSense = 0,
    totalSheepSpeed = 0,
    totalSheepSense = 0,
    totalFoxSpeed = 0,
    totalFoxSense = 0,
    totalBirdSpeed = 0,
    totalBirdSense = 0;

  creatures.forEach((c) => {
    switch (c.type) {
      case "rabbit":
        rabbitCount++;
        totalRabbitSpeed += c.speed;
        totalRabbitSense += c.sense;
        break;
      case "sheep":
        sheepCount++;
        totalSheepSpeed += c.speed;
        totalSheepSense += c.sense;
        break;
      case "fox":
        foxCount++;
        totalFoxSpeed += c.speed;
        totalFoxSense += c.sense;
        break;
      case "bird":
        birdCount++;
        totalBirdSpeed += c.speed;
        totalBirdSense += c.sense;
        break;
    }
  });
  timeElapsedEl.textContent = time;
  totalCreaturesEl.textContent = creatures.length;
  foodCountEl.textContent = food.length;

  rabbitCountEl.textContent = rabbitCount;
  rabbitSpeedEl.textContent =
    rabbitCount > 0 ? (totalRabbitSpeed / rabbitCount).toFixed(2) : "N/A";
  rabbitSenseEl.textContent =
    rabbitCount > 0 ? (totalRabbitSense / rabbitCount).toFixed(2) : "N/A";

  sheepCountEl.textContent = sheepCount;
  sheepSpeedEl.textContent =
    sheepCount > 0 ? (totalSheepSpeed / sheepCount).toFixed(2) : "N/A";
  sheepSenseEl.textContent =
    sheepCount > 0 ? (totalSheepSense / sheepCount).toFixed(2) : "N/A";

  foxCountEl.textContent = foxCount;
  foxSpeedEl.textContent =
    foxCount > 0 ? (totalFoxSpeed / foxCount).toFixed(2) : "N/A";
  foxSenseEl.textContent =
    foxCount > 0 ? (totalFoxSense / foxCount).toFixed(2) : "N/A";

  birdCountEl.textContent = birdCount;
  birdSpeedEl.textContent =
    birdCount > 0 ? (totalBirdSpeed / birdCount).toFixed(2) : "N/A";
  birdSenseEl.textContent =
    birdCount > 0 ? (totalBirdSense / birdCount).toFixed(2) : "N/A";
}

export function setupEventListeners(
  startCb,
  stopCb,
  resetCb,
  getSimRunningState,
  getCreaturesArray
) {
  // Ensure buttons are initialized before adding listeners
  if (!startBtn || !stopBtn || !resetBtn) {
    // console.warn("setupEventListeners called before UI buttons are initialized.");
    return;
  }

  startBtn.addEventListener("click", () => {
    if (!getSimRunningState()) {
      startCb();
      startBtn.textContent = "Running...";
      startBtn.classList.add("opacity-50", "cursor-not-allowed");
      stopBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  });
  stopBtn.addEventListener("click", () => {
    if (getSimRunningState()) {
      stopCb();
      startBtn.textContent = "Resume";
      startBtn.classList.remove("opacity-50", "cursor-not-allowed");
      stopBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
  });
  resetBtn.addEventListener("click", () => {
    resetCb();
    startBtn.textContent = "Start";
    startBtn.classList.remove("opacity-50", "cursor-not-allowed");
    stopBtn.classList.add("opacity-50", "cursor-not-allowed");
  });

  // Ensure input elements are initialized before adding listeners
  if (!tickDurationInput /* add checks for other inputs if necessary */) {
    // console.warn("setupEventListeners called before input UI elements are initialized.");
    return;
  }

  tickDurationInput.addEventListener("input", (e) => {
    const value = parseInt(e.target.value);
    config.simulation.tickDuration = value;
    tickDurationValueEl.textContent = value;
  });
  toggleVisionConesInput.addEventListener("change", (e) => {
    const isVisible = e.target.checked;
    const creatures = getCreaturesArray(); // Get creatures array via callback
    creatures.forEach((c) => {
      if (c.visionCone) {
        c.visionCone.visible = isVisible;
      }
    });
  });
  rabbitStartCountInput.addEventListener("input", (e) => {
    const value = parseInt(e.target.value);
    config.rabbit.initialCount = value;
    rabbitStartCountValueEl.textContent = value;
  });
  sheepStartCountInput.addEventListener("input", (e) => {
    const value = parseInt(e.target.value);
    config.sheep.initialCount = value;
    sheepStartCountValueEl.textContent = value;
  });
  foxStartCountInput.addEventListener("input", (e) => {
    const value = parseInt(e.target.value);
    config.fox.initialCount = value;
    foxStartCountValueEl.textContent = value;
  });
  birdStartCountInput.addEventListener("input", (e) => {
    const value = parseInt(e.target.value);
    config.bird.initialCount = value;
    birdStartCountValueEl.textContent = value;
  });
  waterBodiesCountInput.addEventListener("input", (e) => {
    // New event listener
    const value = parseInt(e.target.value);
    config.water.numberOfBodies = value;
    waterBodiesCountValueEl.textContent = value;
  });
  foodRegenRateInput.addEventListener("input", (e) => {
    const value = parseInt(e.target.value);
    config.food.regenRate = value;
    foodRegenValueEl.textContent = value;
  });
  mutationRateInput.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    config.mutation.rate = value;
    mutationRateValueEl.textContent = value.toFixed(2);
  });
  window.addEventListener("resize", () => {
    if (camera && renderer && container) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  });
}

export function initUI() {
  // Assign DOM elements here, safely after DOMContentLoaded
  timeElapsedEl = document.getElementById("time-elapsed");
  totalCreaturesEl = document.getElementById("total-creatures");
  foodCountEl = document.getElementById("food-count");
  rabbitCountEl = document.getElementById("rabbit-count");
  rabbitSpeedEl = document.getElementById("rabbit-speed");
  rabbitSenseEl = document.getElementById("rabbit-sense");
  sheepCountEl = document.getElementById("sheep-count");
  sheepSpeedEl = document.getElementById("sheep-speed");
  sheepSenseEl = document.getElementById("sheep-sense");
  foxCountEl = document.getElementById("fox-count");
  foxSpeedEl = document.getElementById("fox-speed");
  foxSenseEl = document.getElementById("fox-sense");
  birdCountEl = document.getElementById("bird-count");
  birdSpeedEl = document.getElementById("bird-speed");
  birdSenseEl = document.getElementById("bird-sense");

  tickDurationInput = document.getElementById("tick-duration");
  foodRegenRateInput = document.getElementById("food-regen-rate");
  mutationRateInput = document.getElementById("mutation-rate");
  rabbitStartCountInput = document.getElementById("rabbit-start-count");
  sheepStartCountInput = document.getElementById("sheep-start-count");
  foxStartCountInput = document.getElementById("fox-start-count");
  birdStartCountInput = document.getElementById("bird-start-count");
  toggleVisionConesInput = document.getElementById("toggle-vision-cones");
  waterBodiesCountInput = document.getElementById("water-bodies-count");

  tickDurationValueEl = document.getElementById("tick-duration-value");
  foodRegenValueEl = document.getElementById("food-regen-value");
  mutationRateValueEl = document.getElementById("mutation-rate-value");
  rabbitStartCountValueEl = document.getElementById("rabbit-start-count-value");
  sheepStartCountValueEl = document.getElementById("sheep-start-count-value");
  foxStartCountValueEl = document.getElementById("fox-start-count-value");
  birdStartCountValueEl = document.getElementById("bird-start-count-value");
  waterBodiesCountValueEl = document.getElementById("water-bodies-count-value");

  startBtn = document.getElementById("start-btn");
  stopBtn = document.getElementById("stop-btn");
  resetBtn = document.getElementById("reset-btn");

  // Basic check to see if critical elements were found
  if (!timeElapsedEl || !tickDurationInput || !startBtn) {
    console.error(
      "UI_INIT_ERROR: One or more critical UI elements were not found in the DOM. UI might not function as expected."
    );
    return; // Stop further UI initialization if critical parts are missing
  }

  // Initialize UI values from config
  tickDurationInput.value = config.simulation.tickDuration;
  tickDurationValueEl.textContent = config.simulation.tickDuration;
  rabbitStartCountInput.value = config.rabbit.initialCount;
  rabbitStartCountValueEl.textContent = config.rabbit.initialCount;
  sheepStartCountInput.value = config.sheep.initialCount;
  sheepStartCountValueEl.textContent = config.sheep.initialCount;
  foxStartCountInput.value = config.fox.initialCount;
  foxStartCountValueEl.textContent = config.fox.initialCount;
  birdStartCountInput.value = config.bird.initialCount;
  birdStartCountValueEl.textContent = config.bird.initialCount;
  waterBodiesCountInput.value = config.water.numberOfBodies; // Initialize new slider
  waterBodiesCountValueEl.textContent = config.water.numberOfBodies; // Initialize new slider display
  foodRegenRateInput.value = config.food.regenRate;
  foodRegenValueEl.textContent = config.food.regenRate;
  mutationRateInput.value = config.mutation.rate;
  mutationRateValueEl.textContent = config.mutation.rate.toFixed(2);
  stopBtn.classList.add("opacity-50", "cursor-not-allowed");
}

export const isVisionConesVisible = () => {
  // Ensure toggleVisionConesInput is assigned before accessing checked property
  if (toggleVisionConesInput) {
    return toggleVisionConesInput.checked;
  }
  // Default to a sensible value (e.g., true or based on config) if element not found yet,
  // though this function should ideally only be called after initUI.
  // console.warn("isVisionConesVisible called before toggleVisionConesInput is initialized.");
  return true; // Default to true if not initialized (matches initial checkbox state in HTML)
};
```

**Key Functions and Logic:**

*   **UI Element Variables**: Declares variables to hold references to DOM elements for statistics display and control inputs. These are assigned in `initUI()`.
*   **`updateStats(time, creatures, food)`**:
    *   Calculates and displays statistics: current time, total creatures, food count.
    *   Calculates and displays per-species statistics: count, average speed, average sense.
    *   Handles cases where a species count is zero to avoid division by zero errors (displays "N/A").
*   **`setupEventListeners(startCb, stopCb, resetCb, getSimRunningState, getCreaturesArray)`**:
    *   Takes callbacks for start, stop, and reset actions from `main.js`.
    *   `getSimRunningState`: A callback to check if the simulation is currently running (used to enable/disable buttons).
    *   `getCreaturesArray`: A callback to get the current list of creatures (used by the vision cone toggle).
    *   Adds click listeners to Start, Stop, and Reset buttons, calling the respective callbacks and updating button text/styles.
    *   Adds input listeners to all parameter sliders/checkboxes:
        *   Updates the corresponding value in the `config` object.
        *   Updates the displayed value next to the slider.
        *   For `toggleVisionConesInput`, it iterates through all creatures and sets their `visionCone.visible` property.
    *   Adds a `resize` listener to the window to handle responsive canvas resizing by updating camera aspect ratio and renderer size.
*   **`initUI()`**:
    *   Assigns all DOM element references to the previously declared variables. This is called after `DOMContentLoaded` to ensure elements are available.
    *   Initializes the values of input controls (sliders, checkboxes) and their corresponding display elements based on the initial `config` values.
    *   Sets the initial state of the Stop button to disabled.
*   **`isVisionConesVisible()`**:
    *   Returns the checked state of the `toggleVisionConesInput` checkbox.
    *   Includes a fallback to `true` if the input element is not yet initialized, aligning with the default checked state in the HTML.

---

## Model Factory (`js/modelFactory.js`)

`modelFactory.js` provides functions to create the 3D models for creatures and vegetation. This helps keep the main simulation logic cleaner.

```javascript
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
  tailTip.position.y = -2.5; // Relative to tail'''s center
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

  if (Math.random() > 0.4) { // Tree
    const trunkHeight = random(12, 18);
    const trunkGeo = new THREE.CylinderGeometry(
      random(1.5, 2),
      random(2, 2.5),
      trunkHeight,
      8
    );
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2; // Base at y=0
    vegetation.add(trunk);
    const leavesGeo = new THREE.IcosahedronGeometry(random(8, 12), 0);
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = trunkHeight + 3; // Position leaves on top of trunk
    vegetation.add(leaves);
  } else { // Bush
    const bushRadius = random(6, 9);
    const leavesGeo = new THREE.IcosahedronGeometry(bushRadius, 0);
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = bushRadius / 2; // Base at y=0
    vegetation.add(leaves);
  }
  return vegetation;
}
```

**Key Functions:**

*   Each `create<Species/Vegetation>Model()` function returns a `THREE.Object3D` which acts as a container for the model parts.
*   They use simple `THREE.Geometry` (Box, Cylinder, Cone, Icosahedron) and `THREE.MeshStandardMaterial` for a basic appearance.
*   **Model Base Alignment**: All models are constructed or positioned such that their logical "base" is at `y=0` within their local coordinate system. This simplifies placement on the ground plane in the main simulation.
    *   For example, in `createRabbitModel`, the `body` (a `BoxGeometry` of height 4) is positioned at `body.position.y = 2` so its bottom face is at `y=0`. Other parts (head, ears) are positioned relative to this.
    *   In `createSheepModel`, an `yOffset` is used to shift the entire model upwards so the bottom of the legs are at `y=0`.
    *   `createVegetationModel` positions trunks and bushes such that their lowest point is at `y=0`.
*   `createVegetationModel()` randomly creates either a tree (trunk + leaves) or a bush.

---

## Utilities (`js/utils.js`)

`utils.js` contains helper functions used throughout the simulation.

```javascript
export const random = (min, max) => Math.random() * (max - min) + min;
export const distance2D = (a, b) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2);
export function isPositionInWater(x, z, waterBodies) {
  if (!waterBodies || waterBodies.length === 0) {
    return false;
  }

  for (const waterBody of waterBodies) {
    const waterHalfWidth = waterBody.width / 2;
    const waterHalfDepth = waterBody.depth / 2;
    const waterMinX = waterBody.x - waterHalfWidth;
    const waterMaxX = waterBody.x + waterHalfWidth;
    const waterMinZ = waterBody.z - waterHalfDepth;
    const waterMaxZ = waterBody.z + waterHalfDepth;

    if (x > waterMinX && x < waterMaxX && z > waterMinZ && z < waterMaxZ) {
      return true; // Position is in this water body
    }
  }
  return false; // Position is not in any water body
}
```

**Functions:**

*   `random(min, max)`: Returns a random floating-point number between `min` (inclusive) and `max` (exclusive).
*   `distance2D(a, b)`: Calculates the 2D Euclidean distance between two objects `a` and `b` (assuming they have `x` and `z` properties).
*   `isPositionInWater(x, z, waterBodies)`:
    *   Checks if a given 2D coordinate (`x`, `z`) falls within any of the defined water bodies.
    *   `waterBodies` is an array of objects, where each object contains the `x`, `z`, `width`, and `depth` of a water body.
    *   Iterates through each `waterBody` and checks if the point lies within its rectangular bounds.
    *   Returns `true` if the position is in any water body, `false` otherwise.

---

## Base Creature Class (`js/classes/Creature.js`)

`Creature.js` defines the base class for all creatures in the simulation. It handles common properties and methods like movement, sensing, reproduction, and model management.

```javascript
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
    this.vx = random(-1, 1);
    this.vy = 0; // Vertical velocity, primarily for birds
    this.vz = random(-1, 1);
    this.config = speciesConfig; // Specific config for the species (e.g., config.rabbit)
    this.size = this.config.size;
    this.speed = this.config.initialSpeed;
    this.sense = this.config.initialSense;

    this.mesh = new THREE.Object3D(); // Main container for the creature'''s 3D representation
    this.mesh.position.set(this.x, this.y, this.z);
    scene.add(this.mesh);

    this.bodyModel = model; // The actual visible model from modelFactory.js
    this.bodyModel.scale.set(this.size * 0.5, this.size * 0.5, this.size * 0.5); // Scale model by creature size
    this.mesh.add(this.bodyModel);

    // Vision Cone
    const coneGeo = new THREE.ConeGeometry(
      this.sense * 0.4, // base radius related to sense
      this.sense,       // height related to sense
      16,               // radial segments
      1,                // height segments
      true              // openEnded
    );
    coneGeo.translate(0, -this.sense / 2, 0); // Position base at creature'''s origin, pointing forward
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
    });
    this.visionCone = new THREE.Mesh(coneGeo, coneMat);
    this.visionCone.rotation.x = -Math.PI / 2; // Rotate to point along Z-axis
    this.visionCone.visible = visionConesVisible; // Set initial visibility
    this.mesh.add(this.visionCone);
  }

  move() {
    this.energy -= this.config.energyDecay;
    const mag = Math.sqrt(this.vx ** 2 + this.vz ** 2);
    if (mag > 0) {
      this.vx /= mag; // Normalize velocity vector
      this.vz /= mag;
    }

    let nextX = this.x + this.vx * this.speed;
    let nextZ = this.z + this.vz * this.speed;

    const halfWidth = config.world.width / 2;
    const halfDepth = config.world.depth / 2;

    // Boundary collision
    if (nextX < -halfWidth || nextX > halfWidth) {
      this.vx *= -1;
      nextX = Math.max(-halfWidth, Math.min(nextX, halfWidth)); // Clamp position
    }
    if (nextZ < -halfDepth || nextZ > halfDepth) {
      this.vz *= -1;
      nextZ = Math.max(-halfDepth, Math.min(nextZ, halfDepth)); // Clamp position
    }

    // Water collision detection for non-bird creatures
    if (this.type !== 'bird' && config.water && config.water.enabled && waterBodiesData.length > 0) {
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
          this.vx *= -1; // Reverse direction
          this.vz *= -1;
          // Attempt to place the creature just outside the water boundary it was about to enter
          if (this.x <= waterMinX && nextX > waterMinX) nextX = waterMinX - this.size / 2;
          else if (this.x >= waterMaxX && nextX < waterMaxX) nextX = waterMaxX + this.size / 2;
          if (this.z <= waterMinZ && nextZ > waterMinZ) nextZ = waterMinZ - this.size / 2;
          else if (this.z >= waterMaxZ && nextZ < waterMaxZ) nextZ = waterMaxZ + this.size / 2;
          break; // Collision detected with one water body
        }
      }
    }

    this.x = nextX;
    this.z = nextZ;
    // this.y is handled by subclasses if they fly (e.g., Bird)

    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.lookAt(
      new THREE.Vector3(this.x + this.vx, this.y + this.vy, this.z + this.vz) // vy is used for birds to look up/down
    );
  }

  isTargetInSight(target) {
    const creatureDirection = new THREE.Vector3();
    this.mesh.getWorldDirection(creatureDirection); // Get the forward direction of the creature
    const toTarget = new THREE.Vector3(
      target.x - this.x,
      target.y - this.y, // Consider Y for birds looking down/up
      target.z - this.z
    );
    const d = toTarget.length();
    if (d > this.sense || d === 0) return false; // Target is too far or at the same position
    toTarget.normalize();
    const angle = creatureDirection.angleTo(toTarget); // Angle between creature'''s direction and vector to target
    return angle < this.config.fieldOfView / 2; // Check if within field of view
  }

  reproduce(visionConesVisible) {
    if (this.energy >= this.config.reproduceEnergy) {
      this.energy /= 2; // Parent gives half its energy to offspring

      let offspringX = this.x;
      let offspringZ = this.z;
      let offspringY = this.y; // Birds reproduce at their current altitude

      // For ground creatures, ensure offspring doesn'''t spawn in water.
      if (this.type !== "bird" && isPositionInWater(offspringX, offspringZ, waterBodiesData)) {
        // Attempt to find a nearby valid spawn point by nudging
        const offsets = [
          { dx: 0, dz: this.size }, { dx: 0, dz: -this.size },
          { dx: this.size, dz: 0 }, { dx: -this.size, dz: 0 },
          { dx: this.size, dz: this.size }, { dx: this.size, dz: -this.size },
          { dx: -this.size, dz: this.size }, { dx: -this.size, dz: -this.size },
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
          this.energy *= 2; // Refund energy if no valid spawn found
          return null;
        }
      }

      // Create new instance of the same class as the parent
      const offspring = new this.constructor(
        offspringX,
        offspringY,
        offspringZ,
        this.energy, // Offspring gets parent'''s remaining energy (which was halved)
        visionConesVisible // Pass current visibility state
      );

      // Apply mutations
      if (Math.random() < config.mutation.rate) {
        offspring.speed *= 1 + random(-config.mutation.maxFactor, config.mutation.maxFactor);
        offspring.speed = Math.max(0.5, offspring.speed); // Ensure speed doesn'''t become too low
      }
      if (Math.random() < config.mutation.rate) {
        offspring.sense *= 1 + random(-config.mutation.maxFactor, config.mutation.maxFactor);
        offspring.sense = Math.max(10, offspring.sense); // Ensure sense doesn'''t become too low

        // Update vision cone geometry if sense mutated
        if (offspring.visionCone && offspring.visionCone.geometry) {
          offspring.visionCone.geometry.dispose(); // Dispose old geometry
        }
        const newConeGeo = new THREE.ConeGeometry(
          offspring.sense * 0.4, offspring.sense, 16, 1, true
        );
        newConeGeo.translate(0, -offspring.sense / 2, 0);
        if (offspring.visionCone) {
          offspring.visionCone.geometry = newConeGeo;
        } else { // Fallback if vision cone wasn'''t created (shouldn'''t happen)
          const coneMat = new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.05, side: THREE.DoubleSide,
          });
          offspring.visionCone = new THREE.Mesh(newConeGeo, coneMat);
          offspring.visionCone.rotation.x = -Math.PI / 2;
          offspring.visionCone.visible = visionConesVisible;
          offspring.mesh.add(offspring.visionCone);
        }
      }
      return offspring;
    }
    return null; // Not enough energy to reproduce
  }

  dispose() {
    scene.remove(this.mesh); // Remove main mesh from scene
    // Recursively dispose of geometries and materials of children
    while (this.mesh.children.length > 0) {
      const child = this.mesh.children[0];
      this.mesh.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      // Handle nested children (e.g., parts of a complex model)
      while (child.children.length > 0) {
        const subChild = child.children[0];
        child.remove(subChild);
        if (subChild.geometry) subChild.geometry.dispose();
        if (subChild.material) subChild.material.dispose();
      }
    }
  }
}
```

**Key Properties and Methods:**

*   **`constructor(x, y, z, energy, speciesConfig, model, visionConesVisible)`**:
    *   Initializes basic properties: `id`, position (`x`, `y`, `z`), `energy`, velocity (`vx`, `vy`, `vz`), `speciesConfig` (e.g., `config.rabbit`), `size`, `speed`, `sense`.
    *   Creates a `THREE.Object3D` (`this.mesh`) to serve as the main container for the creature's 3D model and vision cone.
    *   Adds the provided `model` (from `modelFactory.js`) as a child of `this.mesh` and scales it.
    *   Creates a `THREE.ConeGeometry` for the `visionCone`, sized based on `this.sense`.
    *   Sets the `visionCone.visible` property based on the `visionConesVisible` parameter (controlled by the UI).
*   **`move()`**:
    *   Decreases energy by `energyDecay`.
    *   Normalizes the 2D velocity vector (`vx`, `vz`).
    *   Calculates the next position (`nextX`, `nextZ`).
    *   Handles boundary collisions with the world edges, reversing velocity and clamping position.
    *   **Water Collision**: If the creature is not a "bird" and water is enabled, it checks if `nextX`, `nextZ` is inside any `waterBodiesData`. If so, it reverses velocity and attempts to reposition the creature just outside the water.
    *   Updates `this.x` and `this.z`. `this.y` is typically handled by subclasses (like `Bird`).
    *   Updates `this.mesh.position`.
    *   Makes the creature's model `lookAt` its direction of movement. `vy` is included for birds to look up/down.
*   **`isTargetInSight(target)`**:
    *   Calculates the direction vector from the creature to the `target`.
    *   Checks if the distance to the target is within `this.sense`.
    *   Calculates the angle between the creature's forward direction and the direction to the target.
    *   Returns `true` if the angle is within `this.config.fieldOfView / 2`.
*   **`reproduce(visionConesVisible)`**:
    *   Checks if the creature has enough energy (`this.config.reproduceEnergy`).
    *   If so, halves its energy.
    *   Determines offspring spawn position. For ground creatures, it checks `isPositionInWater` and attempts to find a valid nearby spot if the initial position is in water. If no valid spot is found, reproduction is skipped, and energy is refunded.
    *   Creates a new instance of its own class (`new this.constructor(...)`) for the offspring, passing halved energy and current `visionConesVisible` state.
    *   Applies mutations to the offspring's `speed` and `sense` based on `config.mutation` parameters.
    *   If `sense` is mutated, it disposes of the old vision cone geometry and creates a new one with the updated size.
    *   Returns the `offspring` object (or `null` if reproduction failed).
*   **`dispose()`**:
    *   Removes `this.mesh` from the `scene`.
    *   Recursively removes children of `this.mesh` (like the body model and vision cone) and disposes of their geometries and materials to free up GPU resources.

---

## Rabbit Class (`js/classes/Rabbit.js`)

`Rabbit.js` extends the `Creature` class, defining the specific behavior for rabbits.

```javascript
import { Creature } from "./Creature.js";
import { config } from "../config.js";
import { createRabbitModel } from "../modelFactory.js";
import { distance2D, random } from "../utils.js";

export class Rabbit extends Creature {
  constructor(x, y, z, energy, visionConesVisible) {
    super(
      x,
      y, // Rabbits are ground creatures, y is typically 0
      z,
      energy,
      config.rabbit, // Pass rabbit-specific config
      createRabbitModel(config.rabbit.color), // Create rabbit model
      visionConesVisible // Set initial visibility of vision cone
    );
    this.type = "rabbit";
  }
  update(foodItems, allCreatures, visionConesVisible) {
    // allCreatures is not used by Rabbit but kept for consistent signature
    let closestFood = null,
      minDistance = Infinity;
    // Find the closest food item in sight
    for (const f of foodItems) {
      if (this.isTargetInSight(f)) {
        const d = distance2D(this, f);
        if (d < minDistance) {
          minDistance = d;
          closestFood = f;
        }
      }
    }
    // Move towards closest food or wander randomly
    if (closestFood) {
      this.vx = closestFood.x - this.x;
      this.vz = closestFood.z - this.z;
    } else {
      this.vx += random(-0.2, 0.2); // Random wander component
      this.vz += random(-0.2, 0.2);
    }
    this.move();

    let consumedFoodId = null;
    // Eat food if close enough
    if (closestFood && distance2D(this, closestFood) < this.size * 2) {
      this.energy += config.food.energy;
      consumedFoodId = closestFood.id; // Mark food for consumption
    }

    const offspring = this.reproduce(visionConesVisible);
    return { consumedFoodId, newOffspring: offspring }; // Return outcomes to main loop
  }
}
```

**Key Logic:**

*   **`constructor`**: Calls the `super` constructor with rabbit-specific parameters from `config.rabbit` and the `createRabbitModel`. Sets `this.type = "rabbit"`.
*   **`update(foodItems, allCreatures, visionConesVisible)`**:
    *   Searches for the `closestFood` item within its `sense` range and `fieldOfView`.
    *   If food is found, sets its velocity (`vx`, `vz`) to move towards it.
    *   Otherwise, adds a small random component to its velocity to wander.
    *   Calls `this.move()` to update its position.
    *   If it's close enough to the `closestFood` (distance < `this.size * 2`), it "eats" the food:
        *   Increases its `energy`.
        *   Sets `consumedFoodId` to the ID of the eaten food item (for `main.js` to handle removal).
    *   Calls `this.reproduce(visionConesVisible)` to attempt reproduction.
    *   Returns an object containing `consumedFoodId` and `newOffspring` (if any).

---

## Sheep Class (`js/classes/Sheep.js`)

`Sheep.js` extends `Creature` and implements flocking behavior (Boids algorithm) in addition to foraging.

```javascript
import * as THREE from "three";
import { Creature } from "./Creature.js";
import { config } from "../config.js";
import { createSheepModel } from "../modelFactory.js";
import { distance2D, random } from "../utils.js";

export class Sheep extends Creature {
  constructor(x, y, z, energy, visionConesVisible) {
    super(
      x,
      y, // Ground creature
      z,
      energy,
      config.sheep, // Pass sheep-specific config
      createSheepModel(), // Create sheep model
      visionConesVisible // Set initial visibility of vision cone
    );
    this.type = "sheep";
  }

  flock(allCreatures) {
    let separation = new THREE.Vector2();
    let alignment = new THREE.Vector2();
    let cohesion = new THREE.Vector2();
    let neighborCount = 0;

    // Calculate flocking vectors based on nearby sheep
    for (const other of allCreatures) {
      if (other !== this && other.type === "sheep") {
        let d = distance2D(this, other);
        if (d > 0 && d < this.config.flockRadius) { // Check if other sheep is a neighbor
          // Separation: steer away from close neighbors
          let diff = new THREE.Vector2(this.x - other.x, this.z - other.z);
          diff.normalize();
          diff.divideScalar(d); // Weight by distance (closer has stronger effect)
          separation.add(diff);

          // Alignment: steer towards average heading of neighbors
          alignment.add(new THREE.Vector2(other.vx, other.vz));

          // Cohesion: steer towards average position of neighbors
          cohesion.add(new THREE.Vector2(other.x, other.z));
          neighborCount++;
        }
      }
    }

    if (neighborCount > 0) {
      alignment.divideScalar(neighborCount); // Average alignment
      cohesion.divideScalar(neighborCount);   // Average position for cohesion
      cohesion.sub(new THREE.Vector2(this.x, this.z)); // Vector from current pos to center
    }
    return { separation, alignment, cohesion };
  }

  update(foodItems, allCreatures, visionConesVisible) {
    let closestFood = null,
      minDistance = Infinity;
    // Find closest food
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



    // Apply flocking forces, weighted by config parameters
    separation.multiplyScalar(this.config.separationWeight);
    alignment.multiplyScalar(this.config.alignmentWeight);
    cohesion.multiplyScalar(this.config.cohesionWeight);

    this.vx += separation.x + alignment.x + cohesion.x;
    this.vz += separation.y + alignment.y + cohesion.y; // Note: THREE.Vector2 uses x,y; here y maps to z

    // Add food-seeking behavior or random wander
    if (closestFood) {
      this.vx += (closestFood.x - this.x) * 0.05; // Gentle pull towards food
      this.vz += (closestFood.z - this.z) * 0.05;
    } else {
      this.vx += random(-0.2, 0.2);
      this.vz += random(-0.2, 0.2);
    }

    this.move();
    let consumedFoodId = null;
    if (closestFood && distance2D(this, closestFood) < this.size * 2) {
      this.energy += config.food.energy;
      consumedFoodId = closestFood.id;
    }

    const offspring = this.reproduce(visionConesVisible);
    return { consumedFoodId, newOffspring: offspring };
  }
}
```

**Key Logic:**

*   **`constructor`**: Similar to Rabbit, but uses `config.sheep` and `createSheepModel`. Sets `this.type = "sheep"`.
*   **`flock(allCreatures)`**:
    *   Implements the Boids flocking algorithm:
        *   **Separation**: Calculates a vector to steer away from very close flockmates to avoid crowding.
        *   **Alignment**: Calculates a vector to steer towards the average heading of nearby flockmates.
        *   **Cohesion**: Calculates a vector to steer towards the average position (center of mass) of nearby flockmates.
    *   Iterates through `allCreatures` to find other sheep within `this.config.flockRadius`.
    *   Returns the calculated `separation`, `alignment`, and `cohesion` vectors.
*   **`update(foodItems, allCreatures, visionConesVisible)`**:
    *   Finds `closestFood` similar to Rabbit.
    *   Calls `this.flock(allCreatures)` to get flocking vectors.
    *   Applies the flocking vectors (weighted by `config.sheep` parameters) to `this.vx` and `this.vz`.
    *   Adds a component to move towards `closestFood` or wanders randomly if no food is in sight.
    *   Calls `this.move()`.
    *   Handles eating food similar to Rabbit.
    *   Calls `this.reproduce(visionConesVisible)`.
    *   Returns `consumedFoodId` and `newOffspring`.

---

## Fox Class (`js/classes/Fox.js`)

`Fox.js` extends `Creature` and implements hunting behavior, targeting Rabbits and Sheep.

```javascript
import { Creature } from "./Creature.js";
import { config } from "../config.js";
import { createFoxModel } from "../modelFactory.js";
import { distance2D, random } from "../utils.js";

export class Fox extends Creature {
  constructor(x, y, z, energy, visionConesVisible) {
    super(
      x,
      y, // Ground creature
      z,
      energy,
      config.fox, // Pass fox-specific config
      createFoxModel(config.fox.color), // Create fox model
      visionConesVisible // Set initial visibility of vision cone
    );
    this.type = "fox";
  }
  update(foodItems, allCreatures, visionConesVisible) {
    // foodItems not used by Fox but kept for signature consistency
    let closestPrey = null,
      minDistance = Infinity;
    // Find the closest prey (Rabbit or Sheep, or landed Bird) in sight
    for (const c of allCreatures) {
      if (
        (c.type === "rabbit" ||
          c.type === "sheep" ||
          (c.type === "bird" && c.y < 5)) && // Hunt birds only if they are close to the ground
        c.id !== this.id && // Don'''t target self
        this.isTargetInSight(c)
      ) {
        const d = distance2D(this, c);
        if (d < minDistance) {
          minDistance = d;
          closestPrey = c;
        }
      }
    }

    // Move towards closest prey or wander randomly
    if (closestPrey) {
      this.vx = closestPrey.x - this.x;
      this.vz = closestPrey.z - this.z;
    } else {
      this.vx += random(-0.2, 0.2);
      this.vz += random(-0.2, 0.2);
    }

    this.move();
    let huntedCreatureId = null;
    // Hunt prey if close enough
    if (closestPrey && distance2D(this, closestPrey) < this.size * 2) {
      this.energy += this.config.preyEnergyBonus + closestPrey.energy * 0.5; // Gain energy from prey
      huntedCreatureId = closestPrey.id; // Mark prey for removal
    }

    const offspring = this.reproduce(visionConesVisible);
    return { huntedCreatureId, newOffspring: offspring }; // Return outcomes
  }
}
```

**Key Logic:**

*   **`constructor`**: Uses `config.fox` and `createFoxModel`. Sets `this.type = "fox"`.
*   **`update(foodItems, allCreatures, visionConesVisible)`**:
    *   Searches for `closestPrey` (Rabbit, Sheep, or landed Birds) within its `sense` and `fieldOfView`.
    *   If prey is found, sets velocity to move towards it.
    *   Otherwise, wanders randomly.
    *   Calls `this.move()`.
    *   If close enough to `closestPrey`:
        *   Increases `energy` by `this.config.preyEnergyBonus` plus half the prey's energy.
        *   Sets `huntedCreatureId` to the ID of the hunted creature.
    *   Calls `this.reproduce(visionConesVisible)`.
    *   Returns `huntedCreatureId` and `newOffspring`.

---

## Bird Class (`js/classes/Bird.js`)

`Bird.js` extends `Creature` and implements flying, cruising, diving, and hunting/foraging behavior.

```javascript
import { Creature } from "./Creature.js";
import { config } from "../config.js";
import { createBirdModel } from "../modelFactory.js";
import { distance2D, random } from "../utils.js";

export class Bird extends Creature {
  constructor(x, y, z, energy, visionConesVisible) {
    super(
      x,
      y, // Birds have a y-position (altitude)
      z,
      energy,
      config.bird, // Pass bird-specific config
      createBirdModel(config.bird.color), // Create bird model
      visionConesVisible // Set initial visibility of vision cone
    );
    this.type = "bird";
    this.state = "cruising"; // States: cruising, diving, eating
    this.target = null;      // Current target (food or creature)
    this.targetType = null;  // 'food' or 'creature'
  }

  update(foodItems, allCreatures, visionConesVisible) {
    let closestTarget = null;
    let minDistance = Infinity;
    let potentialTargetType = null;

    // Priority: Prey (Rabbits, Sheep)
    for (const c of allCreatures) {
      if (
        (c.type === "rabbit" || c.type === "sheep") && // Can only hunt these
        c.id !== this.id &&
        this.isTargetInSight(c)
      ) {
        const d = distance2D(this, c); // Horizontal distance for targeting
        if (d < minDistance) {
          minDistance = d;
          closestTarget = c;
          potentialTargetType = "creature";
        }
      }
    }
    // Secondary: Food (if no prey or food is closer)
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

    // State machine for bird behavior
    if (this.state === "cruising") {
      if (closestTarget) {
        this.state = "diving";
        this.target = closestTarget;
        this.targetType = potentialTargetType;
      }
      // Adjust vertical velocity to maintain cruise altitude
      this.vy = (config.bird.cruiseAltitude - this.y) * 0.05;
    } else if (this.state === "diving") {
      if (
        !this.target || this.target.energy <= 0 || // Target gone or dead
        (this.targetType === "creature" && !allCreatures.find((c) => c.id === this.target.id)) ||
        (this.targetType === "food" && !foodItems.find((f) => f.id === this.target.id))
      ) {
        this.state = "cruising"; // Abort dive
        this.target = null;
        this.targetType = null;
      } else {
        this.vy = (0 - this.y) * 0.1; // Dive towards ground (y=0)
        if (this.y < 1) { // Close to ground
          this.y = 0; // Land
          this.state = "eating";
        }
      }
    } else if (this.state === "eating") {
      // Check if target is still valid and in range
      if (
        !this.target || distance2D(this, this.target) > this.size * 2 ||
        (this.targetType === "creature" && !allCreatures.find((c) => c.id === this.target.id)) ||
        (this.targetType === "food" && !foodItems.find((f) => f.id === this.target.id))
      ) {
        this.state = "cruising"; // Target lost or out of range
        this.target = null;
        this.targetType = null;
      } else { // Consume target
        if (this.targetType === "creature") {
          this.energy += this.config.preyEnergyBonus + this.target.energy * 0.5;
          huntedCreatureId = this.target.id;
        } else if (this.targetType === "food") {
          this.energy += config.food.energy;
          consumedFoodId = this.target.id;
        }
        this.state = "cruising"; // Return to cruising after eating
        this.target = null;
        this.targetType = null;
      }
    }

    this.y += this.vy; // Update altitude
    this.y = Math.max(0, this.y); // Birds don'''t go underground

    // Horizontal movement
    if (this.target && this.state === "diving") {
      this.vx = this.target.x - this.x; // Steer towards target when diving
      this.vz = this.target.z - this.z;
    } else {
      this.vx += random(-0.2, 0.2); // Wander when cruising or eating (after landing)
      this.vz += random(-0.2, 0.2);
    }

    this.move(); // Applies vx, vz, updates mesh position and rotation (including pitch via vy)
    const offspring = this.reproduce(visionConesVisible);
    return { consumedFoodId, huntedCreatureId, newOffspring: offspring };
  }
}
```

**Key Logic:**

*   **`constructor`**: Uses `config.bird` and `createBirdModel`. Initializes `this.y` to `config.bird.cruiseAltitude`. Sets `this.state` to "cruising" and `this.target` to `null`.
*   **`update(foodItems, allCreatures, visionConesVisible)`**:
    *   Searches for `closestTarget`, prioritizing creatures (Rabbits, Sheep) over food items.
    *   Implements a state machine for behavior:
        *   **`cruising`**:
            *   If a `closestTarget` is found, changes state to "diving", sets `this.target` and `this.targetType`.
            *   Adjusts `this.vy` (vertical velocity) to maintain `config.bird.cruiseAltitude`.
        *   **`diving`**:
            *   If `this.target` is lost or invalid, aborts dive and returns to "cruising".
            *   Sets `this.vy` to move towards `y=0` (ground).
            *   If `this.y < 1` (close to ground), sets `this.y = 0` (lands) and changes state to "eating".
        *   **`eating`**:
            *   If `this.target` is lost or out of range, returns to "cruising".
            *   Otherwise, consumes the target:
                *   If `targetType` is "creature", gains energy, sets `huntedCreatureId`.
                *   If `targetType` is "food", gains energy, sets `consumedFoodId`.
            *   Returns to "cruising" state.
    *   Updates `this.y` based on `this.vy`, ensuring it doesn't go below 0.
    *   If diving, sets horizontal velocity (`vx`, `vz`) towards `this.target`. Otherwise, wanders randomly.
    *   Calls `this.move()`. The base `move()` method in `Creature.js` uses `this.vy` when calling `lookAt`, allowing the bird to pitch up or down.
    *   Calls `this.reproduce(visionConesVisible)`.
    *   Returns `consumedFoodId`, `huntedCreatureId`, and `newOffspring`.

---

## Food Class (`js/classes/Food.js`)

`Food.js` defines the properties and model for food items (vegetation) in the simulation.

```javascript
import { scene } from "../sceneSetup.js";
import { createVegetationModel } from "../modelFactory.js";

export class Food {
  constructor(x, z) {
    this.x = x;
    this.y = 0; // Food is always on the ground
    this.z = z;
    this.id = Math.random(); // Unique ID
    this.mesh = createVegetationModel(); // Get a tree or bush model
    this.mesh.position.set(this.x, 0, this.z); // Position at y=0
    scene.add(this.mesh);
  }
  dispose() {
    scene.remove(this.mesh);
    // Dispose of geometries and materials of children (trunk, leaves)
    while (this.mesh.children.length > 0) {
      const child = this.mesh.children[0];
      this.mesh.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
  }
}
```

**Key Logic:**

*   **`constructor(x, z)`**:
    *   Initializes `x`, `y` (always 0), `z`, and a random `id`.
    *   Calls `createVegetationModel()` from `modelFactory.js` to get a 3D model (randomly a tree or bush).
    *   Sets the model's position and adds it to the `scene`.
*   **`dispose()`**:
    *   Removes `this.mesh` from the `scene`.
    *   Iterates through children of `this.mesh` (e.g., trunk and leaves if it's a tree) and disposes of their geometries and materials to free resources.

---

This breakdown should provide a clear understanding of the EvoSim 3D simulation's JavaScript architecture and logic, incorporating all recent features and visual enhancements.
