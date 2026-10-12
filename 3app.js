import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Matrix, rotation, scale, shear } from './math.js';

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

let W = Matrix.create([
    [0],
    [0],
    [0]
]);

let U = Matrix.create([
    [0],
    [0],
    [0]
])

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

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(size, size);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none'; // with this, dragging can still reach orbit controls
canvas.parentElement.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

scene.add(new THREE.AxesHelper(10));

const floor = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
floor.rotation.x = Math.PI / 2;
scene.add(floor);

// Creates a THREE.js arrow at origin with placeholder
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

function makeLabel(text, color='#000000') {
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = text;
    div.style.color = color;

    const label = new CSS2DObject(div);
    scene.add(label);
    return label;
}

// Attach the label to the arrow (update vector will keep it at the arrow tip)
function attachLabel(arrow, text, color, showCoords=false) {
    arrow.userData.label = makeLabel(text, color);
    arrow.userData.name = text;
    arrow.userData.showCoords = showCoords;
}

function formatCoords(v) {
    const f = (x) => Number(x.toFixed(2));
    return `(${f(v.get(1, 1))}, ${f(v.get(2, 1))}, ${f(v.get(3, 1))})`;
}

// Repositions the arrow to v
function updateVector(arrow, v, enabled=true) {
    const dir = new THREE.Vector3(v.get(1, 1), v.get(2, 1), v.get(3, 1));
    const length = dir.length();
    arrow.visible = enabled  && length > 0;

    const label = arrow.userData.label;
    if (label) label.visible = arrow.visible;

    if (label && arrow.userData.showCoords) {
        const text = `${arrow.userData.name} = ${formatCoords(v)}`;
        if (label.element.textContent !== text) label.element.textContent= text;
    }

    if (length === 0) return;
    arrow.setDirection(dir.normalize());
    arrow.setLength(length, 0.4, 0.2);

    if (label) label.position.copy(dir).multiplyScalar(length + 0.5);
}

// ---------- VECTORS ----------
function setDetVisible(show) {
    shape.visible = show;
    transformedShape.visible = show;
    areaReadout.style.display = show ? '' : 'none';
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

// Converts 3x3 matrix into 4x4 matrix for THREE.js
function toMatrix4(M) {
    return new THREE.Matrix4().set(
        M.get(1, 1), M.get(1, 2), M.get(1, 3), 0,
        M.get(2, 1), M.get(2, 2), M.get(2, 3), 0,
        M.get(3, 1), M.get(3, 2), M.get(3, 3), 0,
        0, 0, 0, 1
    )
}

// Returns a matrix that is (1 - t)A + tBx
function blend(A, B, t) {
    const result = new Matrix(3, 3);
    for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
            result.set(i, j, (1 - t) * A.get(i, j) + t * B.get(i, j));
        }
    }
    return result;
}

let showBasis = true;

function updateBasis(M) {
    updateVector(iArrow, M.multiply(e1), showBasis);
    updateVector(jArrow, M.multiply(e2), showBasis);
    updateVector(kArrow, M.multiply(e3), showBasis);
}

// ------------- FORMULAS --------------

const container = document.getElementById('formula-container');

// Turns matrix into Latex bmatrix string for Katex
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

const originalVArrow = makeArrow(0x000000);
const originalWArrow = makeArrow(0x000000);
const originalUArrow = makeArrow(0x000000);
const transformedVArrow = makeArrow(0xff0000);
const transformedWArrow = makeArrow(0xff0000);
const transformedUArrow = makeArrow(0xff0000);

const iArrow = makeArrow(0xff8800);
const jArrow = makeArrow(0x00aa00);
const kArrow = makeArrow(0x0066ff);

attachLabel(originalVArrow, 'v', '#000000', true);
attachLabel(transformedVArrow, 'Tv', '#ff0000', true);
attachLabel(originalWArrow, 'w', '#000000', true);
attachLabel(transformedWArrow, 'Tw', '#ff0000', true);
attachLabel(originalUArrow, 'u', '#000000', true);
attachLabel(transformedUArrow, 'Tu', '#ff0000', true);
attachLabel(iArrow, 'î', '#ff8800');
attachLabel(jArrow, 'ĵ', '#00aa00');
attachLabel(kArrow, 'k̂', '#0066ff');

