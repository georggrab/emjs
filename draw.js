export const clear = (canvas) => {
    // canvas height / width should match the element height / width
    const ctx = canvas.getContext('2d');
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export const drawPoints = (ctx, points, bounds) => {
    ctx.fillStyle = 'black';
    for (const point of points) {
        const absX = (point[0] + bounds.xmin) / (bounds.xmax - bounds.xmin)
        const absY = (point[1] + bounds.ymin) / (bounds.ymax - bounds.ymin)
        ctx.beginPath();
        ctx.arc(absX * canvas.width, absY * canvas.height, 2, 0, 2 * Math.PI);
        ctx.fill();
    }
}

export const drawLogProbGraph = (ctx, logProbLines) => {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const offsetX = 50.5;
    const offsetY = 20.5;
    const drawLastN = 10;
    const spacingX = 50;
    const tickSize = 5;
    const yTickLocMax = offsetY;
    const yTickLocMin = canvas.height - 2 * offsetY;
    

    const maxValue = logProbLines.flat().length > 0 ? Math.max(...logProbLines.flat()): 0;
    const minValue = logProbLines.flat().length > 0 ? Math.min(...logProbLines.flat()): -1;
    
    // Draw xticks
    let xLoc = offsetX + spacingX;
    for (let i = 0; i < drawLastN; i++) {
        ctx.strokeStyle = '#dddddd'
        ctx.beginPath();
        ctx.moveTo(xLoc, 0);
        ctx.lineTo(xLoc, canvas.height);
        ctx.stroke();
        ctx.strokeStyle = 'black'
        ctx.beginPath();
        ctx.moveTo(xLoc, canvas.height - offsetY - tickSize);
        ctx.lineTo(xLoc, canvas.height - offsetY + tickSize);
        ctx.stroke();
        ctx.font = "12px Arial";
        ctx.fillText(`${i+1}`, xLoc - 3, canvas.height - offsetY + 17);
        xLoc += spacingX;
    }
    // Draw 2 yticks: minimum and maximum
    ctx.strokeStyle = '#dddddd'
    ctx.beginPath();
    ctx.moveTo(0, yTickLocMax);
    ctx.lineTo(canvas.width, yTickLocMax);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, yTickLocMin);
    ctx.lineTo(canvas.width, yTickLocMin);
    ctx.stroke();
    ctx.font = "12px Arial";
    const text = `${maxValue.toFixed(2)}`.padStart(5, ' ');
    ctx.fillText(text, 10, yTickLocMax + 4);
    ctx.beginPath();
    ctx.moveTo(0, yTickLocMin);
    ctx.lineTo(canvas.width, yTickLocMin);
    ctx.stroke();
    ctx.font = "12px Arial";
    const textMin = `${minValue.toFixed(2)}`.padStart(5, ' ');
    ctx.fillText(textMin, 10, yTickLocMin + 4);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    // Draw coordinate system
    // Draw x-axis
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - offsetY);
    ctx.lineTo(canvas.width, canvas.height - offsetY);
    ctx.stroke();
    // Draw y-axis
    ctx.beginPath();
    ctx.moveTo(offsetX, 0);
    ctx.lineTo(offsetX, canvas.height);
    ctx.stroke();


    // Black y ticks
    ctx.strokeStyle = 'black'
    ctx.beginPath();
    ctx.moveTo(offsetX - tickSize, yTickLocMax)
    ctx.lineTo(offsetX + tickSize, yTickLocMax)
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(offsetX - tickSize, yTickLocMin)
    ctx.lineTo(offsetX + tickSize, yTickLocMin)
    ctx.stroke();

    // Now, draw the actual data
    for (let c = 0; c < logProbLines.length; c++) {
        const logProb = logProbLines[c];
        ctx.globalAlpha = 1 / (c + 1);
        for (let i = 0; i < drawLastN; i++) {
            const xLoc = offsetX + (i + 1) * spacingX;
            const yValue = logProb[i]
            const yRelative = (yValue - minValue) / (maxValue - minValue);
            const yLoc = yRelative * (yTickLocMax - yTickLocMin) + yTickLocMin;

            ctx.beginPath();
            ctx.arc(xLoc, yLoc, 2, 0, 2 * Math.PI);
            ctx.fill();
            if (i !== drawLastN - 1) {
                const nextYValue = logProb[i + 1]
                const nextYRelative = (nextYValue - minValue) / (maxValue - minValue);
                const nextYLoc = nextYRelative * (yTickLocMax - yTickLocMin) + yTickLocMin;
                ctx.beginPath();
                ctx.moveTo(xLoc, yLoc);
                ctx.lineTo(xLoc + spacingX, nextYLoc);
                ctx.stroke();
            }
        
        }
        ctx.globalAlpha = 1;
    }
    
    ctx.font = "16px Arial";
    ctx.fillText("Log Probabilities", canvas.width - 130, 15, 130);
    
    if (logProbLines.length > 0 && logProbLines[0].length > 0) {
        const currentValue = logProbLines[0][logProbLines[0].length - 1];
        ctx.fillText(`Current: ${currentValue.toFixed(2)}`, canvas.width - 130, 35, 130);
    }
    
}

