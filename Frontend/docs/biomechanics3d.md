You are a senior Frontend Engineer and 3D Visualization Designer
specialized in React, Three.js, biomechanics, sports science,
and Health-Tech SaaS interfaces.

I am building CALISHEALTH, an AI-powered calisthenics coaching platform.

The current Admin page already contains a MediaPipe Pose landmark
configuration interface.

The current system has:
- 33 MediaPipe Pose landmarks
- Required / Optional landmark status
- Confidence threshold
- Landmark weight
- Anatomical region filters
- Interactive landmark configuration
- Existing right-side landmark configuration panel

I want to redesign and upgrade the current "Pose Skeleton"
visualization into a professional 3-level system.

IMPORTANT:

DO NOT implement Level 4 AI Movement Analysis yet.

Only implement the following 3 levels:

LEVEL 1 — 3D POSE SKELETON
LEVEL 2 — 3D BIOMECHANICS
LEVEL 3 — 3D MUSCLE HEATMAP

The three levels must be designed as one coherent system
and should share the same underlying data.

Do NOT break the existing functionality.

Do NOT hardcode landmark data if it already exists in the application.

Do NOT redesign the entire Admin dashboard.

Only redesign and improve the Pose/Biomechanics visualization area.

--------------------------------------------------
TECHNOLOGY
--------------------------------------------------

Use:

- React
- TypeScript
- Three.js
- React Three Fiber
- @react-three/drei

Use clean reusable components.

Recommended architecture:

<PoseVisualization />

<PoseScene />

<HumanBody />

<HumanSkeleton />

<PoseLandmark />

<BoneSegment />

<BiomechanicsOverlay />

<MuscleHeatmap />

<LandmarkTooltip />

<AnalysisPanel />

<PoseCameraControls />

<PoseLegend />

--------------------------------------------------
GLOBAL DESIGN DIRECTION
--------------------------------------------------

The design must feel like a premium:

AI Health-Tech
Sports Science
Biomechanics
Motion Analysis

platform.

It must NOT look like:

- a MediaPipe demo
- a Three.js tutorial
- a game
- a cartoon
- a generic 3D character
- a medical anatomy simulator
- an overly futuristic cyberpunk UI

Visual language:

- dark navy / charcoal background
- cyan / turquoise primary accent
- blue secondary accent
- subtle purple accent
- glassmorphism panels
- subtle technical grid
- soft ambient glow
- clean typography
- professional spacing
- minimal visual noise

The visual style should be consistent with the existing
CALISHEALTH Admin dashboard.

--------------------------------------------------
SYSTEM STRUCTURE
--------------------------------------------------

The visualization must support three modes:

[ Level 1: Skeleton ]

[ Level 2: Biomechanics ]

[ Level 3: Muscle Heatmap ]

Provide a clean segmented control or tab system.

Example:

Visualization

[ Skeleton ] [ Biomechanics ] [ Muscle Heatmap ]

Also provide:

[ Combined View ]

Combined View can display:

3D Body
+
Skeleton
+
Biomechanics
+
Heatmap

depending on the active configuration.

--------------------------------------------------
LEVEL 1 — 3D POSE SKELETON
--------------------------------------------------

Purpose:

Visualize the MediaPipe Pose landmarks
in a professional 3D environment.

The system must keep all existing 33 landmarks.

Do NOT replace the landmark data.

Each landmark should contain or use:

- landmark ID
- landmark name
- x
- y
- z
- confidence / visibility
- status
- weight

--------------------------------------------------
3D HUMAN REPRESENTATION
--------------------------------------------------

Replace the current flat 2D stick figure with
a clean 3D biomechanical human representation.

Use:

- simplified human body
- smooth body proportions
- semi-transparent body mesh
- smooth cylindrical bones
- rounded joints
- subtle anatomical proportions

The body should look like a:

"Biomechanical Digital Human"

rather than a realistic person.

Do not use an overly detailed human model.

--------------------------------------------------
LANDMARK DESIGN
--------------------------------------------------

Each MediaPipe landmark should be represented
by a 3D joint node.

Normal:

- small cyan sphere
- subtle glow
- thin outer ring

Hover:

- increase size
- stronger glow
- show tooltip

Selected:

- strong cyan highlight
- animated ring
- corresponding bone highlighted

Warning / low confidence:

