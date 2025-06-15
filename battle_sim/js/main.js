// Main JavaScript for the Battle Simulation
console.log("Battle Simulation script loaded.");

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();

// Audio Listener and Loader
const listener = new THREE.AudioListener();
camera.add(listener); // Add listener to the camera
const audioLoader = new THREE.AudioLoader();

// Function to resume AudioContext on user interaction
function resumeAudioContext() {
  if (listener.context.state === "suspended") {
    listener.context
      .resume()
      .then(() => {
        console.log("AudioContext resumed successfully.");
      })
      .catch((e) => {
        console.error("Error resuming AudioContext:", e);
      });
  }
  // Remove the event listeners once the context is running or an attempt was made
  document.removeEventListener("click", resumeAudioContext);
  document.removeEventListener("keydown", resumeAudioContext);
  document.removeEventListener("touchstart", resumeAudioContext);
}

// Add event listeners for the first user interaction
document.addEventListener("click", resumeAudioContext, { once: true });
document.addEventListener("keydown", resumeAudioContext, { once: true });
document.addEventListener("touchstart", resumeAudioContext, { once: true });

// Sound effects (placeholders - you'll need to provide actual sound files)
const sounds = {
  attackHit: null,
  attackMiss: null,
  gameOver: null,
  // Add more sounds as needed, e.g., gladiator movement, background music
};

function loadSound(soundName, path, volume = 0.5) {
  audioLoader.load(
    path,
    function (buffer) {
      const sound = new THREE.Audio(listener);
      sound.setBuffer(buffer);
      sound.setVolume(volume);
      sounds[soundName] = sound;
      console.log(`Sound loaded: ${soundName}`);
    },
    undefined,
    function (err) {
      console.error(`Error loading sound ${soundName}:`, err);
    }
  );
}

// Load sounds - replace with actual paths to your sound files
loadSound("attackHit", "sounds/26_sword_hit_1.wav");
loadSound("attackMiss", "sounds/27_sword_miss_1.wav");
loadSound("gameOver", "sounds/21_orc_damage_3.wav");

const sceneContainer = document.getElementById("scene-container");
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
sceneContainer.appendChild(renderer.domElement);

// Camera Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 5;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below the ground

// Basic lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Camera position
camera.position.z = 20; // Adjusted camera further
camera.position.y = 15;
camera.lookAt(0, 0, 0);

// Arena setup
function createArena(radius, segments) {
  const geometry = new THREE.CircleGeometry(radius, segments);
  const material = new THREE.MeshStandardMaterial({
    color: 0x996633,
    side: THREE.DoubleSide,
  }); // Brownish color for the ground
  const arena = new THREE.Mesh(geometry, material);
  arena.rotation.x = -Math.PI / 2; // Rotate to be flat on XZ plane
  arena.receiveShadow = true;
  scene.add(arena);
  return arena;
}

// Gladiator properties
// const gladiatorSpeed = 0.1; // Less relevant for turn-based, but can be used for move speed later
const attackDistance = 1.5; // Still relevant for determining if an attack is possible
// const attackDamage = 10; // Will be replaced by damage rolls

// D&D style stats
const BASE_AC = 10; // Base Armor Class
const ATTACK_BONUS = 3; // Bonus to attack rolls
const DAMAGE_DIE = 6; // e.g., a d6 for damage
const DAMAGE_BONUS = 1; // Bonus to damage

// Turn Management
let currentTurn = 0; // 0 for Gladiator 1, 1 for Gladiator 2
let roundNumber = 1;
let turnTimer = 0; // To add a slight delay between turns for visual pacing
const TURN_DELAY = 120; // 2 seconds at 60fps

// Animation Mixers for Gladiators
const mixers = []; // To store animation mixers for each gladiator