export const drawTouch = (ctx, touch, variance) => {
    ctx.beginPath();
    ctx.arc(touch.x, touch.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    if (variance) {
        // Draw 66% confidence interval
        ctx.beginPath();
        // Lighter stroke
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.ellipse(touch.x, touch.y, 1 * variance.x, 1 * variance.y, 0, 0, 2 * Math.PI);
        ctx.stroke();
        // Darker stroke
        // Draw 95% confidence interval
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.ellipse(touch.x, touch.y, 2 * variance.x, 2 * variance.y, 0, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

export const drawCluster = (ctx, cluster, bounds) => {
    // Based on mu and cov, draw an ellipse
    // Eigendecomposition of cov
    const eig = numeric.eig(cluster.cov);
    const [eigValues, eigVectors] = [eig.lambda.x, eig.E.x];
    const angle = Math.acos(numeric.dot(eigVectors[0], [1, 0]));
    ctx.beginPath();
    ctx.strokeStyle = cluster.color;
    // Convert from math coordinates to canvas coordinates for drawing
    const absX = (cluster.mu[0] + bounds.xmin) / (bounds.xmax - bounds.xmin)
    const absY = (cluster.mu[1] + bounds.ymin) / (bounds.ymax - bounds.ymin)
    ctx.ellipse(absX * canvas.width, absY * canvas.height, Math.max(eigValues[0], 3), Math.max(eigValues[1], 3), angle, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(absX * canvas.width, absY * canvas.height, Math.max(eigValues[0] * 2, 6), Math.max(eigValues[1] * 2, 6), angle, 0, 2 * Math.PI);
    ctx.stroke();

}

export const drawTouchLocation = (ctx, touch, bounds) => {
    // Given touch object, write touch location to the bottom right
    ctx.font = "12px Arial";
    ctx.fillStyle = "black";
    const x_ = ((touch.x / ctx.canvas.width) + bounds.xmin) * (bounds.xmax - bounds.xmin)
    const y_ = ((touch.y / ctx.canvas.height) + bounds.ymin) * (bounds.ymax - bounds.ymin)
    ctx.fillText(`(${x_.toFixed(2)}, ${y_.toFixed(2)})`, 10, canvas.height - 10);
}

export const drawClusterPosteriors = (ctx, clusters, step, bounds) => {
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
        ctx.globalAlpha = Math.min(posterior, 1) / 2;
        
        const absX = (x_ + bounds.xmin) / (bounds.xmax - bounds.xmin)
        const absY = (y_ + bounds.ymin) / (bounds.ymax - bounds.ymin)
        const absStepX = (step + bounds.xmin) / (bounds.xmax - bounds.xmin)
        const absStepY = (step + bounds.ymin) / (bounds.ymax - bounds.ymin)

        ctx.fillRect(absX * canvas.width, absY * canvas.height, absStepX * canvas.width, absStepY * canvas.height);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.;
}