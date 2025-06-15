# EvoSim 3D: A Virtual Ecosystem Evolution Simulation

## Overview

EvoSim 3D is an interactive, browser-based simulation that models a virtual ecosystem, serving as a digital petri dish where different species compete for resources, reproduce, and evolve over time. The simulation is rendered in 3D using **Three.js**, allowing users to observe the complex, emergent interactions from any angle. The entire project is self-contained in a single HTML file, requiring no complex setup or dependencies, making it an accessible tool for exploring principles of population dynamics and natural selection.

## Features

* **Diverse Species**: The ecosystem is populated with four distinct types of creatures, each with unique behavioral programming and 3D models that define their ecological niche:

    * **Rabbits (Herbivore)**: Small, agile herbivores that reproduce quickly. Their survival strategy is based on speed and rapid population growth, but they are vulnerable to all predators.

    * **Sheep (Herbivore)**: Larger, more robust herbivores that are slower than rabbits but more energy-efficient. They exhibit Boids-like flocking behavior, moving in cohesive herds for safety, which presents a different type of challenge for predators.

    * **Foxes (Carnivore)**: Ground-based predators that hunt both rabbits and sheep. Their success depends on their evolved speed and sensory range to outmaneuver their prey.

    * **Birds (Omnivore)**: Versatile predators that hold an aerial advantage, allowing them to spot and dive for prey (rabbits and sheep) from above. They also consume ground vegetation, creating a trade-off that makes them vulnerable to foxes when they descend to eat.

* **3D Visualization**: The world is rendered in a dynamic 3D environment, featuring distinct low-poly models for each creature type and procedurally generated vegetation (trees and bushes). Using **OrbitControls**, you can pan, zoom, and rotate the camera to get a close-up view of a hunt or a wide-angle perspective of the entire ecosystem.

* **Genetic Evolution**: Creatures don't just live and die; they evolve. Key traits like `speed` and `sensory range` are passed from parent to offspring with a configurable chance of mutation. This core mechanic allows you to witness natural selection in action, as selective pressures from predation and resource scarcity favor certain traits, causing the average characteristics of a species to shift over generations.

* **Interactive Controls**: A comprehensive control panel gives you the power to act as the architect of the ecosystem. You can:

    * Start, stop, and reset the simulation to run experiments or observe specific moments.

    * Adjust the initial population counts for all four species to set up different ecological scenarios, such as predator-prey imbalances or herbivore competition.

    * Control the rate of food (vegetation) regeneration, simulating environments with varying resource abundance.

    * Set the tick duration, allowing you to run the simulation at high speed to observe long-term trends or slow it down to analyze individual interactions.

    * Modify the mutation rate to influence the pace of evolution, from slow, gradual changes to rapid, sometimes unstable, adaptations.

    * Toggle the visibility of the sensory vision cones to declutter the view or to get a better understanding of how creatures perceive their world.

* **Real-time Statistics**: The UI provides a live dashboard for quantitative analysis, tracking the total population counts and the average evolved traits (speed and sense) for each species. This allows you to monitor the health and evolutionary trajectory of the ecosystem as it unfolds.

## How to Run

This project is a single, self-contained `index.html` file. No build process or local server is required, ensuring maximum portability.

1.  **Save the Code**: Copy the complete HTML code from the simulation file into a new file on your local machine and save it as `index.html`.

2.  **Open in Browser**: Open the `index.html` file in any modern web browser that supports WebGL (e.g., Chrome, Firefox, Edge, Safari).

The simulation will load and be ready to run. Use the controls on the right-hand panel to start the simulation and adjust its parameters to your liking.

## Adjustable Parameters

You can modify the ecosystem's dynamics using the following sliders and controls in the UI:

* **Tick Duration**: Controls the speed of the simulation by setting the time (in milliseconds) for each logic update. A lower number results in a faster simulation, ideal for observing long-term changes, while a higher number slows it down for detailed behavioral analysis.

* **Initial Creature Counts**: Set the starting number of Rabbits, Sheep, Foxes, and Birds. This is crucial for testing different scenarios, such as the effects of overpopulation, the resilience of a small predator group, or the competition between herbivore species.

* **Food Regen Rate**: Determines how quickly new vegetation appears in the world. A high rate creates an abundant, lush environment, while a low rate simulates scarcity and increases competition among herbivores.

* **Mutation Rate**: Adjusts the probability that an offspring will be born with slightly different genes (speed or sense) from its parents. Higher rates can lead to faster adaptation but may also produce less viable traits.

* **Show Vision Cones**: A checkbox to toggle the visibility of the transparent cones representing each creature's line of sight. This is useful for debugging AI behavior or for a cleaner cinematic view of the simulation.

## Future Development Ideas

This simulation provides a robust foundation for further exploration. Potential future features could include:

* **More Complex Genetics**: Introduce a wider range of inheritable traits beyond speed and sense, such as `size` (affecting energy needs and predator vulnerability), `energyEfficiency`, `reproductionCost`, or even `coloration` for camouflage against the environment.

* **Environmental Events**: Add dynamic events that challenge the ecosystem's stability, such as seasons that alter food regeneration rates, droughts that reduce resources, or disease outbreaks that target specific species based on their density.

* **Advanced AI**: Implement more sophisticated behaviors. Predators could learn to hunt in packs to take down larger prey, while herbivores could develop active flight responses, seeking the safety of the herd when a predator is spotted within their sensory range.

* **Data Visualization**: Integrate a charting library to create graphs that plot population changes and trait evolution over time. This would allow for a more analytical view of the ecosystem, showing predator-prey cycles and evolutionary arms races visually through data.