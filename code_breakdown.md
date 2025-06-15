Of course. Here is a comprehensive breakdown of the JavaScript logic for the EvoSim 3D simulation, with complete code snippets and explanations for each requested part.

### Core `Creature` Class Methods

The `Creature` class is the foundation for all animals in the simulation. It contains the shared logic for movement, perception, reproduction, and memory management.

---

#### 1. `move()`

**Objective**: This method is responsible for updating a creature's position each tick based on its velocity and handling interactions with the world boundaries.

**Explanation**:
The `move()` method first applies a small energy decay, which represents the metabolic cost of living. It then normalizes the creature's velocity vector (`vx`, `vz`) to ensure that movement speed is consistent regardless of direction. The creature's position (`x`, `z`) is then updated by its velocity multiplied by its `speed` attribute. It checks if the creature has hit the edge of the world and, if so, inverts its velocity on that axis to simulate a bounce. Finally, and most importantly, it updates the position of the creature's 3D mesh and uses `lookAt()` to orient the model to face the direction it is moving.

```javascript
move() {
    // Objective: Update the creature's position and orientation in the 3D world.

    // 1. Energy Decay: Simulate the metabolic cost of existing and moving.
    this.energy -= this.config.energyDecay;
    
    // 2. Normalize Velocity: Ensure consistent speed regardless of direction.
    // A vector's magnitude (length) is calculated. If it's greater than zero,
    // dividing the vector's components by the magnitude results in a "unit vector" of length 1.
    const mag = Math.sqrt(this.vx**2 + this.vz**2);
    if (mag > 0) {
        this.vx /= mag;
        this.vz /= mag;
    }

    // 3. Update Position: The creature's logical position is updated based on its speed and direction.
    this.x += this.vx * this.speed;
    this.z += this.vz * this.speed;

    // 4. Boundary Collision: Prevent creatures from leaving the world.
    const halfWidth = config.world.width / 2;
    const halfDepth = config.world.depth / 2;
    if (this.x < -halfWidth || this.x > halfWidth) {
        this.vx *= -1; // Invert velocity to "bounce" off the wall.
        this.x = Math.max(-halfWidth, Math.min(this.x, halfWidth)); // Clamp position to stay within bounds.
    }
    if (this.z < -halfDepth || this.z > halfDepth) {
        this.vz *= -1;
        this.z = Math.max(-halfDepth, Math.min(this.z, halfDepth));
    }
    
    // 5. Update 3D Model: The position and rotation of the 3D mesh are updated to reflect the new state.
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.lookAt(new THREE.Vector3(this.x + this.vx, this.y + this.vy, this.z + this.vz));
}
```

---

#### 2. `isTargetInSight()`

**Objective**: Determine if another object (prey or food) is within the creature's forward-facing vision cone.

**Explanation**:
This is a critical function for perception. It first calculates the distance to the target. If the target is outside the creature's `sense` range, it immediately returns `false`. If the target is within range, it then performs a geometric calculation using the dot product concept (via `angleTo`) to find the angle between the creature's forward direction and the vector to the target. If this angle is less than half of the creature's `fieldOfView`, the target is considered "in sight."

```javascript
isTargetInSight(target) {
    // Objective: Check if a target object is within the creature's sensory cone.

    // 1. Get World Direction: Determine the "forward" direction of the creature in the 3D world.
    const creatureDirection = new THREE.Vector3();
    this.mesh.getWorldDirection(creatureDirection);

    // 2. Get Vector to Target: Calculate the vector pointing from the creature to the target.
    const toTarget = new THREE.Vector3(target.x - this.x, target.y - this.y, target.z - this.z);
    
    // 3. Distance Check: An early exit if the target is outside the maximum sensory range.
    const d = toTarget.length();
    if (d > this.sense || d === 0) return false;

    // 4. Angle Check: Determine if the target is within the field of view.
    toTarget.normalize();
    // 'angleTo' calculates the angle (in radians) between two vectors.
    const angle = creatureDirection.angleTo(toTarget);
    
    // The target is in sight if the angle is less than half of the total field of view.
    return angle < this.config.fieldOfView / 2;
}
```

