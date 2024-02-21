const canvas = document.getElementById('canvas');
const btnReset = document.getElementById('btn-reset');
const btnEm = document.getElementById('btn-em');
const ctx = canvas.getContext('2d');
const divClusterInfo = document.getElementById('cluster-info');

import { drawClusterPosteriors, drawTouchLocation, drawPoints, drawTouch, clear, CANVAS_MATH_BOUND_XMAX, CANVAS_MATH_BOUND_YMAX, CANVAS_MATH_BOUND_XMIN, CANVAS_MATH_BOUND_YMIN, drawCluster } from "./draw.js";
import { emStep, computeClusters, directInv } from "./probability.js";

window.x = []

let touch = undefined;
let touchVariance = {
    x: 50,
    y: 100,
}

window.clusters = [
    {mu: [30, 30], cov: [[2, -1], [-1, 2]], color: 'blue', valid: true},
    {mu: [60, 60], cov: [[6, 0], [0, 6]], color: 'green', valid: true},
    {mu: [30, 60], cov: [[1, 0], [0, 1]], color: 'red', valid: true},
];
window.prior = [1/3, 1/3, 1/3];

window.clusters = clusters;

btnReset.addEventListener('click', () => {
    window.x = [];
    localStorage.setItem('x', JSON.stringify(window.x));
});

btnEm.addEventListener('click', () => {
    window.prior = window.prior.filter((p, i) => window.clusters[i].valid);
    window.clusters = window.clusters.filter((c) => c.valid);
    const [newClusters, newPrior] = emStep(window.x, window.clusters, window.prior);
    for (let i = 0; i < window.clusters.length; i++) {
        window.clusters[i].mu = newClusters[i][0]
        window.clusters[i].cov = newClusters[i][1]

        // test if the covariance matrix is valid
        const [det, inv] = directInv(newClusters[i][1])
        if (!isFinite(det) || !isFinite(inv[0][0])) {
            window.clusters[i].valid = false;
        }
    }
    window.prior = newPrior;
    updateClusterDensities();
    updateClusterInfo();
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

const updateClusterDensities = () => {
    const [mg, densities] = computeClusters(window.clusters, {xmin: CANVAS_MATH_BOUND_XMIN, xmax: CANVAS_MATH_BOUND_XMAX, ymin: CANVAS_MATH_BOUND_YMIN, ymax: CANVAS_MATH_BOUND_YMAX}, 1);
    for (let i = 0; i < clusters.length; i++) {
        window.clusters[i].densities = densities[i];
        window.clusters[i].mg = mg;
    }
}

const generateNormalDistributedPoint = () => {
    const mu1 = touch.x;
    const mu2 = touch.y;
    const norm = [ 
        ((jStat.normal.inv(Math.random(), mu1, touchVariance.x) / canvas.width) + CANVAS_MATH_BOUND_XMIN) * (CANVAS_MATH_BOUND_XMAX - CANVAS_MATH_BOUND_XMIN), 
        ((jStat.normal.inv(Math.random(), mu2, touchVariance.y) / canvas.height) + CANVAS_MATH_BOUND_YMIN) * (CANVAS_MATH_BOUND_YMAX - CANVAS_MATH_BOUND_YMIN) 
    ]
    window.x.push(norm);
}

const getMathJaxVector = (v) => {
    return `\\begin{bmatrix} ${v.map((i) => i.toFixed(2)).join(' \\\\ ')} \\end{bmatrix}`;
}

const getMathJaxMatrix = (m) => {
    return `\\begin{bmatrix} ${m.map((i) => i.map((j) => j.toFixed(2)).join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;

}

const updateClusterInfo = () => {
    divClusterInfo.innerHTML = '';
    for (let i = 0; i < window.clusters.length; i++) {
        const cluster = window.clusters[i];
        const div = document.createElement('div');
        div.innerHTML = `Cluster ${i} (valid: ${cluster.valid}): \\( \\mu_{${i}} = ${getMathJaxVector(cluster.mu)} \\Sigma_{${i}}=${getMathJaxMatrix(cluster.cov)} \\)`;
        divClusterInfo.appendChild(div);
    }
    if (window.MathJax) {
        MathJax.typeset();
    }
}

const animate = () => {
    clear(canvas);
    //drawClusterPosteriors(ctx, clusters, 1); // Todo draw always, recomute only on E-M step
    ctx.fillStyle = "green";
    ctx.globalAlpha = 1.;
    for (const cluster of window.clusters) {
        if (cluster.valid) {
            drawCluster(ctx, cluster)
        }

    }
    drawPoints(ctx, window.x);
    if (touch) {
        drawTouch(ctx, touch, touchVariance);
        if (touch.click) {
            generateNormalDistributedPoint();
        }
        drawTouchLocation(ctx, touch);
    }
    window.requestAnimationFrame(animate);
}

updateClusterDensities();
updateClusterInfo();
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
