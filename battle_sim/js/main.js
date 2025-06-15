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

const sceneContainer = document.getElementById("scene-container");
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight); // Use container dimensions
sceneContainer.appendChild(renderer.domElement);

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

// Gladiator setup
function createGladiator(color, position, name) {
  const group = new THREE.Group();
  group.name = name;

  // Body (capsule or cylinder)
  const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Head (sphere)
  const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc }); // Lighter color for head
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.4; // Position head on top of the body
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  group.position.set(position.x, 1, position.z); // position.y is now position.z for XZ plane
  group.health = 50; // Adjusted health for D&D feel
  group.maxHealth = 50;
  // group.isAttacking = false; // Less relevant in turn-based in the same way
  // group.attackCooldown = 0; // Not needed for turn-based
  // group.maxAttackCooldown = 60; // Not needed

  // D&D Stats
  group.armorClass = BASE_AC + 2; // Example: Gladiator with some armor
  group.attackBonus = ATTACK_BONUS;
  group.damageDie = DAMAGE_DIE;
  group.damageBonus = DAMAGE_BONUS;
  group.actionTaken = false; // Has this gladiator taken its action this turn?

  scene.add(group);
  return group;
}

// Create arena
const arenaRadius = 10;
const arena = createArena(arenaRadius, 64);

// Create gladiators
const aiGladiator1 = createGladiator(0xff0000, { x: -3, z: 0 }, "Gladiator 1");
const aiGladiator2 = createGladiator(0x0000ff, { x: 3, z: 0 }, "Gladiator 2");
const gladiators = [aiGladiator1, aiGladiator2]; // Array for easier turn management

// UI Element References
const gladiator1HealthBarFill = document.getElementById("player-health-bar"); // Re-using player's health bar for AI 1
const gladiator2HealthBarFill = document.getElementById("ai-health-bar"); // Re-using AI's health bar for AI 2
const gameOverMessageElement = document.getElementById("game-over-message");
let gameOver = false;

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
  if (currentGladiator.health <= 0 || opponent.health <= 0 || gameOver) {
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
      }
    } else {
      console.log(
        `Miss! (Rolled ${totalAttackRoll} vs AC ${opponent.armorClass})`
      );
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
  if (gameOver) return;

  if (turnTimer > 0) {
    turnTimer--;
    return; // Wait for turn delay
  }

  const activeGladiator = gladiators[currentTurn];
  const opponentGladiator = gladiators[(currentTurn + 1) % 2];

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
function animate() {
  requestAnimationFrame(animate);

  if (!gameOver) {
    updateTurnBasedCombat(); // Call the turn-based update function
  }

  renderer.render(scene, camera);
}

animate();
updateHealthBars(); // Initialize health bars at the start
console.log("--- Combat Begins! ---");
console.log(`Round ${roundNumber}, ${gladiators[currentTurn].name}'s Turn`);

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
});

// TODO: Implement combat logic and gladiator movement
