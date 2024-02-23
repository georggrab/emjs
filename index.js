import { updateClusterDensities } from "./cluster.js";
import { canvasMouseDownHandler, canvasMouseMoveHandler, canvasMouseOutHandler, canvasMouseUpHandler, canvasWheelEventHandler, draw, executeEmStep, loadFromLocalStorage, resetClusters, resetPoints, updateAnimateHandler, updateClusterInfo, updateInputVarianceHandler } from "./controls.js";

const state = {
    canvas: document.getElementById('canvas'),
    canvasGraph: document.getElementById('canvas-graph'),
    btnReset: document.getElementById('btn-reset'),
    btnEm: document.getElementById('btn-em'),
    btnResetClusters: document.getElementById('btn-reset-clusters'),
    divClusterInfo: document.getElementById('cluster-info'),
    inpCovX: document.getElementById('inp-cov-x'),
    inpCovY: document.getElementById('inp-cov-y'),
    inpPosterior: document.getElementById('inp-posterior'),
    inpAnimate: document.getElementById('inp-animate'),

    x: [],
    NUM_CLUSTERS: 3,
    DEFAULT_COLORS: ['blue', 'green', 'red', 'purple', 'orange', 'yellow', 'pink', 'brown', 'black', 'gray'],
    interval: undefined,
    touch: undefined,
    clusters: [
        { mu: [30, 30], cov: [[2, -1], [-1, 2]], color: 'blue', valid: true },
        { mu: [60, 60], cov: [[6, 0], [0, 6]], color: 'green', valid: true },
        { mu: [30, 60], cov: [[1, 0], [0, 1]], color: 'red', valid: true },
    ],
    logProbDraft: [],
    logProbCollector: [],
    prior: [1 / 3, 1 / 3, 1 / 3],
    bounds: {
        xmin: 0,
        xmax: 100,
        ymin: 0,
        ymax: 100
    },
    graphCtx: (state) => state.canvasGraph.getContext('2d'),
    ctx: (state) => state.canvas.getContext('2d'),
    touchVariance: (state) => ({
        x: state.inpCovX.value,
        y: state.inpCovY.value,
    }),
    drawPosterior: (state) => state.inpPosterior.checked,
}

state.inpCovX.addEventListener('input', () => updateInputVarianceHandler(state));
state.inpCovY.addEventListener('input', () => updateInputVarianceHandler(state));
state.inpAnimate.addEventListener('input', () => updateAnimateHandler(state));
state.btnReset.addEventListener('click', () => resetPoints(state));
state.btnResetClusters.addEventListener('click', () => resetClusters(state));
state.btnEm.addEventListener('click', () => executeEmStep(state))
state.canvas.addEventListener('wheel', (e) => canvasWheelEventHandler(state, e));
state.canvas.addEventListener('mouseout', () => canvasMouseOutHandler(state));
state.canvas.addEventListener('mousedown', (e) => canvasMouseDownHandler(state, e));
state.canvas.addEventListener('mousemove', (e) => canvasMouseMoveHandler(state, e));
state.canvas.addEventListener('mouseup', () => canvasMouseUpHandler(state));

resetClusters(state);
updateClusterDensities(state);
updateClusterInfo(state);
window.requestAnimationFrame(() => draw(state));
loadFromLocalStorage(state);