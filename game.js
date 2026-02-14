import * as THREE from 'three';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

// Camera
const d = 10;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
camera.position.set(20, 20, 20);
camera.lookAt(scene.position);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0x505050, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff0dd, 1.0);
dirLight.position.set(10, 20, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
const shadowRange = 20;
dirLight.shadow.camera.left = -shadowRange;
dirLight.shadow.camera.right = shadowRange;
dirLight.shadow.camera.top = shadowRange;
dirLight.shadow.camera.bottom = -shadowRange;
scene.add(dirLight);

// --- Procedural Texture Helpers ---
function createNoiseTexture(width, height, color1, color2, scale = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, width, height);

    // Add noise
    for (let i = 0; i < width * height * scale; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2;
        ctx.fillStyle = color2;
        ctx.globalAlpha = Math.random() * 0.3;
        ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createTileTexture(size = 512, tilesX = 4, tilesY = 4, colorBase = '#8c8c7e', colorGrout = '#5a5a50') {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background (Grout)
    ctx.fillStyle = colorGrout;
    ctx.fillRect(0, 0, size, size);

    const tileW = size / tilesX;
    const tileH = size / tilesY;
    const gap = 4; // pixels

    for(let y=0; y<tilesY; y++) {
        for(let x=0; x<tilesX; x++) {
            // Randomize tile color
            const hue = 40 + Math.random() * 10;
            const sat = 10 + Math.random() * 10;
            const lig = 50 + Math.random() * 10;
            ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lig}%)`;

            ctx.fillRect(x*tileW + gap, y*tileH + gap, tileW - gap*2, tileH - gap*2);

            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(x*tileW + gap, y*tileH + gap, tileW - gap*2, 2);
            ctx.fillRect(x*tileW + gap, y*tileH + gap, 2, tileH - gap*2);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base Plaster
    ctx.fillStyle = '#c0b0a0';
    ctx.fillRect(0, 0, 512, 512);

    // Noise
    for(let i=0; i<5000; i++) {
        ctx.fillStyle = '#a09080';
        ctx.globalAlpha = 0.1;
        ctx.fillRect(Math.random()*512, Math.random()*512, 2, 2);
    }

    // Dado (bottom part paint)
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#803030';
    ctx.fillRect(0, 400, 512, 112);

    // Top Cornice line
    ctx.fillStyle = '#e0d0c0';
    ctx.fillRect(0, 400, 512, 10);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// --- Materials ---
const texFloor = createTileTexture(512, 4, 4);
const matFloor = new THREE.MeshStandardMaterial({ map: texFloor, roughness: 0.8 });

const texWall = createWallTexture();
const matWall = new THREE.MeshStandardMaterial({ map: texWall, roughness: 0.9 });

const texMarble = createNoiseTexture(256, 256, '#ffffff', '#cccccc', 2);
const matColumn = new THREE.MeshStandardMaterial({ map: texMarble, roughness: 0.4, metalness: 0.1 });

const matWater = new THREE.MeshStandardMaterial({
    color: 0x204070,
    transparent: true,
    opacity: 0.7,
    roughness: 0.1,
    metalness: 0.8
});

const matPlayer = new THREE.MeshStandardMaterial({ color: 0xf0f0e0 });
const matPlayerSash = new THREE.MeshStandardMaterial({ color: 0x880000 });
const matPlayerSkin = new THREE.MeshStandardMaterial({ color: 0xffccaa });
const matPlayerHair = new THREE.MeshStandardMaterial({ color: 0x4a3020 });

// Helper Geometries
const geoBox = new THREE.BoxGeometry(1, 1, 1);
const geoCyl = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);

// --- Map Logic ---
const levelSize = 12;
const mapData = [];
for(let z=0; z<levelSize; z++) {
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

// --- Build Scene Objects ---
const mapGroup = new THREE.Group();
const offset = levelSize / 2;

for(let z=0; z<levelSize; z++) {
    for(let x=0; x<levelSize; x++) {
        const type = mapData[z][x];
        const posX = x - offset;
        const posZ = z - offset;

        // Base Floor
        const floor = new THREE.Mesh(geoBox, matFloor);
        floor.position.set(posX, -0.05, posZ);
        floor.scale.set(1, 0.1, 1);
        floor.receiveShadow = true;
        mapGroup.add(floor);

        if (type === 1) {
            // Wall
            const wall = new THREE.Mesh(geoBox, matWall);
            wall.position.set(posX, 1, posZ);
            wall.scale.set(1, 2, 1);
            wall.castShadow = true;
            wall.receiveShadow = true;
            mapGroup.add(wall);
        } else if (type === 2) {
            // Water
            mapGroup.remove(floor);

            const basin = new THREE.Mesh(geoBox, matFloor);
            basin.position.set(posX, -0.55, posZ);
            basin.scale.set(1, 0.1, 1);
            mapGroup.add(basin);

            const water = new THREE.Mesh(geoBox, matWater);
            water.position.set(posX, -0.4, posZ);
            water.scale.set(1, 0.6, 1);
            mapGroup.add(water);
        } else if (type === 3) {
            // Column
            const col = new THREE.Mesh(geoCyl, matColumn);
            col.position.set(posX, 1, posZ);
            col.castShadow = true;
            col.receiveShadow = true;
            mapGroup.add(col);

            // Base
            const base = new THREE.Mesh(geoBox, matFloor);
            base.position.set(posX, 0.1, posZ);
            base.scale.set(0.8, 0.2, 0.8);
            base.castShadow = true;
            base.receiveShadow = true;
            mapGroup.add(base);

            // Capital
            const cap = new THREE.Mesh(geoBox, matFloor);
            cap.position.set(posX, 1.9, posZ);
            cap.scale.set(0.8, 0.2, 0.8);
            cap.castShadow = true;
            cap.receiveShadow = true;
            mapGroup.add(cap);
        }
    }
}
scene.add(mapGroup);

// --- Props Logic ---
function createBrazier(x, z) {
    const brazierGroup = new THREE.Group();
    brazierGroup.position.set(x, 0, z);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    for(let i=0; i<3; i++) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.y = 0.4;
        leg.rotation.x = 0.3;
        leg.rotation.y = (Math.PI * 2 / 3) * i;
        leg.translateZ(0.2);
        brazierGroup.add(leg);
    }

    // Bowl
    const bowlGeo = new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI/2);
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0xcd7f32, metalness: 0.6, roughness: 0.3 });
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.position.y = 0.8;
    bowl.rotation.x = Math.PI;
    brazierGroup.add(bowl);

    // Fire
    const fireGeo = new THREE.ConeGeometry(0.15, 0.3, 8);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.y = 0.9;
    brazierGroup.add(fire);

    // Light
    const fireLight = new THREE.PointLight(0xffaa00, 2, 5);
    fireLight.position.y = 1.2;
    fireLight.castShadow = true;
    brazierGroup.add(fireLight);

    return brazierGroup;
}

function createBench(x, z, angle=0) {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(x, 0, z);
    benchGroup.rotation.y = angle;

    // Seat
    const seatGeo = new THREE.BoxGeometry(1.2, 0.1, 0.4);
    const seat = new THREE.Mesh(seatGeo, matFloor);
    seat.position.y = 0.4;
    seat.castShadow = true;
    benchGroup.add(seat);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.1, 0.4, 0.35);
    const leg1 = new THREE.Mesh(legGeo, matFloor);
    leg1.position.set(-0.5, 0.2, 0);
    benchGroup.add(leg1);

    const leg2 = new THREE.Mesh(legGeo, matFloor);
    leg2.position.set(0.5, 0.2, 0);
    benchGroup.add(leg2);

    return benchGroup;
}

// Add Props
mapGroup.add(createBrazier(offset - 2.5, offset - 2.5));
mapGroup.add(createBrazier(-(offset - 2.5), offset - 2.5));
mapGroup.add(createBrazier(offset - 2.5, -(offset - 2.5)));
mapGroup.add(createBrazier(-(offset - 2.5), -(offset - 2.5)));

mapGroup.add(createBench(0, offset - 1.5));
mapGroup.add(createBench(3, offset - 1.5));
mapGroup.add(createBench(-3, offset - 1.5));


// --- Player Setup ---
const playerGroup = new THREE.Group();

const fold1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.4, 12), matPlayer);
fold1.position.y = 0.7;
fold1.castShadow = true;
playerGroup.add(fold1);

const sash = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.6), matPlayerSash);
sash.position.set(0, 1.0, 0);
sash.rotation.z = Math.PI / 4;
sash.rotation.y = 0.2;
sash.scale.set(1, 1, 0.2);
sash.castShadow = true;
playerGroup.add(sash);

const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
const head = new THREE.Mesh(headGeo, matPlayerSkin);
head.position.y = 1.55;
head.castShadow = true;
playerGroup.add(head);

const nose = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.04), matPlayerSkin);
nose.position.set(0, 1.55, 0.2);
playerGroup.add(nose);

const wreathGeo = new THREE.TorusGeometry(0.23, 0.02, 8, 20);
const matWreath = new THREE.MeshStandardMaterial({ color: 0x228822 });
const wreath = new THREE.Mesh(wreathGeo, matWreath);
wreath.position.set(0, 1.65, 0);
wreath.rotation.x = Math.PI / 2;
playerGroup.add(wreath);

const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6), matPlayerSkin);
armL.position.set(-0.3, 1.1, 0);
armL.rotation.z = Math.PI / 8;
playerGroup.add(armL);

const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6), matPlayerSkin);
armR.position.set(0.3, 1.1, 0);
armR.rotation.z = -Math.PI / 8;
playerGroup.add(armR);

scene.add(playerGroup);

// Initial Player Position
let playerGridX = Math.floor(levelSize/2);
let playerGridZ = levelSize - 2;
playerGroup.position.set(playerGridX - offset, 0, playerGridZ - offset);

// --- Animation & Logic ---
const targetPos = new THREE.Vector3().copy(playerGroup.position);
let isMoving = false;
const moveSpeed = 5.0;

const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

window.addEventListener('keydown', (e) => {
    if(keys.hasOwnProperty(e.code)) keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
    if(keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();

    // Bobbing animation for player
    const time = clock.elapsedTime;
    playerGroup.position.y = Math.sin(time * 2) * 0.02;

    if (!isMoving) {
        let dx = 0;
        let dz = 0;

        if (keys.ArrowUp) { dx = -1; dz = -1; }
        else if (keys.ArrowDown) { dx = 1; dz = 1; }
        else if (keys.ArrowLeft) { dx = -1; dz = 1; }
        else if (keys.ArrowRight) { dx = 1; dz = -1; }

        if (dx !== 0 || dz !== 0) {
            const nextX = playerGridX + dx;
            const nextZ = playerGridZ + dz;

            if (nextX >= 0 && nextX < levelSize && nextZ >= 0 && nextZ < levelSize) {
                if (mapData[nextZ][nextX] === 0) {
                    playerGridX = nextX;
                    playerGridZ = nextZ;

                    targetPos.set(playerGridX - offset, 0, playerGridZ - offset);
                    isMoving = true;

                    const angle = Math.atan2(dx, dz);
                    playerGroup.rotation.y = angle;
                }
            }
        }
    } else {
        const step = moveSpeed * dt;
        const dist = new THREE.Vector3(playerGroup.position.x, 0, playerGroup.position.z).distanceTo(targetPos);

        if (dist <= step) {
            playerGroup.position.x = targetPos.x;
            playerGroup.position.z = targetPos.z;
            isMoving = false;
        } else {
            const currentPosFlat = new THREE.Vector3(playerGroup.position.x, 0, playerGroup.position.z);
            const dir = new THREE.Vector3().subVectors(targetPos, currentPosFlat).normalize();
            playerGroup.position.add(dir.multiplyScalar(step));
        }
    }

    camera.position.x = playerGroup.position.x + 20;
    camera.position.z = playerGroup.position.z + 20;
    camera.lookAt(playerGroup.position);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