---

#### 3. `reproduce()`

**Objective**: Handle asexual reproduction for a creature that has accumulated enough energy. This is where genetic evolution occurs.

**Explanation**:
The method first checks if the creature's `energy` has met or exceeded the `reproduceEnergy` threshold defined in its configuration. If it has, the parent's energy is halved. A new instance of the same species is created at the parent's location, starting with the other half of the energy. Then, the mutation logic is applied. For both `speed` and `sense`, there is a chance (based on `mutation.rate`) that the offspring's trait will be altered by a random factor (up to `mutation.maxFactor`), making it potentially better or worse than its parent. If the `sense` gene mutates, the offspring's 3D vision cone is regenerated to match its new sensory range.

```javascript
reproduce() {
    // Objective: Create an offspring if energy requirements are met, and apply genetic mutations.

    // 1. Energy Check: The creature can only reproduce if it has stored enough energy.
    if (this.energy >= this.config.reproduceEnergy) {
        
        // 2. Energy Split: The parent gives half of its energy to the new offspring.
        this.energy /= 2;
        const offspring = new this.constructor(this.x, this.y, this.z, this.energy);

        // 3. Genetic Mutation: There is a chance for the offspring's traits to mutate.
        if (Math.random() < config.mutation.rate) {
            // Speed mutation: The new speed is the parent's speed plus or minus a random percentage.
            offspring.speed *= (1 + random(-config.mutation.maxFactor, config.mutation.maxFactor));
            offspring.speed = Math.max(0.5, offspring.speed); // Clamp to a minimum speed.
        }
        if (Math.random() < config.mutation.rate) {
            // Sense mutation: Same logic as speed, affecting the sensory range.
            offspring.sense *= (1 + random(-config.mutation.maxFactor, config.mutation.maxFactor));
            offspring.sense = Math.max(10, offspring.sense); // Clamp to a minimum sense range.
            
            // If sense mutates, the 3D vision cone model must be rebuilt to match the new size.
            offspring.visionCone.geometry.dispose(); // Free memory of the old geometry.
            const newConeGeo = new THREE.ConeGeometry(offspring.sense * 0.4, offspring.sense, 16, 1, true);
            newConeGeo.translate(0, -offspring.sense / 2, 0); 
            offspring.visionCone.geometry = newConeGeo;
        }
        
        // Add the new offspring to the global list of creatures.
        creatures.push(offspring);
    }
}
```

### Species-Specific Logic

Each species extends the base `Creature` class and overrides the `update()` method to define its unique behavior.

#### 1. `Rabbit` Class

**Behavior**: A simple herbivore that wanders randomly until it sees food, then moves directly toward it.

```javascript
class Rabbit extends Creature {
    constructor(x, y, z, energy) { 
        // Calls the parent constructor with its specific configuration and model.
        super(x, y, z, energy, config.rabbit, createRabbitModel(config.rabbit.color)); 
        this.type = 'rabbit'; 
    }
    
    // This method is the "brain" of the rabbit, called once per tick.
    update() {
        let closestFood = null;
        let minDistance = Infinity;

        // Find the nearest visible food source.
        for (const f of food) {
            if (this.isTargetInSight(f)) {
                const d = distance2D(this, f);
                if (d < minDistance) {
                    minDistance = d;
                    closestFood = f;
                }
            }
        }

        // Set velocity based on whether food was found.
        if (closestFood) {
            this.vx = (closestFood.x - this.x);
            this.vz = (closestFood.z - this.z);
        } else {
            // Wander randomly if no food is seen.
            this.vx += random(-0.2, 0.2); 
            this.vz += random(-0.2, 0.2);
        }

        // Execute movement, eat if possible, and check for reproduction.
        this.move();
        if (closestFood && distance2D(this, closestFood) < this.size * 2) {
            this.energy += config.food.energy;
            closestFood.dispose();
            food = food.filter(f => f.id !== closestFood.id);
        }
        this.reproduce();
    }
}
```