// Gladiator setup
function createGladiator(modelPath, initialPosition, name, onLoadCallback) {
  const loader = new THREE.GLTFLoader();
  const group = new THREE.Group(); // Create a group to hold the model and its properties
  group.name = name;

  loader.load(
    modelPath,
    function (gltf) {
      const model = gltf.scene;
      model.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
      model.traverse(function (node) {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      group.add(model); // Add the loaded model to our group

      // Store animations
      group.animations = gltf.animations;
      if (group.animations && group.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        mixers.push(mixer); // Store mixer for updating
        group.mixer = mixer;
        // Play a default animation, e.g., "Idle"
        const idleClip = THREE.AnimationClip.findByName(
          group.animations,
          "Idle"
        );
        if (idleClip) {
          const idleAction = group.mixer.clipAction(idleClip);
          idleAction.play();
        }
      }

      // Set initial properties after model is loaded
      group.position.set(initialPosition.x, 0, initialPosition.z); // Assuming model is placed at ground level
      group.health = 50;
      group.maxHealth = 50;
      group.armorClass = BASE_AC + 2;
      group.attackBonus = ATTACK_BONUS;
      group.damageDie = DAMAGE_DIE;
      group.damageBonus = DAMAGE_BONUS;
      group.actionTaken = false;

      scene.add(group);
      if (onLoadCallback) {
        onLoadCallback(group);
      }
    },
    undefined, // onProgress callback (optional)
    function (error) {
      console.error(`Error loading gladiator model ${name}:`, error);
      // Fallback to simple geometry if model fails to load
      const fallbackGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
      const fallbackMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
      });
      const fallbackBody = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
      fallbackBody.castShadow = true;
      fallbackBody.receiveShadow = true;
      group.add(fallbackBody); // Add fallback to the group

      // Set initial properties for fallback
      group.position.set(initialPosition.x, 1, initialPosition.z); // Adjust Y for simple shape
      group.health = 50;
      group.maxHealth = 50;
      group.armorClass = BASE_AC + 2;
      group.attackBonus = ATTACK_BONUS;
      group.damageDie = DAMAGE_DIE;
      group.damageBonus = DAMAGE_BONUS;
      group.actionTaken = false;

      scene.add(group);
      if (onLoadCallback) {
        onLoadCallback(group);
      }
    }
  );
  return group; // Return the group immediately (model will be added asynchronously)
}

// Create arena
const arenaRadius = 10;
const arena = createArena(arenaRadius, 64);

// Create gladiators - Updated to use model paths
// Placeholder paths - replace with your actual model paths
const gladiator1ModelPath = "models/gladiator1.gltf"; // Example path
const gladiator2ModelPath = "models/gladiator2.gltf"; // Example path

let gladiators = []; // Initialize as empty, will be populated by loader callbacks
let gladiatorsLoaded = 0;
const totalGladiatorsToLoad = 2;

function onGladiatorLoaded(gladiator) {
  gladiators.push(gladiator);
  gladiatorsLoaded++;
  if (gladiatorsLoaded === totalGladiatorsToLoad) {
    // Ensure gladiators are assigned to aiGladiator1 and aiGladiator2 if needed elsewhere
    // For simplicity, we'll assume the order they are pushed or you can sort by name
    aiGladiator1 = gladiators.find((g) => g.name === "Gladiator 1");
    aiGladiator2 = gladiators.find((g) => g.name === "Gladiator 2");

    if (!aiGladiator1 || !aiGladiator2) {
      console.error(
        "Failed to assign loaded gladiators to aiGladiator1 or aiGladiator2. Check names."
      );
      // Handle error, perhaps by using the fallback objects if they were created.
      // This might happen if the names in createGladiator don't match "Gladiator 1" / "Gladiator 2"
      // Or if loading failed and fallbacks were used but not correctly pushed/identified.
    } else {
      console.log("All gladiators loaded and assigned.");
    }

    updateHealthBars(); // Initialize health bars once gladiators are loaded
    console.log("--- Combat Begins! (Models Loaded) ---");
    if (gladiators.length > 0 && gladiators[currentTurn]) {
      console.log(
        `Round ${roundNumber}, ${gladiators[currentTurn].name}\'s Turn`
      );
    } else {
      console.log(
        "Error: Gladiators array not populated correctly for game start."
      );
    }
  }
}

// These will now be populated asynchronously
var aiGladiator1 = createGladiator(
  gladiator1ModelPath,
  { x: -3, z: 0 },
  "Gladiator 1",
  onGladiatorLoaded
);
var aiGladiator2 = createGladiator(
  gladiator2ModelPath,
  { x: 3, z: 0 },
  "Gladiator 2",
  onGladiatorLoaded
);

// UI Element References
const gladiator1HealthBarFill = document.getElementById("player-health-bar"); // Re-using player's health bar for AI 1
const gladiator2HealthBarFill = document.getElementById("ai-health-bar"); // Re-using AI's health bar for AI 2
const gameOverMessageElement = document.getElementById("game-over-message");
let gameOver = false;
let simulationPaused = true; // Start paused
let simulationStarted = false; // To track if the simulation has been started at least once

// Simulation Control Button References
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const resumeButton = document.getElementById("resumeButton");
const resetButton = document.getElementById("resetButton");

