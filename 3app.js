import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Matrix } from './math.js';

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

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

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

function transformVector(T, V) {
    const lattice = makeLattice();
    lattice.matrixAutoUpdate = false;
    lattice.matrix.copy(toMatrix4(T));
    lattice.matrixWorldNeedsUpdate = true;
    scene.add(lattice);

    drawVector(V);
    drawVector(T.multiply(V), 0xff0000);

    katex.render(
        String.raw`${writeMatrix(T)} ${writeMatrix(V)} = \textcolor{red}{${writeMatrix(T.multiply(V))}}`,
        container,
        {
            displayMode: true,
            throwOnError: false
        }
    );
};

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

transformVector(T, V);

