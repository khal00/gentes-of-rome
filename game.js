const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2d2d2d',
    parent: 'game-container',
    pixelArt: true,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

function preload() {
    // --- Generate Floor Tile (Marble) ---
    const floorGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    floorGraphics.fillStyle(0xe0e0e0);
    floorGraphics.beginPath();
    floorGraphics.moveTo(0, TILE_HEIGHT / 2);
    floorGraphics.lineTo(TILE_WIDTH / 2, 0);
    floorGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    floorGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    floorGraphics.closePath();
    floorGraphics.fillPath();
    floorGraphics.lineStyle(1, 0xaaaaaa);
    floorGraphics.strokePath();
    // Marble veins
    floorGraphics.lineStyle(1, 0xcccccc, 0.5);
    floorGraphics.beginPath();
    floorGraphics.moveTo(10, 10); floorGraphics.lineTo(20, 20);
    floorGraphics.moveTo(40, 10); floorGraphics.lineTo(30, 25);
    floorGraphics.strokePath();
    floorGraphics.generateTexture('floor', TILE_WIDTH, TILE_HEIGHT);

    // --- Generate Water Tile (Impluvium) ---
    const waterGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    waterGraphics.fillStyle(0x40a0ff, 0.8);
    waterGraphics.beginPath();
    waterGraphics.moveTo(0, TILE_HEIGHT / 2);
    waterGraphics.lineTo(TILE_WIDTH / 2, 0);
    waterGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    waterGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    waterGraphics.closePath();
    waterGraphics.fillPath();
    waterGraphics.generateTexture('water', TILE_WIDTH, TILE_HEIGHT);

    // --- Generate Wall Tile (Stone Block) ---
    const w = TILE_WIDTH;
    const h = TILE_HEIGHT;
    const tallness = 48;
    const totalH = h + tallness;

    const wallGraphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Left Face
    wallGraphics.fillStyle(0xa09080);
    wallGraphics.beginPath();
    wallGraphics.moveTo(0, h/2 + tallness);
    wallGraphics.lineTo(w/2, h + tallness);
    wallGraphics.lineTo(w/2, h);
    wallGraphics.lineTo(0, h/2);
    wallGraphics.closePath();
    wallGraphics.fillPath();
    wallGraphics.lineStyle(1, 0x504030);
    wallGraphics.strokePath();

    // Right Face
    wallGraphics.fillStyle(0xc0b0a0);
    wallGraphics.beginPath();
    wallGraphics.moveTo(w/2, h + tallness);
    wallGraphics.lineTo(w, h/2 + tallness);
    wallGraphics.lineTo(w, h/2);
    wallGraphics.lineTo(w/2, h);
    wallGraphics.closePath();
    wallGraphics.fillPath();
    wallGraphics.lineStyle(1, 0x504030);
    wallGraphics.strokePath();

    // Top Face
    wallGraphics.fillStyle(0xe0d0c0);
    wallGraphics.beginPath();
    wallGraphics.moveTo(0, h/2);
    wallGraphics.lineTo(w/2, 0);
    wallGraphics.lineTo(w, h/2);
    wallGraphics.lineTo(w/2, h);
    wallGraphics.closePath();
    wallGraphics.fillPath();
    wallGraphics.lineStyle(1, 0x504030);
    wallGraphics.strokePath();

    wallGraphics.generateTexture('wall', w, totalH);

    // --- Generate Column (Marble Pillar) ---
    const colGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    const colW = 16;
    const colH = 96;

    // Base
    colGraphics.fillStyle(0xbbbbbb);
    colGraphics.fillRect((TILE_WIDTH - 24)/2, colH - 12, 24, 12);

    // Shaft
    colGraphics.fillStyle(0xffffff);
    colGraphics.fillRect((TILE_WIDTH - colW)/2, 12, colW, colH - 24);
    // Fluting (lines)
    colGraphics.lineStyle(1, 0xeeeeee);
    colGraphics.moveTo(TILE_WIDTH/2 - 4, 12); colGraphics.lineTo(TILE_WIDTH/2 - 4, colH - 12);
    colGraphics.moveTo(TILE_WIDTH/2 + 4, 12); colGraphics.lineTo(TILE_WIDTH/2 + 4, colH - 12);
    colGraphics.strokePath();

    // Capital
    colGraphics.fillStyle(0xbbbbbb);
    colGraphics.fillRect((TILE_WIDTH - 24)/2, 0, 24, 12);

    colGraphics.generateTexture('column', TILE_WIDTH, colH);

    // --- Generate Player (Roman in Toga) ---
    const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    // Shadow
    playerGraphics.fillStyle(0x000000, 0.3);
    playerGraphics.fillEllipse(16, 48, 20, 10);

    // Body (White Toga)
    playerGraphics.fillStyle(0xf0f0f0);
    playerGraphics.beginPath();
    playerGraphics.moveTo(16, 10);
    playerGraphics.lineTo(28, 48);
    playerGraphics.lineTo(4, 48);
    playerGraphics.closePath();
    playerGraphics.fillPath();
    // Head
    playerGraphics.fillStyle(0xffccaa);
    playerGraphics.fillCircle(16, 8, 7);
    // Sash
    playerGraphics.lineStyle(2, 0x800000);
    playerGraphics.beginPath();
    playerGraphics.moveTo(20, 10);
    playerGraphics.lineTo(10, 40);
    playerGraphics.strokePath();
    playerGraphics.generateTexture('player', 32, 54);
}