- amber or red
- reduced opacity

Disabled:

- gray
- low opacity

--------------------------------------------------
BONE CONNECTIONS
--------------------------------------------------

Replace simple 2D lines with 3D cylindrical segments.

Each connection should:

- connect two landmarks
- automatically calculate direction
- automatically calculate distance
- rotate toward the target landmark
- update when landmarks move

States:

Normal:
subtle cyan/blue

Selected:
bright cyan

Warning:
amber

Low confidence:
red/orange

Disabled:
gray / low opacity

--------------------------------------------------
LANDMARK INTERACTION
--------------------------------------------------

Clicking a landmark must trigger:

onLandmarkSelect(landmarkId)

The existing configuration panel must update.

The relationship must be bidirectional:

3D landmark
        ↕
Configuration row

If the user clicks:

RIGHT_KNEE

the right configuration panel should highlight:

#26 RIGHT_KNEE

If the user clicks the configuration row,
the 3D RIGHT_KNEE must become highlighted.

--------------------------------------------------
TOOLTIP
--------------------------------------------------

Hover tooltip:

RIGHT KNEE
MediaPipe #26

Confidence
86%

Weight
1.5

Status
Required

Use @react-three/drei Html
or another lightweight 3D tooltip solution.

--------------------------------------------------
CAMERA
--------------------------------------------------

Implement:

- Orbit
- Zoom
- Pan
- Reset

Add camera presets:

[ Front ]
[ Side ]
[ Back ]
[ Reset ]

Use smooth transitions.

Default:

- front view
- slightly elevated
- centered human
- enough spacing around body

--------------------------------------------------
LEVEL 1 INFORMATION
--------------------------------------------------

Display small statistics:

33 LANDMARKS
12 REQUIRED
21 OPTIONAL

Also show:

● Tracking Active

The visualization should immediately communicate
that the system is tracking MediaPipe pose landmarks.

--------------------------------------------------
LEVEL 2 — 3D BIOMECHANICS
--------------------------------------------------

Purpose:

Move beyond simply showing where landmarks are.

The system should visualize biomechanical measurements
calculated from the existing landmarks.

Do NOT implement AI interpretation yet.

Only implement:

MEASUREMENT + VISUALIZATION.

--------------------------------------------------
BIOMECHANICAL METRICS
--------------------------------------------------

Support metrics such as:

- Joint Angle
- Segment Angle
- Body Alignment
- Symmetry
- Range of Motion
- Trunk Inclination
- Joint Position
- Distance between landmarks

Example:

RIGHT KNEE

Landmarks:

RIGHT_HIP
RIGHT_KNEE
RIGHT_ANKLE

Calculate:

Knee Angle

Example UI:

RIGHT KNEE

Angle
87°

Target
80°–100°

Alignment
92%

Symmetry
94%

--------------------------------------------------
ANGLE VISUALIZATION
--------------------------------------------------

When a joint is selected:

display a 3D angle arc.

Example:

HIP
 \
  \
   ● KNEE
  /
 /
ANKLE

Show:

87°

The angle visualization must exist
inside the 3D scene.

Use:

- arc
- small label
- highlighted landmarks
- highlighted segments

Do not clutter the scene.

--------------------------------------------------
BIOMECHANICAL OVERLAY
--------------------------------------------------

Add optional overlays:

- joint angle arcs
- alignment lines
- body center line
- symmetry line
- movement axis
- reference range

These should be toggleable.

Example:

Biomechanics

☑ Joint Angles
☑ Alignment
☐ Symmetry
☐ Reference Range

--------------------------------------------------
REFERENCE RANGE
--------------------------------------------------

Allow the UI to display:

Current:
87°

Expected:
80°–100°

State:

Within Range
Near Boundary
Outside Range

Use subtle visual indication.

Do NOT claim clinical accuracy.

This is a biomechanics visualization layer,
not a medical diagnosis system.

--------------------------------------------------
BIOMECHANICS PANEL
--------------------------------------------------

When a landmark or joint is selected:

show:

JOINT
RIGHT KNEE

Angle
87°

Target Range
80°–100°

Alignment
92%

Symmetry
94%

Confidence
86%

Status
Required

This panel should be connected
to the selected 3D joint.

--------------------------------------------------
LEVEL 3 — 3D MUSCLE HEATMAP
--------------------------------------------------

