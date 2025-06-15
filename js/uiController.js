import { config } from "./config.js";
// Removed imports from main.js: creatures, food, time, simulationRunning, startSimulation, stopSimulation, resetSimulation
import { scene, camera, renderer, container } from "./sceneSetup.js"; // scene, camera, renderer, container are needed for resize

// UI Elements
const timeElapsedEl = document.getElementById("time-elapsed");
const totalCreaturesEl = document.getElementById("total-creatures");
const foodCountEl = document.getElementById("food-count");
const rabbitCountEl = document.getElementById("rabbit-count");
const rabbitSpeedEl = document.getElementById("rabbit-speed");
const rabbitSenseEl = document.getElementById("rabbit-sense");
const sheepCountEl = document.getElementById("sheep-count");
const sheepSpeedEl = document.getElementById("sheep-speed");
const sheepSenseEl = document.getElementById("sheep-sense");
const foxCountEl = document.getElementById("fox-count");
const foxSpeedEl = document.getElementById("fox-speed");
const foxSenseEl = document.getElementById("fox-sense");
const birdCountEl = document.getElementById("bird-count");
const birdSpeedEl = document.getElementById("bird-speed");
const birdSenseEl = document.getElementById("bird-sense");

const tickDurationInput = document.getElementById("tick-duration");
const foodRegenRateInput = document.getElementById("food-regen-rate");
const mutationRateInput = document.getElementById("mutation-rate");
const rabbitStartCountInput = document.getElementById("rabbit-start-count");
const sheepStartCountInput = document.getElementById("sheep-start-count");
const foxStartCountInput = document.getElementById("fox-start-count");
const birdStartCountInput = document.getElementById("bird-start-count");
const toggleVisionConesInput = document.getElementById("toggle-vision-cones");
const waterBodiesCountInput = document.getElementById("water-bodies-count"); // New UI element

const tickDurationValueEl = document.getElementById("tick-duration-value");
const foodRegenValueEl = document.getElementById("food-regen-value");
const mutationRateValueEl = document.getElementById("mutation-rate-value");
const rabbitStartCountValueEl = document.getElementById(
  "rabbit-start-count-value"
);
const sheepStartCountValueEl = document.getElementById(
  "sheep-start-count-value"
);
const foxStartCountValueEl = document.getElementById("fox-start-count-value");
const birdStartCountValueEl = document.getElementById("bird-start-count-value");
const waterBodiesCountValueEl = document.getElementById(
  "water-bodies-count-value"
); // New UI element

const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const resetBtn = document.getElementById("reset-btn");

export function updateStats(time, creatures, food) {
  // Added parameters
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
  // Added parameters
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

export const isVisionConesVisible = () => toggleVisionConesInput.checked;
