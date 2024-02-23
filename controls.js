import { generateNormalDistributedPoint, updateClusterDensities } from "./cluster.js";
import {clear, drawClusterPosteriors, drawLogProbGraph, drawCluster, drawPoints, drawTouch, drawTouchLocation} from './draw.js'
import { directInv } from "./probability.js";

export const updateInputVarianceHandler = (state) => () => {
    state.touchVariance = {
        x: state.inpCovX.value,
        y: state.inpCovY.value,
    }
}

export const updateAnimateHandler = (state) => {
    if (state.inpAnimate.checked) {
        state.interval = setInterval(() => animateHandlerStep(state), 100)
    } else {
        clearInterval(state.interval);
    }
}

export const animateHandlerStep = (state) => {
    // Figure out which state we are in
    if (state.logProbDraft.length === 0) {
        // Pause for a second
        clearInterval(state.interval);
        setTimeout(() => {
            executeEmStep(state);
            updateAnimateHandler(state);
        }, 1000)
        return
    }
    if (state.logProbDraft.length < 10) {
        executeEmStep(state)
    } else {
        // We are done
        clearInterval(state.interval);
        setTimeout(() => {
            resetClusters(state);
            updateAnimateHandler(state); 
        }, 1000);
    }
}

export const canvasWheelEventHandler = (state, e) => {
    const tv = state.touchVariance(state)
    const touchVarianceX = Math.max(0.1, parseFloat(tv.x) + e.deltaX / 100);
    const touchVarianceY = Math.max(0.1, parseFloat(tv.y) + e.deltaY / 100);
    state.inpCovX.value = touchVarianceX.toFixed(2);
    state.inpCovY.value = touchVarianceY.toFixed(2);
    e.stopPropagation();
    e.preventDefault();
}

export const canvasMouseDownHandler = (state, e) => {
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    state.touch = {x, y, click: true};
}

export const canvasMouseMoveHandler = (state, e) => {
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const click = state.touch ? state.touch.click : false;
    state.touch = {x, y, click: click};
}
    
export const canvasMouseUpHandler = (state) => {
    if (state.touch) {
        state.touch = {x: state.touch.x, y: state.touch.y, click: false};
    }
    localStorage.setItem('x', JSON.stringify(state.x));
}

export const canvasMouseOutHandler = (state) => {
    state.touch = undefined;
}


export const resetPoints = (state) => {
    state.x = [];
    localStorage.setItem('x', JSON.stringify(state.x));
}

export const resetClusters = (state) => {
    const cl = [];
    const priors = new Array(state.NUM_CLUSTERS).fill(1/state.NUM_CLUSTERS);
    for (let i = 0; i < state.NUM_CLUSTERS; i++) {
        // Pick a random point between CANVAS_MATH_BOUND_XMIN and CANVAS_MATH_BOUND_XMAX
        const randomPoint = [
            Math.random() * (state.bounds.xmax - state.bounds.xmin) + state.bounds.xmin,
            Math.random() * (state.bounds.ymax - state.bounds.ymin) + state.bounds.ymin
        ];
        const cluster = {
            mu: randomPoint,
            cov: [[10, 0], [0, 10]],
            color: state.DEFAULT_COLORS[i % state.DEFAULT_COLORS.length],
            valid: true
        }
        cl.push(cluster);
    }   
    state.clusters = cl;
    state.prior = priors;
    state.logProbCollector.push(state.logProbDraft);
    state.logProbDraft = [];
    updateClusterDensities(state);
    updateClusterInfo(state);
}

export const executeEmStep = (state) => {
    state.prior = state.prior.filter((p, i) => state.clusters[i].valid);
    state.clusters = state.clusters.filter((c) => c.valid);
    const [newClusters, newPrior, logProb] = emStep(state.x, state.clusters, state.prior);
    state.logProbDraft.push(logProb);
    for (let i = 0; i < state.clusters.length; i++) {
        state.clusters[i].mu = newClusters[i][0]
        state.clusters[i].cov = newClusters[i][1]

        // test if the covariance matrix is valid
        const [det, inv] = directInv(newClusters[i][1])
        if (!isFinite(det) || !isFinite(inv[0][0])) {
            state.clusters[i].valid = false;
        }
    }
    state.prior = newPrior;
    updateClusterDensities(state);
    updateClusterInfo(state);
}

export const getMathJaxVector = (v) => {
    return `\\begin{bmatrix} ${v.map((i) => i.toFixed(2)).join(' \\\\ ')} \\end{bmatrix}`;
}

export const getMathJaxMatrix = (m) => {
    return `\\begin{bmatrix} ${m.map((i) => i.map((j) => j.toFixed(2)).join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;

}

export const updateClusterInfo = (state) => {
    state.divClusterInfo.innerHTML = '';
    for (let i = 0; i < state.clusters.length; i++) {
        const cluster = state.clusters[i];
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
        state.divClusterInfo.appendChild(div);
    }
    if (window.MathJax) {
        MathJax.typeset();
    }
}

export const draw = (state) => {
    clear(state.canvas);
    clear(state.canvasGraph);
    drawLogProbGraph(state.graphCtx(state), [state.logProbDraft].concat(state.logProbCollector));
    if (state.drawPosterior(state)) {
        drawClusterPosteriors(state.ctx(state), state.clusters, 1, state.bounds); 
    }
    for (const cluster of state.clusters) {
        if (cluster.valid) {
            drawCluster(state.ctx(state), cluster, state.bounds)
        }

    }
    drawPoints(state.ctx(state), state.x, state.bounds);
    if (state.touch) {
        drawTouch(state.ctx(state), state.touch, state.touchVariance(state));
        if (state.touch.click) {
            generateNormalDistributedPoint(state);
        }
        drawTouchLocation(state.ctx(state), state.touch, state.bounds);
    }
    window.requestAnimationFrame(() => draw(state));
}

export const loadFromLocalStorage = (state) => {
    if (localStorage.getItem('x')) {
        console.log('loading from localstorage');
        try {
            state.x = JSON.parse(localStorage.getItem('x'));
        } catch (e) {
            console.warn('error loading from localstorage', e);
            state.x = [];
        }
    }
}