Purpose:

Visualize which muscle groups are relevant
to a particular exercise.

IMPORTANT SCIENTIFIC CONSTRAINT:

The system must NOT claim that MediaPipe directly
measures real muscle activation.

The visualization represents:

Expected Muscle Contribution
or
Muscle Relevance

based on the configured exercise-to-muscle mapping.

Use wording such as:

PRIMARY TARGET
SECONDARY
STABILIZER

rather than claiming:

"actual muscle activation"

--------------------------------------------------
BODY HEATMAP
--------------------------------------------------

Create a 3D human body mesh
capable of displaying muscle-region intensity.

Example regions:

Upper Body:

- Chest
- Shoulders
- Biceps
- Triceps
- Forearms

Core:

- Abs
- Obliques
- Lower Back

Lower Body:

- Glutes
- Quadriceps
- Hamstrings
- Calves

The exact muscle groups should remain configurable.

--------------------------------------------------
HEATMAP STATES
--------------------------------------------------

Each muscle group has:

- relevance score
- role
- region
- side
- exercise mapping

Example:

GLUTES

Relevance:
92%

Role:
PRIMARY

QUADRICEPS

Relevance:
86%

Role:
PRIMARY

HAMSTRINGS

Relevance:
72%

Role:
SECONDARY

CALVES

Relevance:
51%

Role:
STABILIZER

--------------------------------------------------
HEATMAP VISUALIZATION
--------------------------------------------------

Use intensity to represent relevance.

Low:
low visual intensity

Medium:
moderate intensity

High:
strong highlight

Very high:
strongest highlight

Do NOT depend only on color.

Also display:

- numeric score
- role
- muscle name

The heatmap should be subtle and professional.

Avoid aggressive glowing red human bodies.

--------------------------------------------------
MUSCLE SELECTION
--------------------------------------------------

Clicking a muscle region should:

1. Highlight the selected muscle.
2. Display muscle information.
3. Show associated joints.
4. Highlight related landmarks.
5. Highlight related biomechanical metrics.

Example:

User clicks:

QUADRICEPS

Then:

Quadriceps
86%
PRIMARY

Associated joints:

LEFT_KNEE
RIGHT_KNEE

Associated movement:

Knee Extension

The corresponding landmarks
should become highlighted in the skeleton.

--------------------------------------------------
BIDIRECTIONAL MAPPING
--------------------------------------------------

The system must support:

Landmark
    ↕
Joint
    ↕
Movement
    ↕
Muscle

Example:

RIGHT_KNEE

→ Knee Flexion / Extension

→ Quadriceps

→ PRIMARY TARGET

This relationship should be reflected
visually in the 3D interface.

--------------------------------------------------
HEATMAP LEGEND
--------------------------------------------------

Add a professional legend:

MUSCLE RELEVANCE

Low ─────────────── High

Also show role legend:

PRIMARY
SECONDARY
STABILIZER

The legend should be compact.

--------------------------------------------------
EXERCISE CONTEXT
--------------------------------------------------

The heatmap should be exercise-aware.

Example:

Selected Exercise:

SQUAT

Then display:

Primary:

Glutes
Quadriceps

Secondary:

Hamstrings

Stabilizer:

Core
Calves

The exercise must be passed as data.

Do NOT hardcode only Squat.

Example data structure:

exercise:
{
  id,
  name
}

muscles:
[
  {
    muscleId,
    relevanceScore,
    role
  }
]

--------------------------------------------------
LEVEL 3 COMBINED VIEW
--------------------------------------------------

The strongest visualization mode is:

3D BODY
+
SKELETON
+
MUSCLE HEATMAP

Example:

Semi-transparent body mesh
        +
highlighted muscle regions
        +
MediaPipe landmarks
        +
bone connections

The user should be able to visually understand:

where the body is
+
where the joints are
+
which muscles are relevant.

--------------------------------------------------
COMBINED VIEW
--------------------------------------------------

Add:

[ Skeleton ]
[ Biomechanics ]
[ Heatmap ]
[ Combined ]

Combined mode should be the default
for advanced visualization.

However, do not display every overlay
at maximum intensity simultaneously.

Use visual hierarchy.

Priority:

1. Selected landmark / muscle
2. Skeleton
3. Heatmap
4. Biomechanical overlays
5. Background environment

