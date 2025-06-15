import * as THREE from "three";
// OrbitControls is imported in sceneSetup.js where it's used
import { config } from "./config.js";
import { random } from "./utils.js"; // distance2D might not be directly used in main.js anymore
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
let elapsedSinceTick = 0;

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

  setup();
}

// --- Core Simulation Functions ---
function setup() {
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
  for (let i = 0; i < config.rabbit.initialCount; i++) {
    creatures.push(
      new Rabbit(
        random(-halfW, halfD),
        0,
        random(-halfW, halfD),
        config.rabbit.initialEnergy,
        visionConesOn
      )
    );
  }
  for (let i = 0; i < config.sheep.initialCount; i++) {
    creatures.push(
      new Sheep(
        random(-halfW, halfD),
        0,
        random(-halfW, halfD),
        config.sheep.initialEnergy,
        visionConesOn
      )
    );
  }
  for (let i = 0; i < config.fox.initialCount; i++) {
    creatures.push(
      new Fox(
        random(-halfW, halfD),
        0,
        random(-halfW, halfD),
        config.fox.initialEnergy,
        visionConesOn
      )
    );
  }
  for (let i = 0; i < config.bird.initialCount; i++) {
    creatures.push(
      new Bird(
        random(-halfW, halfD),
        config.bird.cruiseAltitude,
        random(-halfW, halfD),
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
  food.push(new Food(random(-halfW, halfD), random(-halfW, halfD)));
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
