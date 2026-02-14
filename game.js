import * as THREE from 'three';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

// Camera: Orthographic for true isometric view
const d = 10;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

// Set camera position to isometric angle
camera.position.set(20, 20, 20);
camera.lookAt(scene.position);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
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

// --- Materials ---
const matFloor = new THREE.MeshStandardMaterial({ color: 0x8c8c7e, roughness: 0.8 });
const matWall = new THREE.MeshStandardMaterial({ color: 0xc0b0a0, roughness: 0.9 });
const matColumn = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.1 });
const matWater = new THREE.MeshStandardMaterial({ color: 0x204070, transparent: true, opacity: 0.8, roughness: 0.1 });
const matPlayer = new THREE.MeshStandardMaterial({ color: 0xf0f0e0 });
const matPlayerSkin = new THREE.MeshStandardMaterial({ color: 0xffccaa });
const matPlayerHair = new THREE.MeshStandardMaterial({ color: 0x4a3020 });

// Helper to create geometries
const geoBox = new THREE.BoxGeometry(1, 1, 1);
const geoCyl = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);

// --- Map Logic ---
const levelSize = 12;
const mapData = [];
// Initialize map (0=Floor, 1=Wall, 2=Water, 3=Column)
for(let z=0; z<levelSize; z++) {
    let row = [];
    for(let x=0; x<levelSize; x++) {
        row.push(0);
    }
    mapData.push(row);
}

// Walls (Outer Ring)
for(let i=0; i<levelSize; i++) {
    mapData[0][i] = 1;
    mapData[i][0] = 1;
    mapData[levelSize-1][i] = 1;
    mapData[i][levelSize-1] = 1;
}
// Entrance
mapData[levelSize-1][Math.floor(levelSize/2)] = 0;
mapData[0][Math.floor(levelSize/2)] = 0;

// Impluvium (Water)
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
        const type = mapData[z][x]; // Correct access [row][col]
        const posX = x - offset;
        const posZ = z - offset;

        // Base Floor
        // Position y = -0.05, height 0.1. Top is at 0.
        const floor = new THREE.Mesh(geoBox, matFloor);
        floor.position.set(posX, -0.05, posZ);
        floor.scale.set(1, 0.1, 1);
        floor.receiveShadow = true;
        mapGroup.add(floor);

        if (type === 1) {
            // Wall
            // Height 2. Center at 1. Top at 2.
            const wall = new THREE.Mesh(geoBox, matWall);
            wall.position.set(posX, 1, posZ);
            wall.scale.set(1, 2, 1);
            wall.castShadow = true;
            wall.receiveShadow = true;
            mapGroup.add(wall);
        } else if (type === 2) {
            // Water
            // Remove floor
            mapGroup.remove(floor);

            // Basin floor (sunken)
            const basin = new THREE.Mesh(geoBox, matFloor);
            basin.position.set(posX, -0.55, posZ);
            basin.scale.set(1, 0.1, 1);
            mapGroup.add(basin);

            // Water surface
            // Top at -0.1. Height 0.6. Center -0.4.
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
        }
    }
}
scene.add(mapGroup);


// --- Player Setup ---
const playerGroup = new THREE.Group();

// Body (Cylinder/Robe)
const bodyGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.4, 8);
const body = new THREE.Mesh(bodyGeo, matPlayer);
body.position.y = 0.7; // Stand on ground (height 1.4/2 = 0.7)
body.castShadow = true;
playerGroup.add(body);

// Head
const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
const head = new THREE.Mesh(headGeo, matPlayerSkin);
head.position.y = 1.55;
head.castShadow = true;
playerGroup.add(head);

// Hair
const hairGeo = new THREE.SphereGeometry(0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI/2.5);
const hair = new THREE.Mesh(hairGeo, matPlayerHair);
hair.position.y = 1.58;
hair.rotation.x = Math.PI;
playerGroup.add(hair);

scene.add(playerGroup);

// Initial Player Position
let playerGridX = Math.floor(levelSize/2);
let playerGridZ = levelSize - 2;
playerGroup.position.set(playerGridX - offset, 0, playerGridZ - offset);

// --- Animation & Logic ---
const targetPos = new THREE.Vector3().copy(playerGroup.position);
let isMoving = false;
const moveSpeed = 5.0;

// Controls
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

window.addEventListener('keydown', (e) => {
    if(keys.hasOwnProperty(e.code)) keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
    if(keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();

    // Movement Logic
    if (!isMoving) {
        let dx = 0;
        let dz = 0;

        // Visual Directions in Isometric View:
        // UP Arrow -> Move "North" (Top-Left of Screen) -> Decreases X and Z?
        // Let's test:
        // Camera at (20, 20, 20). Origin (0,0,0).
        // A point (-1, 0, -1) is further "back" and "left" in world space?
        // Visually: Up Arrow usually means "Away from camera".
        // Away from camera (20,20,20) is towards (-infinity).
        // So decreasing X and Z is correct for "Up".

        if (keys.ArrowUp) { dx = -1; dz = -1; }
        else if (keys.ArrowDown) { dx = 1; dz = 1; }
        else if (keys.ArrowLeft) { dx = -1; dz = 1; } // Left on screen
        else if (keys.ArrowRight) { dx = 1; dz = -1; } // Right on screen

        if (dx !== 0 || dz !== 0) {
            const nextX = playerGridX + dx;
            const nextZ = playerGridZ + dz;

            if (nextX >= 0 && nextX < levelSize && nextZ >= 0 && nextZ < levelSize) {
                // mapData uses [z][x] because z is Row, x is Col
                if (mapData[nextZ][nextX] === 0) {
                    playerGridX = nextX;
                    playerGridZ = nextZ;

                    targetPos.set(playerGridX - offset, 0, playerGridZ - offset);
                    isMoving = true;

                    // Rotate player
                    // dx, dz vector.
                    // If dx=-1, dz=-1 (Up): Angle?
                    // atan2(x, z) ?
                    // atan2(-1, -1) = -135 deg.
                    const angle = Math.atan2(dx, dz);
                    playerGroup.rotation.y = angle;
                }
            }
        }
    } else {
        // Smooth Move
        const step = moveSpeed * dt;
        const dist = playerGroup.position.distanceTo(targetPos);
        if (dist <= step) {
            playerGroup.position.copy(targetPos);
            isMoving = false;
        } else {
            const dir = new THREE.Vector3().subVectors(targetPos, playerGroup.position).normalize();
            playerGroup.position.add(dir.multiplyScalar(step));
        }
    }

    // Camera Follow
    // Maintain relative offset
    camera.position.x = playerGroup.position.x + 20;
    camera.position.z = playerGroup.position.z + 20;
    // Y stays constant 20
    camera.lookAt(playerGroup.position);

    renderer.render(scene, camera);
}

// Resize Handler
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
