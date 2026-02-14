import * as THREE from 'three';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

// Camera
const d = 5;
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

    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, width, height);

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

    ctx.fillStyle = colorGrout;
    ctx.fillRect(0, 0, size, size);

    const tileW = size / tilesX;
    const tileH = size / tilesY;
    const gap = 4;

    for(let y=0; y<tilesY; y++) {
        for(let x=0; x<tilesX; x++) {
            const hue = 40 + Math.random() * 10;
            const sat = 10 + Math.random() * 10;
            const lig = 50 + Math.random() * 10;
            ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lig}%)`;
            ctx.fillRect(x*tileW + gap, y*tileH + gap, tileW - gap*2, tileH - gap*2);

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

    ctx.fillStyle = '#c0b0a0';
    ctx.fillRect(0, 0, 512, 512);

    for(let i=0; i<5000; i++) {
        ctx.fillStyle = '#a09080';
        ctx.globalAlpha = 0.1;
        ctx.fillRect(Math.random()*512, Math.random()*512, 2, 2);
    }

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#803030';
    ctx.fillRect(0, 400, 512, 112);

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
const matWater = new THREE.MeshStandardMaterial({ color: 0x204070, transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.8 });

// Character Materials
const matSkin = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 });
const matHair = new THREE.MeshStandardMaterial({ color: 0x3b2e25, roughness: 0.9 });
const matTunic = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.7 }); // Off-white
const matSash = new THREE.MeshStandardMaterial({ color: 0x990000, roughness: 0.8 }); // Deep Red
const matSandals = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });

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

        const floor = new THREE.Mesh(geoBox, matFloor);
        floor.position.set(posX, -0.05, posZ);
        floor.scale.set(1, 0.1, 1);
        floor.receiveShadow = true;
        mapGroup.add(floor);

        if (type === 1) {
            const wall = new THREE.Mesh(geoBox, matWall);
            wall.position.set(posX, 1, posZ);
            wall.scale.set(1, 2, 1);
            wall.castShadow = true;
            wall.receiveShadow = true;
            mapGroup.add(wall);
        } else if (type === 2) {
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
            const col = new THREE.Mesh(geoCyl, matColumn);
            col.position.set(posX, 1, posZ);
            col.castShadow = true;
            col.receiveShadow = true;
            mapGroup.add(col);

            const base = new THREE.Mesh(geoBox, matFloor);
            base.position.set(posX, 0.1, posZ);
            base.scale.set(0.8, 0.2, 0.8);
            base.castShadow = true;
            base.receiveShadow = true;
            mapGroup.add(base);

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

// --- Props ---
function createBrazier(x, z) {
    const brazierGroup = new THREE.Group();
    brazierGroup.position.set(x, 0, z);

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
    const bowlGeo = new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI/2);
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0xcd7f32, metalness: 0.6, roughness: 0.3 });
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.position.y = 0.8;
    bowl.rotation.x = Math.PI;
    brazierGroup.add(bowl);
    const fireGeo = new THREE.ConeGeometry(0.15, 0.3, 8);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.y = 0.9;
    brazierGroup.add(fire);
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
    const seatGeo = new THREE.BoxGeometry(1.2, 0.1, 0.4);
    const seat = new THREE.Mesh(seatGeo, matFloor);
    seat.position.y = 0.4;
    seat.castShadow = true;
    benchGroup.add(seat);
    const legGeo = new THREE.BoxGeometry(0.1, 0.4, 0.35);
    const leg1 = new THREE.Mesh(legGeo, matFloor);
    leg1.position.set(-0.5, 0.2, 0);
    benchGroup.add(leg1);
    const leg2 = new THREE.Mesh(legGeo, matFloor);
    leg2.position.set(0.5, 0.2, 0);
    benchGroup.add(leg2);
    return benchGroup;
}

mapGroup.add(createBrazier(offset - 2.5, offset - 2.5));
mapGroup.add(createBrazier(-(offset - 2.5), offset - 2.5));
mapGroup.add(createBrazier(offset - 2.5, -(offset - 2.5)));
mapGroup.add(createBrazier(-(offset - 2.5), -(offset - 2.5)));
mapGroup.add(createBench(0, offset - 1.5));
mapGroup.add(createBench(3, offset - 1.5));
mapGroup.add(createBench(-3, offset - 1.5));

// --- Detailed Player Construction ---
function createSenator() {
    const group = new THREE.Group();

    // 1. Legs (Pivots for animation)
    const legLGroup = new THREE.Group();
    legLGroup.position.set(-0.12, 0.7, 0); // Hip joint
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.75), matSkin);
    legL.position.y = -0.375; // Center of leg relative to pivot
    legL.castShadow = true;
    legLGroup.add(legL);
    // Sandal L
    const sandalL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.18), matSandals);
    sandalL.position.y = -0.75;
    sandalL.position.z = 0.05;
    legLGroup.add(sandalL);
    group.add(legLGroup);

    const legRGroup = new THREE.Group();
    legRGroup.position.set(0.12, 0.7, 0);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.75), matSkin);
    legR.position.y = -0.375;
    legR.castShadow = true;
    legRGroup.add(legR);
    // Sandal R
    const sandalR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.18), matSandals);
    sandalR.position.y = -0.75;
    sandalR.position.z = 0.05;
    legRGroup.add(sandalR);
    group.add(legRGroup);

    // 2. Torso / Tunic
    // Main body cylinder
    const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.9, 10), matTunic);
    tunic.position.y = 0.95; // Center of torso
    tunic.castShadow = true;
    group.add(tunic);

    // Sash (Laticlavius) - Vertical stripes
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.92, 0.05), matSash);
    sash.position.set(0.1, 0.95, 0.21); // Front Right
    group.add(sash);
    const sash2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.92, 0.05), matSash);
    sash2.position.set(-0.1, 0.95, 0.21); // Front Left
    group.add(sash2);

    // 3. Toga Drape
    // A thick curved shape wrapping around shoulder
    const drapeGeo = new THREE.TorusGeometry(0.26, 0.12, 8, 20, 4); // Partial torus
    const drape = new THREE.Mesh(drapeGeo, matTunic);
    drape.position.set(0, 1.1, 0);
    drape.rotation.z = -0.4;
    drape.rotation.x = 0.2;
    drape.scale.set(1, 1, 1.2);
    drape.castShadow = true;
    group.add(drape);

    // 4. Arms
    const armLGroup = new THREE.Group();
    armLGroup.position.set(-0.28, 1.25, 0); // Shoulder
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.6), matSkin);
    armL.position.y = -0.3;
    armL.castShadow = true;
    armLGroup.add(armL);
    group.add(armLGroup);

    const armRGroup = new THREE.Group();
    armRGroup.position.set(0.28, 1.25, 0);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.6), matSkin);
    armR.position.y = -0.3;
    armR.castShadow = true;
    armRGroup.add(armR);
    group.add(armRGroup);

    // 5. Head
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.4;

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.15), matSkin);
    neck.position.y = 0;
    headGroup.add(neck);

    // Skull
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), matSkin);
    headMesh.position.y = 0.15;
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16, 0, Math.PI * 2, 0, Math.PI/2.5), matHair);
    hair.position.y = 0.18;
    hair.rotation.x = Math.PI;
    headGroup.add(hair);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.04), matSkin);
    nose.position.set(0, 0.15, 0.15);
    headGroup.add(nose);

    // Wreath
    const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.015, 6, 16), new THREE.MeshStandardMaterial({ color: 0x228822 }));
    wreath.position.set(0, 0.22, 0);
    wreath.rotation.x = Math.PI/2;
    wreath.rotation.y = 0.2;
    headGroup.add(wreath);

    group.add(headGroup);

    // Expose parts for animation
    group.userData = {
        legL: legLGroup,
        legR: legRGroup,
        armL: armLGroup,
        armR: armRGroup,
        head: headGroup
    };

    return group;
}

const player = createSenator();
scene.add(player);

// Initial Player Position
let playerGridX = Math.floor(levelSize/2);
let playerGridZ = levelSize - 2;
player.position.set(playerGridX - offset, 0, playerGridZ - offset);

// --- Animation & Logic ---
const targetPos = new THREE.Vector3().copy(player.position);
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

function updatePlayerAnimation(dt, isMoving) {
    const parts = player.userData;
    const time = clock.getElapsedTime() * 10; // Speed of animation

    if (isMoving) {
        // Walk Cycle
        parts.legL.rotation.x = Math.sin(time) * 0.5;
        parts.legR.rotation.x = Math.sin(time + Math.PI) * 0.5;
        parts.armL.rotation.x = Math.sin(time + Math.PI) * 0.5; // Opposite to leg
        parts.armR.rotation.x = Math.sin(time) * 0.5;

        // Bobbing
        player.position.y = Math.abs(Math.sin(time*2)) * 0.05;
    } else {
        // Idle
        parts.legL.rotation.x = 0;
        parts.legR.rotation.x = 0;
        parts.armL.rotation.x = Math.sin(time * 0.5) * 0.05; // Gentle sway
        parts.armR.rotation.x = Math.sin(time * 0.5 + 1) * 0.05;
        player.position.y = 0;
    }
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

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
                    // Rotation
                    const angle = Math.atan2(dx, dz);
                    // Smooth rotation? For now instant snap to face direction or lerp
                    player.rotation.y = angle;
                }
            }
        }
    } else {
        const step = moveSpeed * dt;
        const dist = new THREE.Vector3(player.position.x, 0, player.position.z).distanceTo(targetPos);
        if (dist <= step) {
            player.position.x = targetPos.x;
            player.position.z = targetPos.z;
            isMoving = false;
        } else {
            const currentPosFlat = new THREE.Vector3(player.position.x, 0, player.position.z);
            const dir = new THREE.Vector3().subVectors(targetPos, currentPosFlat).normalize();
            player.position.add(dir.multiplyScalar(step));
        }
    }

    updatePlayerAnimation(dt, isMoving);

    camera.position.x = player.position.x + 20;
    camera.position.z = player.position.z + 20;
    camera.lookAt(player.position);

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