--------------------------------------------------
BODY REGION FILTER
--------------------------------------------------

Keep existing filters:

All
Upper Body & Arms
Back & Hips
Legs & Feet
Head & Face

The filter must affect:

- landmarks
- skeleton
- body mesh
- heatmap
- biomechanical overlays

Example:

Selecting:

Legs & Feet

should:

highlight legs
highlight relevant landmarks
highlight relevant muscles
dim unrelated body regions.

--------------------------------------------------
3D ENVIRONMENT
--------------------------------------------------

Use:

- dark navy background
- subtle floor grid
- soft ambient light
- directional light
- subtle rim light
- subtle technical environment

Do not use:

- dramatic cinematic lighting
- excessive neon
- large visual effects
- distracting particles

The visualization should look like
a professional biomechanics workstation.

--------------------------------------------------
ANIMATION
--------------------------------------------------

Use subtle animations:

- landmark pulse
- hover scale
- selection glow
- heatmap fade
- camera transition
- muscle highlight transition
- biomechanical overlay fade

Animation duration:

approximately 200–500ms.

Animations must feel smooth and professional.

--------------------------------------------------
PERFORMANCE
--------------------------------------------------

The visualization must support:

33 landmarks
multiple bone connections
3D body mesh
muscle regions
interactive camera
real-time selection

Optimize using:

- memoization
- reusable geometries
- reusable materials
- instanced meshes where appropriate
- avoid unnecessary React re-renders

Do not create new geometries/materials
on every render.

--------------------------------------------------
COMPONENT ARCHITECTURE
--------------------------------------------------

Create reusable components:

PoseVisualization
├── PoseScene
│   ├── HumanBody
│   ├── HumanSkeleton
│   │   ├── PoseLandmark
│   │   └── BoneSegment
│   │
│   ├── BiomechanicsOverlay
│   │   ├── JointAngleArc
│   │   ├── AlignmentLine
│   │   └── ReferenceRange
│   │
│   ├── MuscleHeatmap
│   │   └── MuscleRegion
│   │
│   ├── PoseLighting
│   └── PoseEnvironment
│
├── PoseCameraControls
├── PoseToolbar
├── PoseLegend
└── PoseDetailPanel

--------------------------------------------------
DATA CONTRACT
--------------------------------------------------

The visualization should receive data through props.

Example:

landmarks
connections
selectedLandmark
selectedMuscle
selectedRegion
selectedExercise

callbacks:

onLandmarkSelect
onLandmarkHover
onMuscleSelect
onRegionSelect
onExerciseChange

Biomechanics:

jointMetrics
angleMetrics
alignmentMetrics
symmetryMetrics

Heatmap:

muscles
muscleMappings
relevanceScore
role

Do not hardcode business logic inside
the Three.js visualization.

--------------------------------------------------
IMPORTANT ARCHITECTURE RULE
--------------------------------------------------

Separate:

1. Visualization

2. Biomechanics calculation

3. Exercise-muscle mapping

4. UI configuration

5. Backend data

Three.js should visualize the data.

It should NOT become the place where
business rules are hardcoded.

--------------------------------------------------
FINAL UX
--------------------------------------------------

The final result should communicate three levels
of understanding:

LEVEL 1

"Where is the body and where are the pose landmarks?"

LEVEL 2

"How is the body positioned and how are the joints moving?"

LEVEL 3

"Which muscles are relevant to this exercise?"

The final interface should feel like:

"CALISHEALTH AI BIOMECHANICS ENGINE"

rather than:

"MediaPipe Pose Viewer".

--------------------------------------------------
IMPLEMENTATION ORDER
--------------------------------------------------

Implement in this exact order:

STEP 1
Build Level 1:
3D Human + Skeleton + Landmark interaction.

STEP 2
Build Level 2:
Joint angles + biomechanics overlays.

STEP 3
Build Level 3:
Muscle heatmap + exercise-muscle mapping.

STEP 4
Integrate all three into Combined View.

STEP 5
Polish:
lighting
animation
camera
tooltips
responsive layout
performance

Do NOT implement Level 4 AI Movement Analysis.

Do NOT introduce AI-generated movement corrections yet.

The goal of this task is to build a strong,
professional 3-level visualization foundation
for the future CALISHEALTH AI Coaching system.