const canvas = document.getElementById('canvas');
const btnReset = document.getElementById('btn-reset');
const btnEm = document.getElementById('btn-em');
const ctx = canvas.getContext('2d');

import { drawClusters, drawPoints, drawTouch, clear, CANVAS_MATH_BOUND_XMAX, CANVAS_MATH_BOUND_YMAX, CANVAS_MATH_BOUND_XMIN, CANVAS_MATH_BOUND_YMIN } from "./draw.js";
import { emStep } from "./probability.js";

window.x = []

let touch = undefined;
let touchVariance = {
    x: 50,
    y: 100,
}

window.clusters = [
    {mu: [30, 30], cov: [[2, 0], [0, 2]], color: 'blue'},
    {mu: [60, 60], cov: [[6, 0], [0, 6]], color: 'green'},
    {mu: [30, 60], cov: [[24, 3], [3, 24]], color: 'red'},
];
window.prior = [1/3, 1/3, 1/3];

window.clusters = clusters;

btnReset.addEventListener('click', () => {
    window.x = [];
    localStorage.setItem('x', JSON.stringify(window.x));
});

btnEm.addEventListener('click', () => {
    const [newClusters, newPrior] = emStep(window.x, window.clusters, window.prior);
    for (let i = 0; i < window.clusters.length; i++) {
        window.clusters[i].mu = newClusters[i][0]
        window.clusters[i].cov = newClusters[i][1]

    }
    window.prior = newPrior;
})

canvas.addEventListener('mouseout', () => {
    touch = undefined;
    console.log('mouseout')
})

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
    const click = touch ? touch.click : false;
    touch = {x, y, click: click};
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
    const norm = [ 
        ((jStat.normal.inv(Math.random(), mu1, touchVariance.x) / canvas.width) + CANVAS_MATH_BOUND_XMIN) * (CANVAS_MATH_BOUND_XMAX - CANVAS_MATH_BOUND_XMIN), 
        ((jStat.normal.inv(Math.random(), mu2, touchVariance.y) / canvas.height) + CANVAS_MATH_BOUND_YMIN) * (CANVAS_MATH_BOUND_YMAX - CANVAS_MATH_BOUND_YMIN) 
    ]
    window.x.push(norm);
}

const animate = () => {
    clear(canvas);
    drawClusters(ctx, clusters); // Todo draw always, recomute only on E-M step
    ctx.fillStyle = "green";
    ctx.globalAlpha = 1.;
    drawPoints(ctx, window.x);
    if (touch) {
        drawTouch(ctx, touch, touchVariance);
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
