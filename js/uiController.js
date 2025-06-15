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
  return true; // Default to true if not initialized, or consider config.world.visionConesInitiallyVisible
};