#### 2. `Sheep` Class

**Behavior**: A more complex herbivore that exhibits Boids-like flocking behavior. Its movement is a weighted combination of seeking food and staying with the herd.

```javascript
class Sheep extends Creature {
    constructor(x, y, z, energy) { 
        super(x, y, z, energy, config.sheep, createSheepModel()); 
        this.type = 'sheep'; 
    }
    
    // Boids flocking algorithm implementation.
    flock() {
        let separation = new THREE.Vector2(); // Vector to steer away from close flockmates.
        let alignment = new THREE.Vector2();  // Vector to align with the average direction of flockmates.
        let cohesion = new THREE.Vector2();    // Vector to steer towards the center of the flock.
        let neighborCount = 0;

        for(const other of creatures) {
            if (other !== this && other.type === 'sheep') {
                let d = distance2D(this, other);
                // Check if the other sheep is a neighbor within the flocking radius.
                if (d > 0 && d < this.config.flockRadius) {
                    // Separation: Calculate vector pointing away from the neighbor.
                    let diff = new THREE.Vector2(this.x - other.x, this.z - other.z);
                    diff.normalize();
                    diff.divideScalar(d); // Weight by distance (closer sheep have a stronger effect).
                    separation.add(diff);
                    
                    // Alignment: Sum up neighbor velocities.
                    alignment.add(new THREE.Vector2(other.vx, other.vz));

                    // Cohesion: Sum up neighbor positions.
                    cohesion.add(new THREE.Vector2(other.x, other.z));
                    
                    neighborCount++;
                }
            }
        }

        if (neighborCount > 0) {
            // Average the alignment and cohesion vectors.
            alignment.divideScalar(neighborCount);
            cohesion.divideScalar(neighborCount);
            
            // Calculate the vector needed to steer towards the center of mass.
            cohesion.sub(new THREE.Vector2(this.x, this.z));
        }
        return { separation, alignment, cohesion };
    }

    // Sheep's main update combines flocking behavior with food-seeking.
    update() {
        let closestFood = null;
        let minDistance = Infinity;

        for (const f of food) {
            if (this.isTargetInSight(f)) {
               const d = distance2D(this, f);
               if (d < minDistance) {
                   minDistance = d;
                   closestFood = f;
               }
            }
        }

        const { separation, alignment, cohesion } = this.flock();
        
        // Apply weights from the config to balance the flocking forces.
        separation.multiplyScalar(this.config.separationWeight);
        alignment.multiplyScalar(this.config.alignmentWeight);
        cohesion.multiplyScalar(this.config.cohesionWeight);

        // Combine all forces to determine the new velocity.
        this.vx += separation.x + alignment.x + cohesion.x;
        this.vz += separation.y + alignment.y + cohesion.y;
        
        // The drive for food is also added to the final velocity calculation.
        if (closestFood) {
            this.vx += (closestFood.x - this.x) * 0.05;
            this.vz += (closestFood.z - this.z) * 0.05;
        } else {
            // If no food is seen, add a small random vector to wander.
            this.vx += random(-0.2, 0.2); 
            this.vz += random(-0.2, 0.2);
        }

        this.move();
        if (closestFood && distance2D(this, closestFood) < this.size * 2) {
            this.energy += config.food.energy;
            closestFood.dispose();
            food = food.filter(f => f.id !== closestFood.id);
        }
        this.reproduce();
    }
}
```

#### 3. `Fox` Class

**Behavior**: A simple predator that hunts the nearest visible herbivore (rabbits or sheep) or grounded bird.

