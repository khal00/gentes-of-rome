# Roman Atrium - 3D Isometric Demo

A browser-based isometric RPG demo inspired by Ultima Online, set in a Roman Republic Atrium (c. 100 BC).

**This version uses Three.js (WebGL) to render a true 3D environment with an isometric camera, lighting, and shadows.**

## Features

- **3D Engine:** Uses Three.js for hardware-accelerated 3D graphics.
- **Isometric View:** Orthographic camera setup to mimic the classic 2.5D look of games like Ultima Online.
- **Lighting & Shadows:** Real-time directional lighting with soft shadows.
- **Procedural Environment:** A 12x12 Roman Atrium with stone floors, brick walls, marble columns, and a central water feature (Impluvium).
- **Controls:** Grid-based movement with arrow keys.
  - **Up:** Move "North" (Top-Left on screen)
  - **Down:** Move "South" (Bottom-Right on screen)
  - **Left:** Move "West" (Bottom-Left on screen)
  - **Right:** Move "East" (Top-Right on screen)

## How to Run

Because modern browsers enforce strict security policies (CORS) when loading resources (ES Modules), it is best to run this game using a local web server.

### Using Python (Recommended)

If you have Python installed, run:

```bash
# Python 3
python3 -m http.server 8000
```

Then open your browser and go to: [http://localhost:8000](http://localhost:8000)

### Using Node.js (npx)

If you have Node.js installed, run:

```bash
npx http-server .
```

Then open the URL shown in the terminal.
