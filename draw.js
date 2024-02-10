import { Gaussian } from "./probability.js";

export const clear = (canvas) => {
    // canvas height / width should match the element height / width
    const ctx = canvas.getContext('2d');
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export const drawPoints = (ctx, points) => {
    for (const point of points) {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

export const drawTouch = (ctx, touch) => {
    ctx.beginPath();
    ctx.arc(touch.x, touch.y, 5, 0, 2 * Math.PI);
    ctx.fill();
}

export const drawClusters = (ctx, clusters) => {
    ctx.globalCompositeOperation = 'lighter';
    const step = 0.01;
    for (let x_ = 0.0; x_ <= 1.0; x_ += step) {
        for (let y_ = 0.0; y_ <= 1.0; y_ += step) {
            for (const cluster of clusters) {
                const g = new Gaussian({mu: cluster.mu, sigma: cluster.cov});
                const p = g.density([x_, y_]);
                ctx.fillStyle = cluster.color;
                ctx.globalAlpha = Math.min(p, 1);
                ctx.fillRect(x_ * canvas.width, y_ * canvas.height, step * canvas.width, step * canvas.height);
            }
        }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.;
}