```javascript
class Fox extends Creature {
    constructor(x, y, z, energy) { 
        super(x, y, z, energy, config.fox, createFoxModel(config.fox.color));
        this.type = 'fox'; 
    }
    update() {
        let closestPrey = null;
        let minDistance = Infinity;

        // Scan for valid prey.
        for (const c of creatures) {
            // A target is valid if it's a rabbit, sheep, or a bird that is low to the ground.
            if ((c.type === 'rabbit' || c.type === 'sheep' || (c.type === 'bird' && c.y < 5)) && this.isTargetInSight(c)) {
                 const d = distance2D(this, c);
                 if (d < minDistance) {
                     minDistance = d;
                     closestPrey = c;
                 }
            }
        }
        
        // Set velocity towards prey or wander.
        if (closestPrey) {
             this.vx = (closestPrey.x - this.x);
             this.vz = (closestPrey.z - this.z);
        } else {
             this.vx += random(-0.2, 0.2); 
             this.vz += random(-0.2, 0.2);
        }

        this.move();
        
        // If close enough to prey, consume it.
        if (closestPrey && distance2D(this, closestPrey) < this.size * 2) {
            // Gain energy from the prey.
            this.energy += this.config.preyEnergyBonus + closestPrey.energy * 0.5;
            // Remove the prey from the simulation.
            closestPrey.dispose();
            creatures = creatures.filter(c => c.id !== closestPrey.id);
        }
        this.reproduce();
    }
}
```

#### 4. `Bird` Class

**Behavior**: An omnivore with a state machine. It cruises at a high altitude, dives for prey or food, eats, and then returns to cruising altitude.

```javascript
class Bird extends Creature {
    constructor(x, y, z, energy) {
        super(x, y, z, energy, config.bird, createBirdModel(config.bird.color));
        this.type = 'bird';
        // The state determines the bird's current behavior.
        this.state = 'cruising'; // Can be 'cruising', 'diving', or 'eating'.
        this.target = null;
    }

    update() {
        let closestTarget = null;
        let minDistance = Infinity;

        // Birds are omnivores: they look for rabbits, sheep, and vegetation.
        for (const c of creatures) {
            if ((c.type === 'rabbit' || c.type === 'sheep') && this.isTargetInSight(c)) {
                const d = distance2D(this, c);
                if (d < minDistance) {
                    minDistance = d;
                    closestTarget = c;
                }
            }
        }
         for (const f of food) {
            if (this.isTargetInSight(f)) {
               const d = distance2D(this, f);
               if (d < minDistance) {
                   minDistance = d;
                   closestTarget = f;
               }
            }
        }

        // --- Bird State Machine ---
        if (this.state === 'cruising') {
            if(closestTarget) { // If a target is spotted, start diving.
                this.state = 'diving';
                this.target = closestTarget;
            }
            // Gently adjust altitude towards the cruising height.
            this.vy = (config.bird.cruiseAltitude - this.y) * 0.05;
        } else if (this.state === 'diving') {
            // If the target is gone or dead, abort the dive.
            if (!this.target || this.target.energy <= 0 || (!creatures.includes(this.target) && !food.includes(this.target))) {
                this.state = 'cruising';
                this.target = null;
            } else {
                // Adjust vertical velocity to move towards the ground.
                this.vy = (0 - this.y) * 0.1; 
                // Transition to eating state when close to the ground.
                if(this.y < 5) {
                    this.state = 'eating';
                }
            }
        } else if (this.state === 'eating') {
            // If the target moved away, abort eating.
            if(!this.target || distance2D(this, this.target) > this.size * 2) {
                this.state = 'cruising';
                this.target = null;
            } else {
                // Check if the target is a creature or food to get the correct energy bonus.
                if (this.target.type) { // It's a creature.
                    this.energy += this.config.preyEnergyBonus + this.target.energy * 0.5;
                    creatures = creatures.filter(c => c.id !== this.target.id);
                } else { // It's food.
                    this.energy += config.food.energy;
                    food = food.filter(f => f.id !== this.target.id);
                }
                this.target.dispose();
                this.state = 'cruising';
                this.target = null;
            }
        }
        
        // Update vertical position and then call the main move method.
        this.y += this.vy;
        
        if (this.target) {
            this.vx = (this.target.x - this.x);
            this.vz = (this.target.z - this.z);
        } else {
            this.vx += random(-0.2, 0.2); 
            this.vz += random(-0.2, 0.2);
        }
        
        this.move();
        this.reproduce();
    }
}
```

