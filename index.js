const canvas = document.getElementById('canvas');
const btnReset = document.getElementById('btn-reset');
const ctx = canvas.getContext('2d');

import { drawClusters, drawPoints, drawTouch, clear } from "./draw.js";

window.x = []
const var_ = 50;

let touch = undefined;

const clusters = [
    {mu: [0.3, 0.3], cov: [[0.01, 0], [0, 0.01]], color: 'blue'},
    {mu: [0.6, 0.6], cov: [[0.01, 0], [0, 0.01]], color: 'green'},
];

btnReset.addEventListener('click', () => {
    window.x = [];
    localStorage.setItem('x', JSON.stringify(window.x));
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    touch = {x, y, click: true};
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (touch) {
        touch = {x, y, click: touch.click};
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (touch) {
        touch = {x: touch.x, y: touch.y, click: false};
    }
    localStorage.setItem('x', JSON.stringify(window.x));
});

const generateNormalDistributedPoint = () => {
    const mu1 = touch.x;
    const mu2 = touch.y;
    const norm = { 
        x: jStat.normal.inv(Math.random(), mu1, var_) / canvas.width, 
        y: jStat.normal.inv(Math.random(), mu2, var_) / canvas.height 
    };
    window.x.push(norm);
}

const animate = () => {
    clear(canvas);
    drawClusters(ctx, clusters);
    ctx.fillStyle = "green";
    ctx.globalAlpha = 1.;
    drawPoints(ctx, window.x);
    if (touch) {
        drawTouch(ctx, touch);
        if (touch.click) {
            generateNormalDistributedPoint();
        }
    }
    window.requestAnimationFrame(animate);
}


window.requestAnimationFrame(animate);

if (localStorage.getItem('x')) {
    console.log('loading from localstorage');
    try {
        window.x = JSON.parse(localStorage.getItem('x'));
    } catch (e) {
        console.warn('error loading from localstorage', e);
        window.x = [];
    }
}
