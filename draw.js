import { normalPdf } from "./probability.js";

export const CANVAS_MATH_BOUND_XMIN = 0
export const CANVAS_MATH_BOUND_XMAX = 100
export const CANVAS_MATH_BOUND_YMIN = 0
export const CANVAS_MATH_BOUND_YMAX = 100

export const clear = (canvas) => {
    // canvas height / width should match the element height / width
    const ctx = canvas.getContext('2d');
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export const drawPoints = (ctx, points) => {
    for (const point of points) {
        const absX = (point[0] + CANVAS_MATH_BOUND_XMIN) / (CANVAS_MATH_BOUND_XMAX - CANVAS_MATH_BOUND_XMIN)
        const absY = (point[1] + CANVAS_MATH_BOUND_XMIN) / (CANVAS_MATH_BOUND_XMAX - CANVAS_MATH_BOUND_XMIN)
        ctx.beginPath();
        ctx.arc(absX * canvas.width, absY * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

export const drawTouch = (ctx, touch, variance) => {
    ctx.beginPath();
    ctx.arc(touch.x, touch.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    if (variance) {
        // Draw 95% confidence interval
        ctx.beginPath();
        // Lighter stroke
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.ellipse(touch.x, touch.y, 1 * variance.x, 1 * variance.y, 0, 0, 2 * Math.PI);
        ctx.stroke();
        // Darker stroke
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.ellipse(touch.x, touch.y, 2 * variance.x, 2 * variance.y, 0, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

export const drawClusters2 = (ctx, clusters, step) => {
    ctx.globalCompositeOperation = 'lighter';
    const canvas = ctx.canvas;
    for (let i = 0; i < clusters[0].mg.length; i++) {
        let argmax = 0;
        const arr = clusters.map((c) => c.densities[i]);
        arr.forEach((p, i) => {
            if (p > arr[argmax]) {
                argmax = i;
            }
        });
        const posterior = arr[argmax] / arr.reduce((a, b) => a + b, 0);
        const [x_, y_] = clusters[argmax].mg[i];
        ctx.fillStyle = clusters[argmax].color;
        ctx.globalAlpha = Math.min(posterior, 1);
        const absX = (x_ + CANVAS_MATH_BOUND_XMIN) / (CANVAS_MATH_BOUND_XMAX - CANVAS_MATH_BOUND_XMIN)
        const absY = (y_ + CANVAS_MATH_BOUND_YMIN) / (CANVAS_MATH_BOUND_YMAX - CANVAS_MATH_BOUND_YMIN)
        const absStepX = (step + CANVAS_MATH_BOUND_XMIN) / (CANVAS_MATH_BOUND_XMAX - CANVAS_MATH_BOUND_XMIN)
        const absStepY = (step + CANVAS_MATH_BOUND_YMIN) / (CANVAS_MATH_BOUND_YMAX - CANVAS_MATH_BOUND_YMIN)
        ctx.fillRect(absX * canvas.width, absY * canvas.height, absStepX * canvas.width, absStepY * canvas.height);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.;
}

export const drawClusters = (ctx, clusters) => {
    ctx.globalCompositeOperation = 'lighter';
    const step = 1
    for (let x_ = CANVAS_MATH_BOUND_XMIN; x_ <= CANVAS_MATH_BOUND_XMAX; x_ += step) {
        for (let y_ = CANVAS_MATH_BOUND_YMIN; y_ <= CANVAS_MATH_BOUND_YMAX; y_ += step) {
            for (const cluster of clusters) {
                try {
                    const p = normalPdf([x_, y_], cluster.mu, cluster.cov)
                    ctx.fillStyle = cluster.color;
                    ctx.globalAlpha = Math.min(p, 1);

                    const absX = (x_ + CANVAS_MATH_BOUND_XMIN) / (CANVAS_MATH_BOUND_XMAX - CANVAS_MATH_BOUND_XMIN)
                    const absY = (y_ + CANVAS_MATH_BOUND_XMIN) / (CANVAS_MATH_BOUND_XMAX - CANVAS_MATH_BOUND_XMIN)
                    const absStepX = (step + CANVAS_MATH_BOUND_XMIN) / (CANVAS_MATH_BOUND_XMAX - CANVAS_MATH_BOUND_XMIN)
                    const absStepY = (step + CANVAS_MATH_BOUND_XMIN) / (CANVAS_MATH_BOUND_XMAX - CANVAS_MATH_BOUND_XMIN)
                    ctx.fillRect(absX * canvas.width, absY * canvas.height, absStepX * canvas.width, absStepY * canvas.height);
                } catch (e) {
                    continue; // invalid covariance matrix
                }
            }
        }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.;
}