const axisLabels = [
    makeLabel('x', '#cc0000'),
    makeLabel('y', '#008800'),
    makeLabel('z', '#0000cc')
];
axisLabels[0].position.set(10.7, 0, 0);
axisLabels[1].position.set(0, 10.7, 0);
axisLabels[2].position.set(0, 0, 10.7);

// ---------------- 2X2 DETERMINANT ------------------

function toVec3(m) {
    return new THREE.Vector3(m.get(1, 1), m.get(2, 1), m.get(3, 1));
}

function makeShape(color) {
    const mesh = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false
        })
    );
    mesh.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3));
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
}

function setShape(mesh, a, b) {
    const o = new THREE.Vector3(0, 0, 0);
    const ab = a.clone().add(b);
    const pos = mesh.geometry.attributes.position;
    [o, a, ab, o, ab, b].forEach((p, i) => pos.setXYZ(i, p.x, p.y, p.z));
    pos.needsUpdate = true;
}

const shape = makeShape(0x888888);
const transformedShape = makeShape(0xff0000);

const areaReadout = document.getElementById('area-readout');
let originalDet = 0;
let originalArea = 0;

function updateShape() {
    const a = toVec3(V);
    const b = toVec3(W);
    setShape(shape, a, b);

    originalDet = a.x * b.y - a.y * b.x;
    originalArea = a.clone().cross(b).length();
}

function updateTransformedShape(M) {
    const a = toVec3(M.multiply(V));
    const b = toVec3(M.multiply(W));
    setShape(transformedShape, a, b);

    const area = a.clone().cross(b).length();
    const f = (x) => Number(x.toFixed(2));
    areaReadout.innerHTML =
        `det[v w] = ${f(originalDet)}<br>` +
        `area of v, w = ${f(originalArea)}<br>` +
        `area of Tv, Tw = ${f(area)}` +
        (originalArea > 1e-9 ? ` (×${f(area / originalArea)})` : '');
}

// ---------------- CROSS PRODUCT ---------------

const crossArrow = makeArrow(0x0099aa);
attachLabel(crossArrow, 'v×w', '#0099aa', true);

const crossReadout = document.getElementById('cross-readout');

function updateCross() {
    const n = toVec3(V).cross(toVec3(W));

    updateVector(crossArrow, Matrix.create([[n.x], [n.y], [n.z]]));

    const f = (x) => Number(x.toFixed(2));
    crossReadout.innerHTML = `|v × w| = ${f(n.length())}`;
}

// ----------------------- 3X3 DETERMINANT --------------------

function makeBox(color) {
    const fill = new THREE.Mesh(
        new THREE.BufferGeometry,
        new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            depthWrite: false
        })
    );
    // 6 faces * 2 triangles * 3 points * 3 numbers = 108
    fill.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(108), 3));
    fill.frustumCulled = false;

    const edges = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: color})
    );
    // 12 edges * 2 points * 3 numbers = 72
    edges.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(72), 3));
    edges.frustumCulled = false;

    scene.add(fill, edges);
    return { fill, edges };
}

