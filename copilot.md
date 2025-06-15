# Copilot & AI Instructions for EvoSim 3D Project

## 1. Project Goal & High-Level Overview

**Objective**: This project, "EvoSim 3D," is a self-contained, single-file HTML application that simulates a 3D virtual ecosystem. Its primary purpose is to model and visualize principles of population dynamics, evolution, and emergent behaviors (like flocking).

**Core Idea**: Creatures with inheritable traits (genes) like `speed` and `sense` are born, compete for resources, hunt, flee, and reproduce. Successful traits are passed on, allowing the user to observe natural selection in action. The entire simulation is configurable in real-time through a UI panel.

**Technology**: The project uses plain HTML, JavaScript (ES6 Modules), and CSS (Tailwind CSS via CDN). The 3D rendering is handled exclusively by the **Three.js** library, also loaded from a CDN. There is no backend, build step, or external dependencies beyond the CDN links.

---

## 2. Core Architecture & Key JavaScript Concepts

The entire logic is contained within a single `<script type="module">` tag in the HTML file.

### a. The `config` Object
- **Purpose**: This is the single source of truth for all tunable parameters of the simulation. It centralizes variables for initial population counts, species-specific attributes (color, speed, energy), and behavioral rules (flocking weights, mutation rates).
- **Necessity**: Any request to "change how a creature behaves" or "adjust a simulation parameter" should almost always start by modifying a value in this `config` object. The UI sliders directly update this object.

### b. The `animate()` Loop & Tick System
- **Objective**: To create a smooth visual animation while ensuring the simulation logic runs at a consistent, controllable speed, independent of the user's screen refresh rate.
- **Mechanism**:
    1.  `requestAnimationFrame(animate)` creates a continuous rendering loop for the 3D scene. This part is for visuals only.
    2.  A `THREE.Clock` is used to measure the real-world time elapsed since the last frame (`clock.getDelta()`).
    3.  This elapsed time is added to an accumulator, `elapsedSinceTick`.
    4.  When `elapsedSinceTick` exceeds the `config.simulation.tickDuration`, the core simulation logic (`creatures.forEach(c => c.update())`) is executed. This is called a "tick."
    5.  This allows the simulation to run faster or slower based on the `tickDuration` slider, and even run multiple ticks per frame if the rendering is fast and the duration is short.

### c. Class-Based Structure
The simulation is object-oriented, with classes defining the different entities.

- **`Creature` (Base Class)**: This is the master class for all living things. It handles universal properties and methods:
    - **Properties**: `id`, `x`, `y`, `z`, `energy`, velocity (`vx`, `vy`, `vz`), and all configuration data from the `config` object.
    - **`constructor()`**: Sets up the core properties and creates the 3D `Object3D` parent mesh, which holds both the visible model and the vision cone.
    - **`move()`**: Updates the creature's position based on its velocity and handles world boundary collisions. It also uses `lookAt()` to orient the 3D model in the direction of movement.
    - **`isTargetInSight()`**: Performs the geometric calculation to check if another object is within the creature's vision cone (both range and angle).
    - **`reproduce()`**: Handles asexual reproduction if energy levels are sufficient. This is where **mutation** occurs.
    - **`dispose()`**: Crucial for memory management. This method properly removes a creature's 3D assets (geometries, materials) from the scene to prevent memory leaks when it dies.

- **Species Classes (`Rabbit`, `Sheep`, `Fox`, `Bird`)**: These classes `extend` the base `Creature` class.
    - **`constructor()`**: Calls the parent `super()` constructor, passing in the specific species configuration and the appropriate 3D model creation function (e.g., `createRabbitModel()`).
    - **`update()`**: This is the "brain" of each species. It contains the unique decision-making logic for that species (e.g., finding food, hunting prey, flocking). It runs once per tick.

- **`Food`**: A simple class to manage vegetation. It contains its position and a reference to its 3D model.

---

## 3. Species Behavior Deep Dive

When modifying a creature's behavior, its `update()` method is the place to look.

- **`Rabbit`**: The simplest AI. It scans for the nearest food in its vision. If it sees food, it sets its velocity towards it. If not, it wanders randomly.
- **`Sheep`**: The most complex AI. Its movement is a combination of forces:
    1.  **Boids Flocking (`flock()` method)**: It calculates three vectors based on nearby sheep: `separation`, `alignment`, and `cohesion`.
    2.  **Food Seeking**: It also looks for the nearest food source.
    3.  **Combined Velocity**: The final velocity vector is a weighted sum of the flocking vectors and the food-seeking vector. This results in the herd moving together toward food.
- **`Fox`**: A straightforward predator. It scans for the nearest prey (`Rabbit`, `Sheep`, or grounded `Bird`). If it finds one, it moves to intercept. Otherwise, it wanders.
- **`Bird`**: An omnivore with a state machine (`cruising`, `diving`, `eating`).
    - It scans for both herbivores and vegetation.
    - If it finds a target while `cruising`, it enters the `diving` state.
    - In the `diving` state, its vertical velocity (`vy`) changes to move it toward the ground.
    - Once low enough, it enters the `eating` state to consume the target before returning to `cruising`.

---

## 4. How to Add a New Creature (Step-by-Step for AI)

If asked to "add a new animal," follow these exact steps:

1.  **Add to `config`**: Create a new configuration object for the species inside the main `config` object (e.g., `config.wolf`). Define all its attributes: `initialCount`, `color`, `size`, `speed`, `sense`, `energy`, etc.
2.  **Create a Model Function**: Add a new function, like `createWolfModel()`, that builds a simple 3D model using `THREE.Object3D` and basic geometries.
3.  **Create the Class**: Create a new class, `class Wolf extends Creature`.
    - In its `constructor`, call `super()` with the `config.wolf` object and the `createWolfModel()` function.
    - Define its `type` property (e.g., `this.type = 'wolf';`).
    - Implement the `update()` method with its unique logic (e.g., hunting behavior).
4.  **Add UI Elements**:
    - In the HTML, create a new "stat-card" `div` for the Wolf.
    - Add a new slider `div` for controlling the `initialCount`.
    - Create variables in the script to reference these new HTML elements.
5.  **Update `setup()`**: In the `setup()` function, add a `for` loop to spawn the initial population of the new creature, similar to the existing loops for other species.
6.  **Update `updateStats()`**: In the `updateStats()` function, add the new species to the `switch` statement to correctly calculate and display its statistics (count, speed, sense).