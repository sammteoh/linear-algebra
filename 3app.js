import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Matrix, rotation, scale } from './math.js';

let e1 = Matrix.create([
    [1],
    [0],
    [0]
]);

let e2 = Matrix.create([
    [0],
    [1],
    [0]
]);

let e3 = Matrix.create([
    [0],
    [0],
    [1]
]);

let V = Matrix.create([
    [1],
    [1],
    [1]
]);

let T = Matrix.create([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
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

function makeArrow(color) {
    const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        1,
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

function blend(A, B, t) {
    const result = new Matrix(3, 3);
    for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
            result.set(i, j, (1 - t) * A.get(i, j) + t * B.get(i, j));
        }
    }
    return result;
}

function updateVector(arrow, v, enabled=true) {
    const dir = new THREE.Vector3(v.get(1, 1), v.get(2, 1), v.get(3, 1));
    const length = dir.length();
    arrow.visible = enabled  && length > 0;
    if (length === 0) return;
    arrow.setDirection(dir.normalize());
    arrow.setLength(length, 0.4, 0.2);
}

let showBasis = true;

function updateBasis(M) {
    updateVector(iArrow, M.multiply(e1), showBasis);
    updateVector(jArrow, M.multiply(e2), showBasis);
    updateVector(kArrow, M.multiply(e3), showBasis);
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
            returnString += Number(m.get(i + 1, j + 1).toFixed(3));
        }
        if (i != m.rows - 1) {
            returnString += String.raw` \\ `;
        }
    }
    returnString += String.raw` \end{bmatrix}`;
    return returnString;
}


const lattice = makeLattice();
lattice.matrixAutoUpdate = false;
scene.add(lattice);

const originalArrow = makeArrow(0x000000);
const transformedArrow = makeArrow(0xff0000);

const iArrow = makeArrow(0x000000);
const jArrow = makeArrow(0x000000);
const kArrow = makeArrow(0x000000);

// --------- INPUTS ------------

function readInputs() {
    const num = (id) => parseFloat(document.getElementById(id).value) || 0;

    const newT = [];
    for (let i = 1; i <= 3; i++) {
        newT.push([num(`t${i}1`), num(`t${i}2`), num(`t${i}3`)]);
    }
    T = Matrix.create(newT);
    V = Matrix.create([[num('v1')], [num('v2')], [num('v3')]]);
}

function setMatrixInputs(M) {
    for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
            document.getElementById(`t${i}${j}`).value = Number(M.get(i, j).toFixed(4));
        }
    }
}

const IDENTITY_STATE = { rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 };
const IDENTITY_M = Matrix.create([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);

let sliderMode = true;
let animMode = 'state';
let currentState = { ...IDENTITY_STATE };
let currentIsState = true;
let currentM = IDENTITY_M;
let fromState = { ...IDENTITY_STATE };
let toState = { ...IDENTITY_STATE };
let fromM = IDENTITY_M;

function readSliderState() {
    const value = (id) => parseFloat(document.getElementById(id).value);
    const degrees = Math.PI / 180;
    return {
        rx: value('x-rotation') * degrees, ry: value('y-rotation') * degrees, rz: value('z-rotation') * degrees,
        sx: value('x-scale'), sy: value('y-scale'), sz: value('z-scale')
    };
}

function lerpState(a, b, t) {
    const out = {};
    for (const key in a) out[key] = a[key] + t * (b[key] - a[key]);
    return out;
}

function buildFromState(s) {
    const R = rotation('z', s.rz)
        .multiply(rotation('y', s.ry))
        .multiply(rotation('x', s.rx));
    const S = scale('z', s.sz)
        .multiply(scale('y', s.sy))
        .multiply(scale('x', s.sx));
    return S.multiply(R);
}

function applySliders() {
    const axes = ['x', 'y', 'z'];
    const val = (id) => parseFloat(document.getElementById(id).value);

    axes.forEach((a) => {
        document.getElementById(`${a}-rotation-label`).textContent = `${val(`${a}-rotation`)}°`;
        document.getElementById(`${a}-scale-label`).textContent = val(`${a}-scale`);
    });

    sliderMode = true;
    toState = readSliderState();
    setMatrixInputs(buildFromState(toState));
    applyInputs();
    beginFromCurrent(currentIsState ? 'state' : 'blend');
}


function renderFormula() {
    katex.render(
        String.raw`${writeMatrix(T)} ${writeMatrix(V)} = \textcolor{red}{${writeMatrix(T.multiply(V))}}`,
        container,
        { displayMode: true, throwOnError: false }
    );
}

function applyInputs() {
    readInputs();
    updateVector(originalArrow, V);
    renderFormula();
}

function beginFromCurrent(mode) {
    animMode = mode;
    fromState = { ...currentState };
    fromM = currentM;
    startTime = performance.now();
}

document.querySelectorAll('.entry').forEach((el) => {
    el.addEventListener('input', () => {
        sliderMode = false;
        applyInputs();
        beginFromCurrent('blend');
    });
});

readInputs();
updateVector(originalArrow, V);
updateBasis(T);
renderFormula();

// -------- ANIMATION -------------
const DURATION = 3000;
let startTime = null;

function startAnimation() {
    animMode = sliderMode ? 'state' : blend;
    fromState = { ...IDENTITY_STATE };
    fromM = IDENTITY_M;
    startTime = performance.now();
}

function animate() {
    requestAnimationFrame(animate);

    if (startTime !== null) {
        const raw = Math.min((performance.now() - startTime) / DURATION, 1);
        const t = raw * raw * (3 - 2 * raw);

        let M;
        if (animMode === 'state') {
            currentState = lerpState(fromState, toState, t);
            M = buildFromState(currentState);
            currentIsState = true;
        } else {
            M = blend(fromM, T, t);
            currentIsState = false;
            if (raw === 1 && sliderMode) {
                currentState = { ...toState };
                currentIsState = true;
            }
        }
        currentM = M;

        lattice.matrix.copy(toMatrix4(M));
        lattice.matrixWorldNeedsUpdate = true;
        updateVector(transformedArrow, M.multiply(V));
        updateBasis(M);
    }

    controls.update();
    renderer.render(scene, camera);
}

document.getElementById('replay').addEventListener('click', startAnimation);
document.getElementById('toggle-lattice').addEventListener('change', (e) => {
    lattice.visible = e.target.checked;
});
document.getElementById('toggle-basis').addEventListener('change', (e) => {
    showBasis = e.target.checked;
});
['x', 'y', 'z'].forEach((axis) => {
    document.getElementById(`${axis}-rotation`).addEventListener('input', applySliders);
    document.getElementById(`${axis}-scale`).addEventListener('input', applySliders);
});

toState = readSliderState();
startAnimation();
animate();

