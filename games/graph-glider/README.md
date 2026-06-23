# Railway Builder

Railway Builder replaces the old Graph Glider slot. It is a straight-line graph puzzle game for the Sticks Tuition Game Lab.

## Run

From the project root:

```powershell
py -3 -m http.server 8087
```

Open:

```text
http://localhost:8087/games/graph-glider/
```

The Game Lab card at `maths-games.html` links to the same route.

## Structure

- `index.html` contains the game shell and controls.
- `railway-builder.js` contains:
  - reusable maths utilities
  - level data
  - SVG rendering
  - draggable point input
  - equation input
  - validation
  - train animation
- Shared visual styling is in `../../styles.css`.

## Existing Systems

The site is mostly static HTML/CSS/JS. The previous Graph Glider used inline SVG plus `site.js`.

Angle Architect uses Matter.js physics, but Railway Builder is a deterministic coordinate-graph puzzle. Collision and win/loss checks are mathematical rather than physical, so the prototype reuses the site's static-page structure, SVG rendering approach, snapping interaction pattern, and Game Lab routing instead of loading Matter.js unnecessarily.

## Add Levels

Add a new object to the `LEVELS` array in `railway-builder.js`.

Each level supports:

- `id`
- `title`
- `instruction`
- `objective`
- `bounds`
- `stations`
- `existingLines`
- `obstacles`
- `required`
- `allowedTools`
- `hint`
- `success`
- `startPoints` or `startEquation`
- `checks`

Example:

```js
{
  id: 9,
  title: "New route",
  instruction: "Connect A and B.",
  objective: "Build a track through both stations.",
  bounds: { xMin: -6, xMax: 6, yMin: -5, yMax: 7 },
  stations: [{ id: "A", name: "Ash", x: -2, y: 1 }, { id: "B", name: "Birch", x: 4, y: 4 }],
  required: ["A", "B"],
  allowedTools: ["points", "equation"],
  hint: "Use gradient = change in y / change in x.",
  success: "Route approved.",
  checks: [{ type: "passesStations", stations: ["A", "B"] }]
}
```

## Maths Utilities

`window.RailwayBuilderMath` exposes helpers for:

- gradient
- y-intercept
- equation from two points
- point-on-line checks
- parallel and perpendicular checks
- intersections
- midpoint
- distance
- equation parsing
- equation formatting

Fractions such as `1/2` and `-3/4` are supported in equation input.