function setBox(box, a, b, c) {
    const corner = (i, j, k) =>
        a.clone().multiplyScalar(i).addScaledVector(b, j).addScaledVector(c, k);

    const faces = [
        [[0,0,0], [1,0,0], [0,1,0]],
        [[0,0,1], [1,0,0], [0,1,0]],
        [[0,0,0], [1,0,0], [0,0,1]],
        [[0,1,0], [1,0,0], [0,0,1]],
        [[0,0,0], [0,1,0], [0,0,1]],
        [[1,0,0], [0,1,0], [0,0,1]],
    ];

    const fillPos = box.fill.geometry.attributes.position;
    let n = 0;
    faces.forEach(([o, p, q]) => {
        const add = (x, y) => x.map((v, i) => v + y[i]);
        const c0 = corner(...o);
        const c1 = corner(...add(o, p));
        const c2 = corner(...add(add(o, p), q));
        const c3 = corner(...add(o, q));
        [c0, c1, c2, c0, c2, c3].forEach((pt) => fillPos.setXYZ(n++, pt.x, pt.y, pt.z));
    });
    fillPos.needsUpdate = true;

    const edgePos = box.edges.geometry.attributes.position;
    let m = 0;
    for (let i = 0; i <= 1; i++) {
        for (let j = 0; j <= 1; j++) {
            for (let k = 0; k <= 1; k++) {
                const idx = [i, j, k];
                for (let d = 0; d < 3; d++) {
                    if (idx[d] === 0) {                // one edge per corner per direction
                        const end = [...idx];
                        end[d] = 1;
                        const s = corner(...idx), e = corner(...end);
                        edgePos.setXYZ(m++, s.x, s.y, s.z);
                        edgePos.setXYZ(m++, e.x, e.y, e.z);
                    }
                }
            }
        }
    }
    edgePos.needsUpdate = true;
}

const box = makeBox(0x888888);
const transformedBox = makeBox(0xff0000);

function updateBox() {
    setBox(box, toVec3(V), toVec3(W), toVec3(U));
}

function updateTransformedBox(M) {
    setBox(transformedBox, toVec3(M.multiply(V)), toVec3(M.multiply(W)), toVec3(M.multiply(U)));
}

function columns(a, b, c) {
    return Matrix.create([
        [a.get(1, 1), b.get(1, 1), c.get(1, 1)],
        [a.get(2, 1), b.get(2, 1), c.get(2, 1)],
        [a.get(3, 1), b.get(3, 1), c.get(3, 1)]
    ]);
}

const volumeReadout = document.getElementById('volume-readout');
let originalVolDet = 0;

function updateVolume() {
    originalVolDet = columns(V, W, U).determinant();
}

function updateVolumeReadout(M) {
    const tVolDet = columns(M.multiply(V), M.multiply(W), M.multiply(U)).determinant();
    const f = (x) => Number(x.toFixed(2));

    volumeReadout.innerHTML =
        `det[v w u] = ${f(originalVolDet)}<br>` +
        `volume of v, w, u = ${f(Math.abs(originalVolDet))}<br>` +
        `det[Tv Tw Tu] = ${f(tVolDet)}<br>` +
        `det(T) = ${f(M.determinant())}`;    
}

function setVolVisible(show) {
    box.fill.visible = show;
    box.edges.visible = show;
    transformedBox.fill.visible = show;
    transformedBox.edges.visible = show;
    volumeReadout.style.display = show ? '' : 'none';
}

// --------- INPUTS ------------

// Reads the 9 matrix boxes, converts to T and V
function readInputs() {
    const num = (id) => parseFloat(document.getElementById(id).value) || 0;

    const newT = [];
    for (let i = 1; i <= 3; i++) {
        newT.push([num(`t${i}1`), num(`t${i}2`), num(`t${i}3`)]);
    }
    T = Matrix.create(newT);
    V = Matrix.create([[num('v1')], [num('v2')], [num('v3')]]);
    W = Matrix.create([[num('w1')], [num('w2')], [num('w3')]]);
    U = Matrix.create([[num('u1')], [num('u2')], [num('u3')]]);
}

// Writes matrix into the 9 matrix boxes
function setMatrixInputs(M) {
    for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
            document.getElementById(`t${i}${j}`).value = Number(M.get(i, j).toFixed(4));
        }
    }
}