#### 5. `Food` Class

**Objective**: A simple class to manage each piece of vegetation in the environment.

```javascript
class Food {
     constructor(x, z) {
        this.x = x; this.y = 0; this.z = z;
        this.id = Math.random();
        // Each food object gets its own procedurally generated 3D model.
        this.mesh = createVegetationModel();
        this.mesh.position.set(this.x, 0, this.z);
        scene.add(this.mesh);
     }
     // Cleanly remove the 3D model from the scene.
     dispose() {
        scene.remove(this.mesh);
        while(this.mesh.children.length > 0){ 
            const child = this.mesh.children[0];
            this.mesh.remove(child);
            if(child.geometry) child.geometry.dispose();
            if(child.material) child.material.dispose();
        }
     }
}
```

### Main Simulation Functions

These functions control the overall flow and state of the ecosystem.

#### 1. `setup()`

**Objective**: Initialize or reset the simulation to its starting state based on the current parameters in the `config` object.

```javascript
function setup() {
    // 1. Clean up old simulation objects to prevent memory leaks.
    creatures.forEach(c => c.dispose());
    food.forEach(f => f.dispose());

    // 2. Reset state variables.
    time = 0;
    creatures = [];
    food = [];
    const halfW = config.world.width / 2;
    const halfD = config.world.depth / 2;

    // 3. Spawn initial populations based on config values.
    for (let i = 0; i < config.food.initialCount; i++) { spawnFood(); }
    for (let i = 0; i < config.rabbit.initialCount; i++) {
        creatures.push(new Rabbit(random(-halfW, halfD), 0, random(-halfW, halfD), config.rabbit.initialEnergy));
    }
    for (let i = 0; i < config.sheep.initialCount; i++) {
        creatures.push(new Sheep(random(-halfW, halfD), 0, random(-halfW, halfD), config.sheep.initialEnergy));
    }
    for (let i = 0; i < config.fox.initialCount; i++) {
        creatures.push(new Fox(random(-halfW, halfD), 0, random(-halfW, halfD), config.fox.initialEnergy));
    }
    for (let i = 0; i < config.bird.initialCount; i++) {
        creatures.push(new Bird(random(-halfW, halfD), config.bird.cruiseAltitude, random(-halfW, halfD), config.bird.initialEnergy));
    }

    // 4. Update the UI to reflect the new state.
    updateStats();
}
```

#### 2. `spawnFood()`

**Objective**: Create a single new piece of vegetation at a random location.

```javascript
function spawnFood() {
     const halfW = config.world.width / 2;
     const halfD = config.world.depth / 2;
     food.push(new Food(random(-halfW, halfD), random(-halfW, halfD)));
}
```

#### 3. `animate()`

**Objective**: The main animation loop. It handles rendering the 3D scene and triggering simulation ticks at the correct rate.

