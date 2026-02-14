const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a1a', // Darker background for contrast
    parent: 'game-container',
    pixelArt: true, // Essential for the UO look
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

// --- Helper: Draw Noise ---
function addNoise(graphics, width, height, density = 0.1, color = 0x000000, alpha = 0.1) {
    graphics.fillStyle(color, alpha);
    for (let i = 0; i < width * height * density; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        graphics.fillRect(x, y, 1, 1);
    }
}

// --- Helper: Draw Isometric Tile Shape ---
function drawIsoTile(graphics, color, border = null) {
    graphics.fillStyle(color);
    graphics.beginPath();
    graphics.moveTo(0, TILE_HEIGHT / 2);
    graphics.lineTo(TILE_WIDTH / 2, 0);
    graphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    graphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    graphics.closePath();
    graphics.fillPath();

    if (border !== null) {
        graphics.lineStyle(1, border);
        graphics.strokePath();
    }
}

function preload() {
    // --- Generate Floor Tile (Textured Stone) ---
    // UO floors often look like cobblestone or rough cut stone.
    const floorGraphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Base Color (Earth/Stone)
    const baseColor = 0x8c8c7e; // Muted grey-brown
    drawIsoTile(floorGraphics, baseColor, 0x5a5a50); // Darker border

    // Add "Cobblestone" texture
    floorGraphics.lineStyle(1, 0x6b6b5f, 0.6); // Grout color
    // Draw a grid pattern rotated to fit isometric view? No, just draw on the diamond.
    // Let's draw some random "stones".
    // Or just simple noise for grit.
    addNoise(floorGraphics, TILE_WIDTH, TILE_HEIGHT, 0.4, 0x333333, 0.1); // Dark noise
    addNoise(floorGraphics, TILE_WIDTH, TILE_HEIGHT, 0.2, 0xffffff, 0.1); // Light specs

    // Highlight top-left edge for depth
    floorGraphics.lineStyle(1, 0xaaaa99, 0.5);
    floorGraphics.beginPath();
    floorGraphics.moveTo(0, TILE_HEIGHT / 2);
    floorGraphics.lineTo(TILE_WIDTH / 2, 0);
    floorGraphics.strokePath();

    floorGraphics.generateTexture('floor', TILE_WIDTH, TILE_HEIGHT);


    // --- Generate Water Tile (Deep Blue with Ripples) ---
    const waterGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    const waterColor = 0x204070; // Deep UO water blue
    drawIsoTile(waterGraphics, waterColor);

    // Ripples (lighter blue lines)
    waterGraphics.lineStyle(1, 0x406090, 0.5);
    for(let i=0; i<5; i++) {
        const y = Math.random() * TILE_HEIGHT;
        const w = Math.random() * 20 + 10;
        const x = Math.random() * (TILE_WIDTH - w);
        waterGraphics.beginPath();
        waterGraphics.moveTo(x, y);
        waterGraphics.lineTo(x + w, y);
        waterGraphics.strokePath();
    }
    waterGraphics.generateTexture('water', TILE_WIDTH, TILE_HEIGHT);


    // --- Generate Wall Tile (Brick/Block Pattern) ---
    const w = TILE_WIDTH;
    const h = TILE_HEIGHT;
    const tallness = 64; // Taller walls look more imposing
    const totalH = h + tallness;

    const wallGraphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Function to draw a wall face with bricks
    const drawFace = (path, baseColor, shadeColor) => {
        // Draw base
        wallGraphics.fillStyle(baseColor);
        wallGraphics.beginPath();
        path.forEach((pt, i) => {
            if (i===0) wallGraphics.moveTo(pt.x, pt.y);
            else wallGraphics.lineTo(pt.x, pt.y);
        });
        wallGraphics.closePath();
        wallGraphics.fillPath();

        // Draw "Bricks"
        wallGraphics.lineStyle(1, 0x4a4036, 0.6); // Dark grout
        // Horizontal lines every 12px
        let yStart = path[0].y; // Bottom-left of face (roughly)
        // Wait, logic for bricks on skewed faces is tricky.
        // Let's just draw simple horizontal lines across the bounding box and clip? No clipping in Graphics.
        // Just draw lines parallel to the top/bottom edges.

        // Simpler: Just add noise and a border.
        wallGraphics.lineStyle(1, 0x3a3026);
        wallGraphics.strokePath();

        // Add Texture
        // We can't easily noise a path without masking.
        // Let's just draw speckles in the bounding box range, ignoring overflow (lazy but might work if minimal).
    };

    // Colors
    const colorLeft = 0x857565; // Shadow side
    const colorRight = 0xa89888; // Light side
    const colorTop = 0xc0b0a0; // Top

    // Left Face Path
    const pLeft = [
        {x: 0, y: h/2 + tallness},
        {x: w/2, y: h + tallness},
        {x: w/2, y: h},
        {x: 0, y: h/2}
    ];
    // Right Face Path
    const pRight = [
        {x: w/2, y: h + tallness},
        {x: w, y: h/2 + tallness},
        {x: w, y: h/2},
        {x: w/2, y: h}
    ];
    // Top Face Path
    const pTop = [
        {x: 0, y: h/2},
        {x: w/2, y: 0},
        {x: w, y: h/2},
        {x: w/2, y: h}
    ];

    drawFace(pLeft, colorLeft);
    // Add brick lines for Left Face (sloped up-right)
    wallGraphics.lineStyle(1, 0x554433, 0.5);
    for(let i=0; i<5; i++) {
        let yOff = i * 12;
        wallGraphics.beginPath();
        // Parallel to bottom edge (0, h/2+tallness) -> (w/2, h+tallness)
        // Slope is dy/dx = (h/2) / (w/2) = h/w = 32/64 = 0.5.
        // We want horizontal lines in 3D, which map to lines with slope 0.5 in Left Face?
        // No, in iso, horizontal wall lines are sloped.
        // Left face is the Y-axis wall. Lines parallel to ground (X-Y plane)? No, Z lines are vertical.
        // Bricks are horizontal layers.
        // So lines should follow the "X" axis direction for the Left face?
        // Left face runs along Y axis visually? No.
        // Let's look at the shape.
        // Left face: Bottom edge goes from (0, 80) to (32, 96) (approx).
        // Top edge goes from (0, 32) to (32, 48).
        // Lines should connect (0, y) to (32, y+16).
        wallGraphics.moveTo(0, h/2 + tallness - yOff);
        wallGraphics.lineTo(w/2, h + tallness - yOff);
        wallGraphics.strokePath();
    }


    drawFace(pRight, colorRight);
    // Brick lines for Right Face
    // Sloped down-right.
    // Connect (32, y) to (64, y-16).
    for(let i=0; i<5; i++) {
        let yOff = i * 12;
        wallGraphics.beginPath();
        wallGraphics.moveTo(w/2, h + tallness - yOff);
        wallGraphics.lineTo(w, h/2 + tallness - yOff);
        wallGraphics.strokePath();
    }

    drawFace(pTop, colorTop);

    wallGraphics.generateTexture('wall', w, totalH);


    // --- Generate Column (Doric Style) ---
    const colGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    const colW = 18;
    const colH = 80; // shorter, stouter
    const centerX = TILE_WIDTH / 2;

    // Draw Shadow (behind)
    colGraphics.fillStyle(0x000000, 0.3);
    colGraphics.fillEllipse(centerX, colH, 24, 12);

    // Draw Pillar Body (Gradient)
    // Dark sides, light center to simulate roundness
    const steps = 5;
    const stepW = colW / steps;
    for(let i=0; i<steps; i++) {
        // Calculate brightness: mid is bright, sides dark
        let brightness = 255;
        let dist = Math.abs(i - (steps-1)/2); // 0 (center) to 2 (side)
        brightness -= dist * 40;
        const c = Phaser.Display.Color.GetColor(brightness, brightness, brightness);

        colGraphics.fillStyle(c);
        colGraphics.fillRect(centerX - colW/2 + i*stepW, 10, stepW + 1, colH - 20); // +1 to cover gaps
    }

    // Base (Rectangular stone)
    colGraphics.fillStyle(0x999999);
    drawIsoTile(colGraphics, 0x999999); // Reuse iso tile function? No, need small rect.
    // Manual small iso base
    colGraphics.beginPath();
    colGraphics.moveTo(centerX - 12, colH - 5);
    colGraphics.lineTo(centerX, colH + 2);
    colGraphics.lineTo(centerX + 12, colH - 5);
    colGraphics.lineTo(centerX, colH - 12);
    colGraphics.closePath();
    colGraphics.fillPath();
    // Side of base
    colGraphics.fillStyle(0x777777);
    colGraphics.fillRect(centerX - 12, colH - 5, 24, 6); // Simplified

    // Capital (Top)
    colGraphics.fillStyle(0xdddddd);
    colGraphics.fillRect(centerX - 14, 0, 28, 8);
    colGraphics.fillStyle(0xbbbbbb);
    colGraphics.fillRect(centerX - 12, 8, 24, 4);

    colGraphics.generateTexture('column', TILE_WIDTH, colH + 10);


    // --- Generate Player (Pixel Art Style) ---
    // Drawing pixel by pixel for a "sprite" look
    const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    const px = 4; // Pixel size multiplier

    // Shadow
    playerGraphics.fillStyle(0x000000, 0.4);
    playerGraphics.fillEllipse(4 * px, 11 * px, 6 * px, 3 * px);

    // Robe Color
    const robeLight = 0xf0f0e0;
    const robeDark = 0xc0c0b0;
    const skin = 0xffccaa;
    const hair = 0x4a3020;

    // Helper to draw "pixel"
    const drawPixel = (x, y, color) => {
        playerGraphics.fillStyle(color);
        playerGraphics.fillRect(x * px, y * px, px, px);
    };

    // Draw Body (Simplified Humanoid 8x12 grid)
    // Head
    drawPixel(3, 0, hair); drawPixel(4, 0, hair);
    drawPixel(2, 1, hair); drawPixel(3, 1, skin); drawPixel(4, 1, skin); drawPixel(5, 1, hair);
    drawPixel(3, 2, skin); drawPixel(4, 2, skin);

    // Torso / Toga
    // Left shoulder (bare?)
    drawPixel(2, 3, skin); drawPixel(3, 3, robeLight); drawPixel(4, 3, robeLight); drawPixel(5, 3, robeLight);
    drawPixel(2, 4, skin); drawPixel(3, 4, robeLight); drawPixel(4, 4, robeDark); drawPixel(5, 4, robeLight);
    drawPixel(3, 5, robeLight); drawPixel(4, 5, robeDark); drawPixel(5, 5, robeLight);

    // Legs / Skirt
    drawPixel(3, 6, robeLight); drawPixel(4, 6, robeDark); drawPixel(5, 6, robeLight);
    drawPixel(3, 7, robeLight); drawPixel(4, 7, robeDark); drawPixel(5, 7, robeLight);
    drawPixel(3, 8, robeLight); drawPixel(4, 8, robeLight); drawPixel(5, 8, robeLight);

    // Feet
    drawPixel(3, 9, 0x664422); // Sandals
    drawPixel(5, 9, 0x664422);

    // Arms
    drawPixel(1, 4, skin); drawPixel(1, 5, skin); // Left Arm
    drawPixel(6, 4, skin); drawPixel(6, 5, skin); // Right Arm

    // Sash (Red)
    drawPixel(4, 3, 0x880000);
    drawPixel(3, 4, 0x880000);
    drawPixel(2, 5, 0x880000);

    playerGraphics.generateTexture('player', 8 * px, 12 * px);
}

