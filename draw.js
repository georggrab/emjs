import { normalPdf } from "./probability.js";

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
}