function cartToIso(cartX, cartY) {
    const isoX = (cartX - cartY) * (TILE_WIDTH / 2);
    const isoY = (cartX + cartY) * (TILE_HEIGHT / 2);
    return { x: isoX, y: isoY };
}

function isoToCart(isoX, isoY) {
    const cartX = (isoX / (TILE_WIDTH / 2) + isoY / (TILE_HEIGHT / 2)) / 2;
    const cartY = (isoY / (TILE_HEIGHT / 2) - isoX / (TILE_WIDTH / 2)) / 2;
    return { x: cartX, y: cartY };
}

let player;
let cursors;
let mapData;
let mapWidth;
let mapHeight;
let centerX = 400;
let centerY = 150;

function create() {
    this.add.text(10, 10, 'Roman Atrium - Use Arrow Keys to Move', { font: '16px monospace', fill: '#ffffff' }).setScrollFactor(0);

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

    // Create a container for the map or just draw directly
    // Direct drawing is fine for this size.

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
                wall.setOrigin(0.5, 0.8);
                wall.setDepth(screenY);
            } else if (tileType === 3) {
                const col = this.add.image(screenX, screenY, 'column');
                col.setOrigin(0.5, 0.9);
                col.setDepth(screenY);
            }
        }
    }

    // Create Player
    // Start near entrance
    const startX = Math.floor(levelSize/2);
    const startY = levelSize - 2;

    // Store logical position on player object
    const startIso = cartToIso(startX, startY);
    player = this.add.image(centerX + startIso.x, centerY + startIso.y, 'player');
    player.setOrigin(0.5, 0.9); // Feet at bottom
    player.setDepth(centerY + startIso.y);
    player.gridX = startX;
    player.gridY = startY;

    // Camera follow
    this.cameras.main.startFollow(player, true, 0.05, 0.05);
    this.cameras.main.setZoom(1.0);

    // Input
    cursors = this.input.keyboard.createCursorKeys();

    // Movement cooldown
    player.nextMoveTime = 0;
}

function update(time, delta) {
    if (!player) return;

    // Movement Logic
    const speed = 150; // ms per step
    if (time > player.nextMoveTime) {
        let dx = 0;
        let dy = 0;

        // Improved Isometric Movement (Visual Direction)
        if (cursors.up.isDown) {
            dx = -1; dy = -1; // North (Visual Up)
        } else if (cursors.down.isDown) {
            dx = 1; dy = 1;   // South (Visual Down)
        } else if (cursors.left.isDown) {
            dx = -1; dy = 1;  // West (Visual Left)
        } else if (cursors.right.isDown) {
            dx = 1; dy = -1;  // East (Visual Right)
        }

        if (dx !== 0 || dy !== 0) {
            const newX = player.gridX + dx;
            const newY = player.gridY + dy;

            // Check bounds
            if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
                // Check collision
                // 0 = Floor. Block everything else.
                if (mapData[newX][newY] === 0) {
                    player.gridX = newX;
                    player.gridY = newY;

                    // Update visual position
                    const pos = cartToIso(newX, newY);
                    player.x = centerX + pos.x;
                    player.y = centerY + pos.y;
                    player.setDepth(player.y); // Update depth based on Y for correct sorting

                    player.nextMoveTime = time + speed;
                }
            }
        }
    }
}
