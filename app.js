// ----------- CANVAS ----------------------

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const wrapper = canvas.parentElement;

const width = wrapper.clientWidth;
const height = width;

canvas.width = width;
canvas.height = height;

const intervals = 10;

const intervalX = width / (intervals * 2);
const intervalY = height / (intervals * 2);

// Shift origin (0, 0) to the center of the canvas
ctx.translate(width / 2, height / 2);

// Invert Y-axis so that +Y is up
ctx.scale(1, -1);

// Draw axes
drawLine(0, -height / 2, 0, height / 2);
drawLine(-width / 2, 0, width / 2, 0);

drawYGrid(intervals);
drawXGrid(intervals);

function drawVector(vector, startX=0, startY=0, color='rgba(0, 0, 0, 1)') {
    drawLine(startX, startY, vector[0][0] * intervalX, vector[1][0] * intervalY, 1, color);
};

// ---------- SET UP ----------

// Draw grid function
function drawYGrid(n) {
    for (let i = 1; i < n; i++) {
        drawLine(i * intervalX, -height / 2, i * intervalX, height / 2, 0.3);
    }

    for (let i = 1; i < n; i++) {
        drawLine(-i * intervalX, -height / 2, -i * intervalX, height / 2, 0.3);
    }
}

function drawXGrid(n) {
    for (let i = 1; i < n; i++) {
        drawLine(-width / 2 , i * intervalY, width / 2, i * intervalY, 0.3);
    }

    for (let i = 1; i < n; i++) {
        drawLine(-width / 2 , -i * intervalY, width / 2, -i * intervalY, 0.3);
    }
}

// Draw line function
function drawLine(startX, startY, endX, endY, lineWidth=1, strokeStyle='rgba(0, 0, 0, 1)') {
    ctx.beginPath();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
}

// ------------- FORMULAS --------------

const container = document.getElementById('formula-container');

function writeMatrix(m) {
    returnString = String.raw`\begin{bmatrix} `;

    for (let i = 0; i < m.rows; i++) {
        for (let j = 0; j < m.cols; j++) {
            if (j != 0) {
                returnString += ' & ';
            }
            console.log(m.get(i + 1, j + 1));
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
    drawVector(V.data);
    drawVector(T.multiply(V).data, 0, 0, 'rgba(255, 0, 0, 1)');

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
    [1]
]);

let T = Matrix.create([
    [2, 3],
    [-1, 5]
]);

transformVector(T, V);



/* katex.render(
  String.raw``,
  container,
  {
    displayMode: true,
    throwOnError: false
  }
); */



