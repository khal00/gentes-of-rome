# Roman Atrium - Isometric Demo

A simple browser-based isometric game inspired by Ultima Online, set in a Roman Republic Atrium (c. 100 BC). It uses the Phaser 3 library to render an isometric tilemap. All graphics are generated programmatically using Phaser's Graphics API.

## Features

- **Isometric Engine:** Custom isometric projection and depth sorting.
- **Procedural Assets:** Floor, walls, water (impluvium), columns, and character generated in code.
- **Controls:** Arrow keys for movement mapped to visual directions.
- **Environment:** A 12x12 Roman Atrium layout.

## How to Run

Because modern browsers enforce strict security policies (CORS) when loading resources, it is best to run this game using a local web server.

### Using Python (Recommended)

If you have Python installed (available on most systems like Linux and macOS), run:

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

## Controls

- **Arrow Keys:** Move the character around the room.
  - **Up:** Move Visually Up (North)
  - **Down:** Move Visually Down (South)
  - **Left:** Move Visually Left (West)
  - **Right:** Move Visually Right (East)