function updateButtonStates() {
  startButton.disabled = simulationStarted && !gameOver;
  pauseButton.disabled = !simulationStarted || simulationPaused || gameOver;
  resumeButton.disabled = !simulationStarted || !simulationPaused || gameOver;
  resetButton.disabled = !simulationStarted; // Enable reset once started
}

function initialSetup() {
  // Initial button states
  simulationPaused = true;
  simulationStarted = false;
  gameOver = false;
  currentTurn = 0;
  roundNumber = 1;
  turnTimer = 0;
  gladiatorsLoaded = 0; // Reset for model loading
  gladiators.forEach((g) => scene.remove(g)); // Remove existing models from scene
  gladiators = []; // Clear gladiators array
  mixers.length = 0; // Clear mixers array

  gameOverMessageElement.style.display = "none";
  gameOverMessageElement.textContent = "";

  // Re-create gladiators
  // Ensure aiGladiator1 and aiGladiator2 are re-scoped or handled if they are global
  // For simplicity, we re-declare them here if they are not truly global or if their state needs full reset.
  // If they are global and just need properties reset, adjust accordingly.
  aiGladiator1 = createGladiator(
    gladiator1ModelPath,
    { x: -3, z: 0 },
    "Gladiator 1",
    onGladiatorLoaded
  );
  aiGladiator2 = createGladiator(
    gladiator2ModelPath,
    { x: 3, z: 0 },
    "Gladiator 2",
    onGladiatorLoaded
  );
  // Note: onGladiatorLoaded will populate the `gladiators` array and `aiGladiator1`/`aiGladiator2` references again.

  console.log("Simulation reset to initial state.");
  updateButtonStates();
  // Health bars will be updated by onGladiatorLoaded -> updateHealthBars
}

startButton.addEventListener("click", () => {
  if (!simulationStarted) {
    simulationStarted = true;
    simulationPaused = false;
    console.log("Simulation started.");
    // The onGladiatorLoaded callback will handle the actual combat start messages
    // and initial turn logging once models are ready.
    // If models are already loaded from a previous run (and not reset), this might need adjustment.
    // For a clean start, ensure initialSetup or a similar reset logic is called.
    if (gladiatorsLoaded < totalGladiatorsToLoad) {
      console.log("Waiting for models to load before starting turns...");
    } else {
      // If models are already loaded (e.g. from a soft reset not involving model reload)
      // We can directly log the start of combat if not already done.
      if (gladiators.length > 0 && gladiators[currentTurn]) {
        console.log("--- Combat Begins! (Models Already Loaded) ---");
        console.log(
          `Round ${roundNumber}, ${gladiators[currentTurn].name}\'s Turn`
        );
      }
    }
  } else if (gameOver) {
    // If game was over, treat start as a reset
    console.log("Restarting simulation after game over.");
    initialSetup();
    simulationStarted = true; // Set to true after setup
    simulationPaused = false;
  }
  updateButtonStates();
});

pauseButton.addEventListener("click", () => {
  simulationPaused = true;
  console.log("Simulation paused.");
  updateButtonStates();
});

resumeButton.addEventListener("click", () => {
  simulationPaused = false;
  console.log("Simulation resumed.");
  // If turnTimer was active, it will continue. If it was 0, next turn will process.
  updateButtonStates();
});

resetButton.addEventListener("click", () => {
  console.log("Reset button clicked.");
  initialSetup();
  // Start button will need to be pressed again to begin the simulation logic.
});

// Keyboard input state
// const keyboard = {}; // No longer needed
// document.addEventListener("keydown", (event) => { // No longer needed
//   keyboard[event.key.toLowerCase()] = true;
// });
// document.addEventListener("keyup", (event) => { // No longer needed
//   keyboard[event.key.toLowerCase()] = false;
// });

// Helper function: Clamp gladiator position within arena (can still be used for initial placement or if movement is added)
function clampPositionToArena(gladiator) {
  const distanceFromCenter = Math.sqrt(
    gladiator.position.x * gladiator.position.x +
      gladiator.position.z * gladiator.position.z
  );
  if (distanceFromCenter > arenaRadius - 0.5) {
    // 0.5 is gladiator radius
    const angle = Math.atan2(gladiator.position.z, gladiator.position.x);
    gladiator.position.x = (arenaRadius - 0.5) * Math.cos(angle);
    gladiator.position.z = (arenaRadius - 0.5) * Math.sin(angle);
  }
}

// --- Turn-Based Combat Logic ---

