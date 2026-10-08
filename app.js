const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const HEIGHT = window.innerHeight;
const WIDTH = window.innerWidth;

canvas.width = WIDTH;
canvas.height = HEIGHT;

const width = canvas.width;
const height = canvas.height;

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

drawVector(2, 4);

function drawVector(endX, endY, startX=0, startY=0) {
    drawLine(startX, startY, endX * intervalX, endY * intervalY);
}

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



