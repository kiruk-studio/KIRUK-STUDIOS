# Delta: pen-and-paper

## ADDED Requirements

### Requirement: Grease-pencil scene

A scribble sheet MUST be storable as a **scene**: a camera at a rest pose plus an ordered set of **layers**, where a layer is a flat sheet of strokes with a position in three dimensions. Every layer MUST declare a `facing`:

- `plane` — the layer keeps its own orientation and turns with the world when the camera moves.
- `billboard` — the layer cancels the camera and stays face-on to the reader, at its own depth.
- `screen` — the layer is interface. It sits outside the scene entirely and MUST NOT move when the camera moves.

Strokes MUST remain the stored artifact: pressure samples rendered as vector outlines, never rasterised into the scene. Layers MUST be painted in depth order rather than document order, so that a non-ink layer can later be placed among them.

Existing v1 flat sheets MUST continue to render without edit, lifting into a single `billboard` layer. The dev writer MUST accept a v1 body and persist it as v2, so a sheet migrates the first time it is saved and loses nothing.

The drawing surface MUST be square to the pointer at the moment ink is laid down: choosing a layer's plane MUST align the camera to that plane first, so sheet units map one-to-one to pointer units and no stroke is recorded through an inverse projection.

#### Scenario: A plane layer turns and a billboard does not

- GIVEN a scene with a floor drawn on a `plane` layer and a figure on a `billboard` layer
- WHEN the reader turns the camera
- THEN the floor opens from a horizon line into a receding plane
- AND the figure stays face-on

#### Scenario: Interface does not orbit

- GIVEN a scene with a drawn menu strip on a `screen` layer
- WHEN the reader turns the camera
- THEN the menu strip does not move

#### Scenario: A v1 sheet still renders

- GIVEN a committed sheet at `version: 1` with strokes and no layers
- WHEN the page is built
- THEN every stroke renders at its original position
- AND no committed point is rewritten

#### Scenario: Ink is exact on a tilted plane

- GIVEN the founder selects a layer whose plane is the floor
- WHEN they pick that drawing plane and draw
- THEN the camera is square to the floor while the stroke is recorded
- AND the recorded points match the pointer path in sheet units

### Requirement: Scene motion answers to the reader

A published scene MUST NOT move on its own. The camera MAY be turned by direct manipulation — a pointer drag, or arrow keys when the stage is focused — and MUST stay where it is released. Idle rotation, scroll-coupled camera movement, and entrance animations on the scene are forbidden.

The rest pose MUST be rendered statically, so a reader with JavaScript unavailable sees the composed scene rather than an empty frame. Turning the camera MUST NOT re-render the strokes; it MUST be expressible as a change to the stage's camera values alone.

#### Scenario: Nothing moves unbidden

- GIVEN a reader lands on a page hosting a scene
- WHEN they do not touch it
- THEN the camera stays at the scene's rest pose indefinitely

#### Scenario: The scene survives without JavaScript

- GIVEN JavaScript is unavailable
- WHEN the page loads
- THEN every visible layer renders at the scene's rest pose
- AND the camera cannot be turned

#### Scenario: Keyboard reaches the camera

- GIVEN the stage has keyboard focus
- WHEN the reader presses an arrow key
- THEN the camera turns by a fixed step within its limits
