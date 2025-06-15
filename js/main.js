import * as THREE from "three";
// OrbitControls is imported in sceneSetup.js where it's used
import { config } from "./config.js";
import { random, isPositionInWater } from "./utils.js"; // Added isPositionInWater
import {
  init3D,
  scene,
  camera,
  renderer,
  controls,
  clock,
} from "./sceneSetup.js";
// Model creation functions are used by species classes, not directly in main.js for now
// import { createRabbitModel, createSheepModel, createFoxModel, createBirdModel, createVegetationModel } from './modelFactory.js';
import {
  updateStats,
  setupEventListeners,
  initUI,
  isVisionConesVisible,
} from "./uiController.js"; // Added isVisionConesVisible
// Creature class is used by species classes
// import { Creature } from './classes/Creature.js';
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
      waterMesh.position.set(waterX, 0.1, waterZ); // y slightly above ground
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

  if (simulationRunning) {
    elapsedSinceTick += clock.getDelta() * 1000;

    if (elapsedSinceTick > config.simulation.tickDuration) {
      const ticksToRun = Math.floor(
        elapsedSinceTick / config.simulation.tickDuration
      );
      const currentVisionConesVisible = isVisionConesVisible(); // Get vision cone state for this batch of ticks

      for (let i = 0; i < ticksToRun; i++) {
        time++;
        if (time % Math.floor(100 / config.food.regenRate) === 0) {
          spawnFood();
        }

        let newOffspringList = [];
        let consumedFoodIds = new Set();
        let huntedCreatureIds = new Set();

        // Update creatures and collect results
        creatures.forEach((c) => {
          if (c.energy > 0) {
            // Process only living creatures
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
        });

        // Add new offspring to the main list
        creatures.push(...newOffspringList);

        // Remove consumed food
        if (consumedFoodIds.size > 0) {
          const foodToRemove = food.filter((f) => consumedFoodIds.has(f.id));
          foodToRemove.forEach((f) => f.dispose());
          food = food.filter((f) => !consumedFoodIds.has(f.id));
        }

        // Identify all creatures to be removed (hunted or died from low energy)
        let allCreatureIdsToRemove = new Set(huntedCreatureIds);
        creatures.forEach((c) => {
          // If a creature was hunted, its energy might be set low by the predator, or it might have died anyway.
          // Add to removal list if energy is zero, or if it was specifically hunted.
          if (c.energy <= 0 && !allCreatureIdsToRemove.has(c.id)) {
            allCreatureIdsToRemove.add(c.id);
          }
        });

        // Dispose and filter creatures
        if (allCreatureIdsToRemove.size > 0) {
          const creaturesToDisposeAndRemove = creatures.filter((c) =>
            allCreatureIdsToRemove.has(c.id)
          );
          creaturesToDisposeAndRemove.forEach((c) => c.dispose());
          creatures = creatures.filter(
            (c) => !allCreatureIdsToRemove.has(c.id)
          );
        }
      }
      elapsedSinceTick %= config.simulation.tickDuration;
      updateStats(time, creatures, food); // Pass state to updateStats
    }
  }
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// --- Initialize ---
document.addEventListener("DOMContentLoaded", () => {
  init3D();
  initUI(); // Initializes UI elements and their default states
  // Pass callbacks and getters to setupEventListeners
  setupEventListeners(
    startSimulation,
    stopSimulation,
    resetSimulation,
    () => simulationRunning, // Getter for simulationRunning state
    () => creatures // Getter for creatures array
  );
  setup(); // Initial population
  animate();
});

// Comments about further refactoring for Creature.reproduce and species update methods
// to handle array modifications more cleanly are still relevant.
// The current changes address the circular dependency and vision cone initialization.