function cartToIso(cartX, cartY) {
    const isoX = (cartX - cartY) * (TILE_WIDTH / 2);
    const isoY = (cartX + cartY) * (TILE_HEIGHT / 2);
    return { x: isoX, y: isoY };
}

let player;
let cursors;
let mapData;
let mapWidth;
let mapHeight;
let centerX = 400;
let centerY = 150;

function create() {
    this.add.text(10, 10, 'Roman Atrium (UO Style) - Arrow Keys to Move', { font: '16px "Times New Roman"', fill: '#cccccc' }).setScrollFactor(0);

    // Map definition
    const levelSize = 12;
    mapWidth = levelSize;
    mapHeight = levelSize;
    mapData = [];

    for(let y=0; y<levelSize; y++) {
        let row = [];
        for(let x=0; x<levelSize; x++) {
            row.push(0);
        }
        mapData.push(row);
    }

    // Walls
    for(let i=0; i<levelSize; i++) {
        mapData[0][i] = 1;
        mapData[i][0] = 1;
        mapData[levelSize-1][i] = 1;
        mapData[i][levelSize-1] = 1;
    }

    // Entrance
    mapData[levelSize-1][Math.floor(levelSize/2)] = 0;
    mapData[0][Math.floor(levelSize/2)] = 0;

    // Impluvium
    const center = Math.floor(levelSize/2);
    mapData[center][center] = 2;
    mapData[center-1][center] = 2;
    mapData[center][center-1] = 2;
    mapData[center-1][center-1] = 2;

    // Columns
    mapData[center-2][center-2] = 3;
    mapData[center+1][center-2] = 3;
    mapData[center-2][center+1] = 3;
    mapData[center+1][center+1] = 3;

    // Render Map
    for (let x = 0; x < levelSize; x++) {
        for (let y = 0; y < levelSize; y++) {
            const tileType = mapData[x][y];
            const pos = cartToIso(x, y);
            const screenX = centerX + pos.x;
            const screenY = centerY + pos.y;

            // Draw Floor/Water
            if (tileType === 2) {
                const tile = this.add.image(screenX, screenY, 'water');
                tile.setOrigin(0.5, 0.5);
                tile.setDepth(screenY);
            } else {
                const tile = this.add.image(screenX, screenY, 'floor');
                tile.setOrigin(0.5, 0.5);
                tile.setDepth(screenY - 1);
            }

            // Draw Objects
            if (tileType === 1) {
                const wall = this.add.image(screenX, screenY, 'wall');
                wall.setOrigin(0.5, 0.85); // Adjusted for taller wall
                wall.setDepth(screenY);
            } else if (tileType === 3) {
                const col = this.add.image(screenX, screenY, 'column');
                col.setOrigin(0.5, 0.9);
                col.setDepth(screenY);
            }
        }
    }

    // Create Player
    const startX = Math.floor(levelSize/2);
    const startY = levelSize - 2;

    const startIso = cartToIso(startX, startY);
    player = this.add.image(centerX + startIso.x, centerY + startIso.y, 'player');
    player.setOrigin(0.5, 0.9);
    player.setDepth(centerY + startIso.y);
    player.gridX = startX;
    player.gridY = startY;

    this.cameras.main.startFollow(player, true, 0.05, 0.05);
    this.cameras.main.setZoom(1.2); // Zoom in closer for pixel art feel

    cursors = this.input.keyboard.createCursorKeys();
    player.nextMoveTime = 0;
}

function update(time, delta) {
    if (!player) return;

    // Movement Logic
    const speed = 150;
    if (time > player.nextMoveTime) {
        let dx = 0;
        let dy = 0;

        if (cursors.up.isDown) {
            dx = -1; dy = -1;
        } else if (cursors.down.isDown) {
            dx = 1; dy = 1;
        } else if (cursors.left.isDown) {
            dx = -1; dy = 1;
        } else if (cursors.right.isDown) {
            dx = 1; dy = -1;
        }

        if (dx !== 0 || dy !== 0) {
            const newX = player.gridX + dx;
            const newY = player.gridY + dy;

            if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
                if (mapData[newX][newY] === 0) {
                    player.gridX = newX;
                    player.gridY = newY;

                    const pos = cartToIso(newX, newY);
                    player.x = centerX + pos.x;
                    player.y = centerY + pos.y;
                    player.setDepth(player.y);

                    player.nextMoveTime = time + speed;
                }
            }
        }
    }
}
