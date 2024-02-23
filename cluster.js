import { computeClusters } from "./probability.js";

export const updateClusterDensities = (state) => {
    const [mg, densities] = computeClusters(state.clusters, state.bounds, 1);
    for (let i = 0; i < state.clusters.length; i++) {
        state.clusters[i].densities = densities[i];
        state.clusters[i].mg = mg;
    }
}

export const generateNormalDistributedPoint = (state) => {
    const bounds = state.bounds;
    const mu1 = state.touch.x;
    const mu2 = state.touch.y;
    const norm = [ 
        ((jStat.normal.inv(Math.random(), mu1, state.touchVariance(state).x) / canvas.width) + bounds.xmin) * (bounds.xmax - bounds.xmin),
        ((jStat.normal.inv(Math.random(), mu2, state.touchVariance(state).y) / canvas.height) + bounds.ymin) * (bounds.ymax - bounds.ymin)
    ]
    state.x.push(norm);
}