// Dice rolling utility
function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

// Function to handle a single gladiator's turn
function processTurn(currentGladiator, opponent) {
  if (
    !currentGladiator ||
    !opponent ||
    currentGladiator.health <= 0 ||
    opponent.health <= 0 ||
    gameOver ||
    simulationPaused // Check if simulation is paused
  ) {
    return; // Combat ended or gladiator is defeated
  }

  console.log(
    `\n--- Round ${roundNumber}, ${currentGladiator.name}'s Turn ---`
  );

  // AI Decision Making (Simplified: always try to attack if in range, else move closer)
  const distanceToOpponent = currentGladiator.position.distanceTo(
    opponent.position
  );

  if (distanceToOpponent <= attackDistance) {
    // Attempt Attack Action
    console.log(
      `${currentGladiator.name} is in range and attempts to attack ${opponent.name}.`
    );
    const attackRoll = rollDie(20);
    const totalAttackRoll = attackRoll + currentGladiator.attackBonus;
    console.log(
      `${currentGladiator.name} rolls a d20: ${attackRoll} + bonus ${currentGladiator.attackBonus} = ${totalAttackRoll}`
    );

    if (totalAttackRoll >= opponent.armorClass) {
      console.log(
        `Hit! (Rolled ${totalAttackRoll} vs AC ${opponent.armorClass})`
      );
      if (sounds.attackHit && sounds.attackHit.isPlaying)
        sounds.attackHit.stop();
      if (sounds.attackHit) sounds.attackHit.play();

      // Play attack animation for currentGladiator
      if (currentGladiator.mixer && currentGladiator.animations) {
        const attackClip = THREE.AnimationClip.findByName(
          currentGladiator.animations,
          "Attack"
        );
        if (attackClip) {
          const attackAction = currentGladiator.mixer.clipAction(attackClip);
          attackAction.reset().play(); // Play once
          // Optional: switch back to idle after attack animation finishes
          setTimeout(() => {
            const idleClip = THREE.AnimationClip.findByName(
              currentGladiator.animations,
              "Idle"
            );
            if (idleClip) currentGladiator.mixer.clipAction(idleClip).play();
          }, attackClip.duration * 1000 * 0.8); // 0.8 to blend a bit earlier
        }
      }

      const damageRoll = rollDie(currentGladiator.damageDie);
      const totalDamage = damageRoll + currentGladiator.damageBonus;
      console.log(
        `${currentGladiator.name} deals ${damageRoll} + bonus ${currentGladiator.damageBonus} = ${totalDamage} damage.`
      );
      opponent.health -= totalDamage;
      updateHealthBars();

      if (opponent.health <= 0) {
        opponent.health = 0;
        updateHealthBars();
        console.log(`${opponent.name} has been defeated!`);
        scene.remove(opponent);
        displayGameOver(`${currentGladiator.name} wins!`);
        if (sounds.gameOver && sounds.gameOver.isPlaying)
          sounds.gameOver.stop();
        if (sounds.gameOver) sounds.gameOver.play();
      }
    } else {
      console.log(
        `Miss! (Rolled ${totalAttackRoll} vs AC ${opponent.armorClass})`
      );
      if (sounds.attackMiss && sounds.attackMiss.isPlaying)
        sounds.attackMiss.stop();
      if (sounds.attackMiss) sounds.attackMiss.play();
    }
  } else {
    // Move Action (Simplified: move directly towards opponent by a step)
    console.log(
      `${currentGladiator.name} is out of range and moves towards ${opponent.name}.`
    );
    const moveDirection = new THREE.Vector3()
      .subVectors(opponent.position, currentGladiator.position)
      .normalize();
    // Ensure gladiators don't occupy the exact same spot or get too close if not attacking
    const moveStep = Math.min(distanceToOpponent - attackDistance * 0.9, 1.0); // Move up to 1 unit, or just enough to get in range

    if (distanceToOpponent > attackDistance) {
      // Only move if actually out of range
      currentGladiator.position.add(
        moveDirection.multiplyScalar(moveStep > 0 ? moveStep : 0)
      ); // Avoid negative step
      currentGladiator.lookAt(opponent.position);
      clampPositionToArena(currentGladiator);
    } else {
      console.log(
        `${currentGladiator.name} is already in range, prepares to attack next turn if possible.`
      );
    }
  }

  currentGladiator.actionTaken = true; // Mark action as taken for this turn
  turnTimer = TURN_DELAY; // Set delay for next turn
}

