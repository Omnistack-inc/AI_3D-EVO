import * as THREE from "three";
// OrbitControls is imported in sceneSetup.js where it's used
import { config } from "./config.js";
import {
  random,
  isPositionInWater,
  areWaterBodiesOverlapping,
  mergeWaterBodies,
} from "./utils.js"; // Added new water body functions
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
  elapsedSinceTick = 0; // Reset the tick accumulator
  clock.getDelta(); // IMPORTANT: Call to consume the large delta accumulated during pause
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

    // First generate all water body data without creating meshes
    let tempWaterBodies = [];

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
      tempWaterBodies.push(singleWaterBodyData);
    }

    // Merge overlapping water bodies - continue until no more merges are possible
    let mergeOccurred;
    do {
      mergeOccurred = false;

      // Check each pair of water bodies for overlap
      for (let i = 0; i < tempWaterBodies.length; i++) {
        for (let j = i + 1; j < tempWaterBodies.length; j++) {
          if (
            areWaterBodiesOverlapping(tempWaterBodies[i], tempWaterBodies[j])
          ) {
            // Merge the two water bodies
            const mergedBody = mergeWaterBodies(
              tempWaterBodies[i],
              tempWaterBodies[j]
            );

            // Replace the first body with the merged one and remove the second body
            tempWaterBodies[i] = mergedBody;
            tempWaterBodies.splice(j, 1);

            mergeOccurred = true;
            break; // Exit the inner loop since we've modified the array
          }
        }
        if (mergeOccurred) break; // Exit the outer loop too
      }
    } while (mergeOccurred);

    // Now create meshes for our merged water bodies
    for (const waterBody of tempWaterBodies) {
      waterBodiesData.push(waterBody);

      const waterGeometry = new THREE.PlaneGeometry(
          waterBody.width,
          waterBody.depth
        ),
        waterMaterial = new THREE.MeshStandardMaterial({
          color: config.water.color,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
        });
      const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
      waterMesh.rotation.x = -Math.PI / 2;
      waterMesh.position.set(waterBody.x, 1, waterBody.z); // y slightly above ground - increased to 0.2
      scene.add(waterMesh);
      waterBodyMeshes.push(waterMesh);
    }

    // Merge overlapping water bodies
    for (let i = 0; i < waterBodiesData.length; i++) {
      for (let j = i + 1; j < waterBodiesData.length; j++) {
        if (areWaterBodiesOverlapping(waterBodiesData[i], waterBodiesData[j])) {
          mergeWaterBodies(waterBodiesData[i], waterBodiesData[j]);
          // Remove the merged body from the scene
          const meshToRemove = waterBodyMeshes[j];
          scene.remove(meshToRemove);
          meshToRemove.geometry.dispose();
          meshToRemove.material.dispose();
          waterBodyMeshes.splice(j, 1);
          j--; // Adjust index after removal
        }
      }
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
  init3D();
  initUI();
  setupEventListeners(
    startSimulation,
    stopSimulation,
    resetSimulation,
    () => simulationRunning,
    () => creatures
  );
  setup();
  animate();
});