```javascript
function animate() {
    // Schedule the next frame for a smooth animation loop.
    requestAnimationFrame(animate);
    // Update camera controls for user interaction.
    controls.update();

    if (simulationRunning) {
        // Accumulate the real time that has passed since the last frame.
        elapsedSinceTick += clock.getDelta() * 1000; // Time in milliseconds.

        // Check if enough time has passed to run a simulation tick.
        if (elapsedSinceTick > config.simulation.tickDuration) {
            // It's possible for multiple ticks to occur in one frame if the simulation is fast or the frame rate is low.
            const ticksToRun = Math.floor(elapsedSinceTick / config.simulation.tickDuration);
            for(let i = 0; i < ticksToRun; i++) {
                time++;
                // Check if it's time to regenerate food.
                if (time % Math.floor(100 / config.food.regenRate) === 0) { spawnFood(); }
                
                // --- This is the core simulation logic update ---
                creatures.forEach(c => c.update());
                
                // --- Cleanup ---
                // Find all creatures that have run out of energy.
                const deadCreatures = creatures.filter(c => c.energy <= 0);
                // Properly dispose of their 3D models.
                deadCreatures.forEach(c => c.dispose());
                // Remove them from the main creatures array.
                creatures = creatures.filter(c => c.energy > 0);
            }
            elapsedSinceTick %= config.simulation.tickDuration; // Keep the remainder time for the next frame.
            updateStats(); // Update the UI panel.
        }
    } else {
        // If paused, reset the clock delta to avoid a large time jump on resume.
        clock.getDelta();
        elapsedSinceTick = 0;
    }
    
    // Render the 3D scene.
    renderer.render(scene, camera);
}
```

### UI Event Handling

This section connects the HTML controls to the simulation's logic.

```javascript
// --- Event Listeners ---
// These connect the UI elements (buttons, sliders) to their respective functions.

// Control buttons
startBtn.addEventListener('click', () => { if (!simulationRunning) { simulationRunning = true; startBtn.textContent = 'Running...'; startBtn.classList.add('opacity-50', 'cursor-not-allowed'); stopBtn.classList.remove('opacity-50', 'cursor-not-allowed'); } });
stopBtn.addEventListener('click', () => { if (simulationRunning) { simulationRunning = false; startBtn.textContent = 'Resume'; startBtn.classList.remove('opacity-50', 'cursor-not-allowed'); stopBtn.classList.add('opacity-50', 'cursor-not-allowed'); } });
resetBtn.addEventListener('click', () => { simulationRunning = false; startBtn.textContent = 'Start'; startBtn.classList.remove('opacity-50', 'cursor-not-allowed'); stopBtn.classList.add('opacity-50', 'cursor-not-allowed'); setup(); });

// Parameter Sliders & Checkbox
// Each slider updates the central 'config' object in real-time when its value changes.
tickDurationInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    config.simulation.tickDuration = value;
    tickDurationValueEl.textContent = value;
});

toggleVisionConesInput.addEventListener('change', (e) => {
    const isVisible = e.target.checked;
    creatures.forEach(c => {
        if (c.visionCone) {
            c.visionCone.visible = isVisible;
        }
    });
});

rabbitStartCountInput.addEventListener('input', (e) => { const value = parseInt(e.target.value); config.rabbit.initialCount = value; rabbitStartCountValueEl.textContent = value; });
sheepStartCountInput.addEventListener('input', (e) => { const value = parseInt(e.target.value); config.sheep.initialCount = value; sheepStartCountValueEl.textContent = value; });
foxStartCountInput.addEventListener('input', (e) => { const value = parseInt(e.target.value); config.fox.initialCount = value; foxStartCountValueEl.textContent = value; });
birdStartCountInput.addEventListener('input', (e) => { const value = parseInt(e.target.value); config.bird.initialCount = value; birdStartCountValueEl.textContent = value; });
foodRegenRateInput.addEventListener('input', (e) => { const value = parseInt(e.target.value); config.food.regenRate = value; foodRegenValueEl.textContent = value; });
mutationRateInput.addEventListener('input', (e) => { const value = parseFloat(e.target.value); config.mutation.rate = value; mutationRateValueEl.textContent = value.toFixed(2); });

// Handles responsive resizing of the 3D canvas.
window.addEventListener('resize', () => { 
    camera.aspect = container.clientWidth / container.clientHeight; 
    camera.updateProjectionMatrix(); 
    renderer.setSize(container.clientWidth, container.clientHeight); 
});
```
