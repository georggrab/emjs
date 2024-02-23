import { drawClusterPosteriors, drawTouchLocation, drawPoints, drawTouch, clear, drawCluster, drawLogProbGraph } from "./draw.js";
import { emStep, computeClusters, directInv } from "./probability.js";

const canvas = document.getElementById('canvas');
const canvasGraph = document.getElementById('canvas-graph');
const btnReset = document.getElementById('btn-reset');
const btnEm = document.getElementById('btn-em');
const btnResetClusters = document.getElementById('btn-reset-clusters');
const divClusterInfo = document.getElementById('cluster-info');
const inpCovX = document.getElementById('inp-cov-x');
const inpCovY = document.getElementById('inp-cov-y');
const inpPosterior = document.getElementById('inp-posterior');

const graphCtx = canvasGraph.getContext('2d');
const ctx = canvas.getContext('2d');

window.x = []
window.NUM_CLUSTERS = 3;
window.DEFAULT_COLORS = ['blue', 'green', 'red', 'purple', 'orange', 'yellow', 'pink', 'brown', 'black', 'gray'];

let touch = undefined;
let touchVariance = {
    x: inpCovX.value,
    y: inpCovY.value,
}
window.drawPosterior = inpPosterior.checked;
window.clusters = [
    {mu: [30, 30], cov: [[2, -1], [-1, 2]], color: 'blue', valid: true},
    {mu: [60, 60], cov: [[6, 0], [0, 6]], color: 'green', valid: true},
    {mu: [30, 60], cov: [[1, 0], [0, 1]], color: 'red', valid: true},
];
window.logProbDraft = [];
window.logProbCollector = [];
window.prior = [1/3, 1/3, 1/3];
window.bounds = {
    xmin: 0,
    xmax: 100,
    ymin: 0,
    ymax: 100
}

window.clusters = clusters;


function updateInputVariance() {
    touchVariance = {
        x: inpCovX.value,
        y: inpCovY.value,
    }
}

inpCovX.addEventListener('input', () => updateInputVariance());
inpCovY.addEventListener('input', () => updateInputVariance());
inpPosterior.addEventListener('input', () => {
    drawPosterior = inpPosterior.checked;
});

btnReset.addEventListener('click', () => {
    window.x = [];
    localStorage.setItem('x', JSON.stringify(window.x));
});

btnResetClusters.addEventListener('click', () => {
    const clusters = [];
    const priors = new Array(window.NUM_CLUSTERS).fill(1/window.NUM_CLUSTERS);
    for (let i = 0; i < window.NUM_CLUSTERS; i++) {
        // Pick a random point between CANVAS_MATH_BOUND_XMIN and CANVAS_MATH_BOUND_XMAX
        const randomPoint = [
            Math.random() * (window.bounds.xmax - window.bounds.xmin) + window.bounds.xmin,
            Math.random() * (window.bounds.ymax - window.bounds.ymin) + window.bounds.ymin
        ];
        const cluster = {
            mu: randomPoint,
            cov: [[10, 0], [0, 10]],
            color: window.DEFAULT_COLORS[i % window.DEFAULT_COLORS.length],
            valid: true
        }
        clusters.push(cluster);
    }   
    window.clusters = clusters;
    window.prior = priors;
    window.logProbCollector.push(window.logProbDraft);
    window.logProbDraft = [];
    updateClusterDensities();
    updateClusterInfo();
});

btnEm.addEventListener('click', () => {
    window.prior = window.prior.filter((p, i) => window.clusters[i].valid);
    window.clusters = window.clusters.filter((c) => c.valid);
    const [newClusters, newPrior, logProb] = emStep(window.x, window.clusters, window.prior);
    window.logProbDraft.push(logProb);
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

canvas.addEventListener('wheel', (e) => {
    touchVariance.x = Math.max(0.1, parseFloat(touchVariance.x) + e.deltaX / 100);
    touchVariance.y = Math.max(0.1, parseFloat(touchVariance.y) + e.deltaY / 100);
    inpCovX.value = touchVariance.x.toFixed(2);
    inpCovY.value = touchVariance.y.toFixed(2);
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
    const [mg, densities] = computeClusters(window.clusters, window.bounds, 1);
    for (let i = 0; i < clusters.length; i++) {
        window.clusters[i].densities = densities[i];
        window.clusters[i].mg = mg;
    }
}

const generateNormalDistributedPoint = (bounds) => {
    const mu1 = touch.x;
    const mu2 = touch.y;
    const norm = [ 
        ((jStat.normal.inv(Math.random(), mu1, touchVariance.x) / canvas.width) + bounds.xmin) * (bounds.xmax - bounds.xmin),
        ((jStat.normal.inv(Math.random(), mu2, touchVariance.y) / canvas.height) + bounds.ymin) * (bounds.ymax - bounds.ymin)
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
        // Create box filled with cluster color
        const colorBox = document.createElement('span');
        colorBox.style.backgroundColor = cluster.color;
        colorBox.style.width = '20px';
        colorBox.style.height = '20px';
        colorBox.style.display = 'block';
        colorBox.style.float = 'left';
        colorBox.style.marginRight = '5px';
        const mathJaxContent = document.createElement('div');
        mathJaxContent.innerHTML = `Cluster ${i} (valid: ${cluster.valid}): \\( \\mu_{${i}} = ${getMathJaxVector(cluster.mu)} \\Sigma_{${i}}=${getMathJaxMatrix(cluster.cov)} \\)`;
        div.appendChild(colorBox);
        div.appendChild(mathJaxContent);
        divClusterInfo.appendChild(div);
    }
    if (window.MathJax) {
        MathJax.typeset();
    }
}

const animate = () => {
    clear(canvas);
    clear(canvasGraph);
    drawLogProbGraph(graphCtx, window.logProbCollector.concat([window.logProbDraft]));
    if (window.drawPosterior) {
        drawClusterPosteriors(ctx, clusters, 1, window.bounds); 
    }
    for (const cluster of window.clusters) {
        if (cluster.valid) {
            drawCluster(ctx, cluster, window.bounds)
        }

    }
    drawPoints(ctx, window.x, window.bounds);
    if (touch) {
        drawTouch(ctx, touch, touchVariance);
        if (touch.click) {
            generateNormalDistributedPoint(window.bounds);
        }
        drawTouchLocation(ctx, touch, window.bounds);
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
