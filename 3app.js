import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Matrix } from './math.js';

let V = Matrix.create([
    [1],
    [1],
    [1]
]);

let T = Matrix.create([
    [2, 0, 1],
    [0, 1, -1],
    [-1, 0, 2]
]);

// ----------- SCENE -----------

const canvas = document.getElementById('canvas');
const size = canvas.parentElement.clientWidth;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.up.set(0, 0, 1);
camera.position.set(9, 7, 6);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(size, size);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

scene.add(new THREE.AxesHelper(10));

const floor = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
floor.rotation.x = Math.PI / 2;
scene.add(floor);

// ---------- VECTORS ----------

function drawVector(v, color=0x000000) {
    // v is a 3x1 matrix vector
    const dir = new THREE.Vector3(v.get(1, 1), v.get(2, 1), v.get(3, 1));
    const length = dir.length();
    if (length === 0) return;

    const arrow = new THREE.ArrowHelper(
        dir.normalize(),
        new THREE.Vector3(0, 0, 0),
        length,
        color,
        0.4,
        0.2
    );
    scene.add(arrow);
    return arrow;
}

function makeLattice(n=3, color=0xff0000) {
    const points = [];
    for (let a = -n; a <= n; a++) {
        for (let b = -n; b <= n; b++) {
            points.push(-n, a, b, n, a, b);
            points.push(a, -n, b, a, n, b);
            points.push(a, b, -n, a, b, n);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
     
    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2
    });

    return new THREE.LineSegments(geometry, material);
}

function toMatrix4(M) {
    return new THREE.Matrix4().set(
        M.get(1, 1), M.get(1, 2), M.get(1, 3), 0,
        M.get(2, 1), M.get(2, 2), M.get(2, 3), 0,
        M.get(3, 1), M.get(3, 2), M.get(3, 3), 0,
        0, 0, 0, 1
    )
}

function interpolate(M, t) {
    const result = new Matrix(3, 3);
    for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
            const identity = (i === j) ? 1 : 0;
            result.set(i, j, (1 - t) * identity + t * M.get(i, j));
        }
    }
    return result;
}

function updateVector(arrow, v) {
    const dir = new THREE.Vector3(v.get(1, 1), v.get(2, 1), v.get(3, 1));
    const length = dir.length();
    arrow.visible = length > 0;
    if (length === 0) return;
    arrow.setDirection(dir.normalize());
    arrow.setLength(length, 0.4, 0.2);
}

// ------------- FORMULAS --------------

const container = document.getElementById('formula-container');

function writeMatrix(m) {
    let returnString = String.raw`\begin{bmatrix} `;

    for (let i = 0; i < m.rows; i++) {
        for (let j = 0; j < m.cols; j++) {
            if (j != 0) {
                returnString += ' & ';
            }
            returnString += m.get(i + 1, j + 1);
        }
        if (i != m.rows - 1) {
            returnString += String.raw` \\ `;
        }
    }
    returnString += String.raw` \end{bmatrix}`;
    return returnString;
}

let lattice;
let transformedArrow;

function transformVector(T, V) {
    lattice = makeLattice();
    lattice.matrixAutoUpdate = false;
    scene.add(lattice);

    drawVector(V);
    transformedArrow = drawVector(T.multiply(V), 0xff0000);

    katex.render(
        String.raw`${writeMatrix(T)} ${writeMatrix(V)} = \textcolor{red}{${writeMatrix(T.multiply(V))}}`,
        container,
        {
            displayMode: true,
            throwOnError: false
        }
    );
};

transformVector(T, V);

// -------- ANIMATION -------------
const DURATION = 3000;
let startTime = null;

function startAnimation() {
    startTime = performance.now();
}

function animate() {
    requestAnimationFrame(animate);

    if (startTime !== null) {
        const raw = Math.min((performance.now() - startTime) / DURATION, 1);
        const t = raw * raw * (3 - 2 * raw);

        const M = interpolate(T, t);
        lattice.matrix.copy(toMatrix4(M));
        lattice.matrixWorldNeedsUpdate = true;
        updateVector(transformedArrow, M.multiply(V));
    }

    controls.update();
    renderer.render(scene, camera);
}

document.getElementById('replay').addEventListener('click', startAnimation);
document.getElementById('toggle-lattice').addEventListener('change', (e) => {
    lattice.visible = e.target.checked;
})

startAnimation();
animate();