const IDENTITY_STATE = { rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1, shx: 0, shy: 0, shz: 0 };
const IDENTITY_M = Matrix.create([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);

let sliderMode = true;
let animMode = 'state';
let currentState = { ...IDENTITY_STATE };
let currentIsState = true;
let currentM = IDENTITY_M;
let fromState = { ...IDENTITY_STATE };
let toState = { ...IDENTITY_STATE };
let fromM = IDENTITY_M;

// Reads the 9 sliders, returns 9 objects
function readSliderState() {
    const value = (id) => parseFloat(document.getElementById(id).value);
    const degrees = Math.PI / 180;
    return {
        rx: value('x-rotation') * degrees, ry: value('y-rotation') * degrees, rz: value('z-rotation') * degrees,
        sx: value('x-scale'), sy: value('y-scale'), sz: value('z-scale'),
        shx: value('x-shear'), shy: value('y-shear'), shz: value('z-shear')
    };
}

// Blends 2 states so that it's smooth
function lerpState(a, b, t) {
    const out = {};
    for (const key in a) out[key] = a[key] + t * (b[key] - a[key]);
    return out;
}

// Turns the state into a matrix
function buildFromState(s) {
    const R = rotation('z', s.rz)
        .multiply(rotation('y', s.ry))
        .multiply(rotation('x', s.rx));
    const S = scale('z', s.sz)
        .multiply(scale('y', s.sy))
        .multiply(scale('x', s.sx));
    const SH = shear('z', s.shz)
        .multiply(shear('y', s.shy))
        .multiply(shear('x', s.shx));
    return SH.multiply(S).multiply(R);
}

// Runs everytime slider moves, updates text, switches to slider mode
// Reads new input, writes it into the matrix boxes, starts animation
function applySliders() {
    const axes = ['x', 'y', 'z'];
    const val = (id) => parseFloat(document.getElementById(id).value);

    axes.forEach((a) => {
        document.getElementById(`${a}-rotation-label`).textContent = `${val(`${a}-rotation`)}°`;
        document.getElementById(`${a}-scale-label`).textContent = val(`${a}-scale`);
        document.getElementById(`${a}-shear-label`).textContent = val(`${a}-shear`);
    });

    sliderMode = true;
    toState = readSliderState();
    setMatrixInputs(buildFromState(toState));
    applyInputs();
    beginFromCurrent(currentIsState ? 'state' : 'blend');
}


function renderFormula() {
    katex.render(
        String.raw`${writeMatrix(T)} ${writeMatrix(V)} = \textcolor{red}{${writeMatrix(T.multiply(V))}}
        \\
        ${writeMatrix(T)} ${writeMatrix(W)} = \textcolor{red}{${writeMatrix(T.multiply(W))}}
        \\
        ${writeMatrix(T)} ${writeMatrix(U)} = \textcolor{red}{${writeMatrix(T.multiply(U))}}`,
        container,
        { displayMode: true, throwOnError: false }
    );
}

function applyInputs() {
    readInputs();
    updateVector(originalVArrow, V);
    updateVector(originalWArrow, W);
    updateVector(originalUArrow, U);
    updateShape();
    updateCross();
    updateBox();
    updateVolume();
    updateTransformedShape(currentM);
    updateTransformedBox(currentM);
    updateVolumeReadout(currentM);
    renderFormula();
}

// Starts animation from whatever is on screen
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
updateVector(originalVArrow, V);
updateVector(originalWArrow, W);
updateVector(originalUArrow, U);
updateShape();
updateCross();
updateBox();
updateVolume();
updateBasis(T);
renderFormula();

// -------- ANIMATION -------------
const DURATION = 3000;
let startTime = null;

function startAnimation() {
    animMode = sliderMode ? 'state' : 'blend';
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
        updateVector(transformedVArrow, M.multiply(V));
        updateVector(transformedWArrow, M.multiply(W));
        updateVector(transformedUArrow, M.multiply(U));
        updateBasis(M);
        updateTransformedShape(M);
        updateTransformedBox(M);
        updateVolumeReadout(M);
    }

    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
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
    document.getElementById(`${axis}-shear`).addEventListener('input', applySliders);
});

const detToggle = document.getElementById('toggle-det');
detToggle.addEventListener('change', (e) => setDetVisible(e.target.checked));
setDetVisible(detToggle.checked); 

const volToggle = document.getElementById('toggle-det-vol');
volToggle.addEventListener('change', (e) => setVolVisible(e.target.checked));
setVolVisible(volToggle.checked); 

toState = readSliderState();
startAnimation();
animate();