// Main game loop for turn-based combat
function updateTurnBasedCombat() {
  if (gameOver || simulationPaused) return; // Also check simulationPaused here

  if (turnTimer > 0) {
    turnTimer--;
    return; // Wait for turn delay
  }

  // Ensure gladiators are loaded before processing turns
  if (gladiatorsLoaded < totalGladiatorsToLoad) {
    // console.log("Waiting for gladiators to load...");
    // Ensure buttons are in a sensible state while models load initially
    if (!simulationStarted) updateButtonStates();
    return;
  }

  // Ensure currentTurn is valid for the gladiators array
  if (
    currentTurn < 0 ||
    currentTurn >= gladiators.length ||
    !gladiators[currentTurn]
  ) {
    console.warn(
      "Invalid currentTurn or gladiator not found, resetting turn or waiting."
    );
    // Potentially reset currentTurn or handle error, for now, just skip
    if (gladiators.length > 0) currentTurn = 0; // Simple reset
    else return; // Still no gladiators
  }

  const activeGladiator = gladiators[currentTurn];
  const opponentGladiator = gladiators[(currentTurn + 1) % gladiators.length]; // Use gladiators.length

  if (!activeGladiator || !opponentGladiator) {
    console.warn(
      "Active or opponent gladiator is undefined. Waiting for models to load or error in logic."
    );
    return;
  }

  if (activeGladiator.health > 0 && !activeGladiator.actionTaken) {
    processTurn(activeGladiator, opponentGladiator);
  }

  // Check if turn should end
  if (activeGladiator.actionTaken || activeGladiator.health <= 0) {
    activeGladiator.actionTaken = false; // Reset for next round
    currentTurn = (currentTurn + 1) % gladiators.length;
    if (currentTurn === 0) {
      // Back to the first gladiator, new round
      roundNumber++;
      console.log(`\n=== Starting Round ${roundNumber} ===`);
    }
    // If the new current gladiator is defeated, skip their turn immediately
    if (gladiators[currentTurn].health <= 0 && !gameOver) {
      console.log(
        `${gladiators[currentTurn].name} is defeated, skipping turn.`
      );
      currentTurn = (currentTurn + 1) % gladiators.length;
      if (currentTurn === 0 && !gameOver) {
        // Check again if we wrapped around to a new round
        roundNumber++;
        console.log(
          `\n=== Starting Round ${roundNumber} (after skipping defeated) ===`
        );
      }
    }
  }
}

// Function to update health bars (adjust for maxHealth)
function updateHealthBars() {
  if (aiGladiator1 && gladiator1HealthBarFill) {
    const gladiator1HealthPercent = Math.max(
      0,
      (aiGladiator1.health / aiGladiator1.maxHealth) * 100
    );
    gladiator1HealthBarFill.style.width = gladiator1HealthPercent + "%";
  }
  if (aiGladiator2 && gladiator2HealthBarFill) {
    const gladiator2HealthPercent = Math.max(
      0,
      (aiGladiator2.health / aiGladiator2.maxHealth) * 100
    );
    gladiator2HealthBarFill.style.width = gladiator2HealthPercent + "%";
  }
}

// Function to display game over message
function displayGameOver(messageText) {
  if (gameOver) return; // Prevent multiple calls
  gameOver = true;
  simulationPaused = true; // Pause simulation on game over
  gameOverMessageElement.textContent = messageText;
  gameOverMessageElement.style.display = "block";
}

// Adjust light to cast shadows
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -arenaRadius;
directionalLight.shadow.camera.right = arenaRadius;
directionalLight.shadow.camera.top = arenaRadius;
directionalLight.shadow.camera.bottom = -arenaRadius;

// Enable shadows in the renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Animation loop (now primarily for rendering and triggering turn-based updates)
const clock = new THREE.Clock(); // Clock for animation updates

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta(); // Get time delta for animation mixers

  // Update Orbit Controls
  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

  // Update animation mixers
  for (const mixer of mixers) {
    mixer.update(delta);
  }

  if (!gameOver) {
    updateTurnBasedCombat(); // Call the turn-based update function
  }

  renderer.render(scene, camera);
}

animate();
// updateHealthBars(); // Moved to onGladiatorLoaded to ensure gladiators exist
// console.log("--- Combat Begins! ---"); // Moved to onGladiatorLoaded
// console.log(`Round ${roundNumber}, ${gladiators[currentTurn].name}\'s Turn`); // Moved

// Initial setup call when script loads
initialSetup();

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
});

// TODO: Implement combat logic and gladiator movement
