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
const inpAnimate = document.getElementById('inp-animate');

const graphCtx = canvasGraph.getContext('2d');
const ctx = canvas.getContext('2d');

let x = []
let NUM_CLUSTERS = 3;
let DEFAULT_COLORS = ['blue', 'green', 'red', 'purple', 'orange', 'yellow', 'pink', 'brown', 'black', 'gray'];
let interval = undefined;
let touch = undefined;
let touchVariance = {
    x: inpCovX.value,
    y: inpCovY.value,
}
let drawPosterior = inpPosterior.checked;
let clusters = [
    {mu: [30, 30], cov: [[2, -1], [-1, 2]], color: 'blue', valid: true},
    {mu: [60, 60], cov: [[6, 0], [0, 6]], color: 'green', valid: true},
    {mu: [30, 60], cov: [[1, 0], [0, 1]], color: 'red', valid: true},
];
let logProbDraft = [];
let logProbCollector = [];
let prior = [1/3, 1/3, 1/3];
let bounds = {
    xmin: 0,
    xmax: 100,
    ymin: 0,
    ymax: 100
}

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
inpAnimate.addEventListener('input', () => updateAnimate());

btnReset.addEventListener('click', () => {
    x = [];
    localStorage.setItem('x', JSON.stringify(x));
});

const resetClusters = () => {
    const cl = [];
    const priors = new Array(NUM_CLUSTERS).fill(1/NUM_CLUSTERS);
    for (let i = 0; i < NUM_CLUSTERS; i++) {
        // Pick a random point between CANVAS_MATH_BOUND_XMIN and CANVAS_MATH_BOUND_XMAX
        const randomPoint = [
            Math.random() * (bounds.xmax - bounds.xmin) + bounds.xmin,
            Math.random() * (bounds.ymax - bounds.ymin) + bounds.ymin
        ];
        const cluster = {
            mu: randomPoint,
            cov: [[10, 0], [0, 10]],
            color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            valid: true
        }
        cl.push(cluster);
    }   
    clusters = cl;
    prior = priors;
    logProbCollector.push(logProbDraft);
    logProbDraft = [];
    updateClusterDensities();
    updateClusterInfo();
}

btnResetClusters.addEventListener('click', resetClusters);

const executeEmStep = () => {
    prior = prior.filter((p, i) => clusters[i].valid);
    clusters = clusters.filter((c) => c.valid);
    const [newClusters, newPrior, logProb] = emStep(x, clusters, prior);
    logProbDraft.push(logProb);
    for (let i = 0; i < clusters.length; i++) {
        clusters[i].mu = newClusters[i][0]
        clusters[i].cov = newClusters[i][1]

        // test if the covariance matrix is valid
        const [det, inv] = directInv(newClusters[i][1])
        if (!isFinite(det) || !isFinite(inv[0][0])) {
            clusters[i].valid = false;
        }
    }
    prior = newPrior;
    updateClusterDensities();
    updateClusterInfo();
}

btnEm.addEventListener('click', executeEmStep)

canvas.addEventListener('wheel', (e) => {
    touchVariance.x = Math.max(0.1, parseFloat(touchVariance.x) + e.deltaX / 100);
    touchVariance.y = Math.max(0.1, parseFloat(touchVariance.y) + e.deltaY / 100);
    inpCovX.value = touchVariance.x.toFixed(2);
    inpCovY.value = touchVariance.y.toFixed(2);
    e.stopPropagation();
    e.preventDefault();
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
    localStorage.setItem('x', JSON.stringify(x));
});

const updateClusterDensities = () => {
    const [mg, densities] = computeClusters(clusters, bounds, 1);
    for (let i = 0; i < clusters.length; i++) {
        clusters[i].densities = densities[i];
        clusters[i].mg = mg;
    }
}

const generateNormalDistributedPoint = (bounds) => {
    const mu1 = touch.x;
    const mu2 = touch.y;
    const norm = [ 
        ((jStat.normal.inv(Math.random(), mu1, touchVariance.x) / canvas.width) + bounds.xmin) * (bounds.xmax - bounds.xmin),
        ((jStat.normal.inv(Math.random(), mu2, touchVariance.y) / canvas.height) + bounds.ymin) * (bounds.ymax - bounds.ymin)
    ]
    x.push(norm);
}

const getMathJaxVector = (v) => {
    return `\\begin{bmatrix} ${v.map((i) => i.toFixed(2)).join(' \\\\ ')} \\end{bmatrix}`;
}

const getMathJaxMatrix = (m) => {
    return `\\begin{bmatrix} ${m.map((i) => i.map((j) => j.toFixed(2)).join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;

}

const updateClusterInfo = () => {
    divClusterInfo.innerHTML = '';
    for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
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
        mathJaxContent.innerHTML = `\\( \\mu_{${i}} = ${getMathJaxVector(cluster.mu)} \\Sigma_{${i}}=${getMathJaxMatrix(cluster.cov)} \\)`;
        div.appendChild(colorBox);
        div.appendChild(mathJaxContent);
        divClusterInfo.appendChild(div);
    }
    if (window.MathJax) {
        MathJax.typeset();
    }
}

const updateAnimate = () => {
    if (inpAnimate.checked) {
        interval = setInterval(animateHandlerStep, 100)
    } else {
        clearInterval(interval);
    }
}

const animateHandlerStep = () => {
    // Figure out which state we are in
    if (logProbDraft.length === 0) {
        // Pause for a second
        clearInterval(interval);
        setTimeout(() => {
            executeEmStep();
            updateAnimate();
        }, 1000)
        return
    }
    if (logProbDraft.length < 10) {
        executeEmStep()
    } else {
        // We are done
        clearInterval(interval);
        setTimeout(() => {
            resetClusters();
            updateAnimate(); 
        }, 1000);
    }
}

const draw = () => {
    clear(canvas);
    clear(canvasGraph);
    drawLogProbGraph(graphCtx, [logProbDraft].concat(logProbCollector));
    if (drawPosterior) {
        drawClusterPosteriors(ctx, clusters, 1, bounds); 
    }
    for (const cluster of clusters) {
        if (cluster.valid) {
            drawCluster(ctx, cluster, bounds)
        }

    }
    drawPoints(ctx, x, bounds);
    if (touch) {
        drawTouch(ctx, touch, touchVariance);
        if (touch.click) {
            generateNormalDistributedPoint(bounds);
        }
        drawTouchLocation(ctx, touch, bounds);
    }
    window.requestAnimationFrame(draw);
}

resetClusters();
updateClusterDensities();
updateClusterInfo();
window.requestAnimationFrame(draw);

if (localStorage.getItem('x')) {
    console.log('loading from localstorage');
    try {
        x = JSON.parse(localStorage.getItem('x'));
    } catch (e) {
        console.warn('error loading from localstorage', e);
        x = [];
    }
}
