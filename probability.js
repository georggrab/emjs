
export const directInv = (cov) => {
    const d = 1 / (cov[0][0]*cov[1][1] - cov[0][1]*cov[1][0]);
    return [d, [
        [d * cov[1][1], d * (-cov[0][1])],
        [d * (-cov[1][0]), d * cov[0][0]]
    ]];
}

export const vectorDot = (a, b) => {
    const k = a.length;
    let sum = 0.0;
    for (let i = 0; i < k; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}

export const vectorSub = (a, b) => {
    const k = a.length;
    const res = new Array(k);
    for (let i = 0; i < k; i++) {
        res[i] = a[i] - b[i];
    }
    return res;
}

export const matrixVectorMul = (A, b) => {
    // NxC @ Cx1 -> Nx1
    const res = new Array(b.length).fill(0);
    for (let i = 0; i < A.length; i++) {
        for (let j = 0; j < b.length;j++){
            res[j] += A[i][j] * b[j];
        }
    }
    return res;
}

export const emStep = (X, clusters, prior) => {
    const densities = new Array(clusters.length);
    const norm = new Float64Array(X.length).fill(0); // Nx1, P(Cluster)
    for (let i = 0; i < clusters.length; i++) {
        densities[i] = normalPdfVec(X, clusters[i].mu, clusters[i].cov)
        for (let x = 0; x < X.length; x++) {
            norm[x] += densities[i][x] * prior[i];
        }
    }
    const posterior = new Array(clusters.length); // NxC Array, P(Cluster | X)
    for (let i = 0; i < clusters.length; i++) {
        posterior[i] = new Float64Array(X.length)
        for (let x = 0; x < X.length; x++) {
            posterior[i][x] = (densities[i][x] * prior[i]) / norm[x]
        }
    }
    const total_mass = new Float64Array(clusters.length)
    const newPrior = new Array(clusters.length);
    for (let i = 0; i < clusters.length; i++) {
        total_mass[i] = posterior[i].reduce((a,b) => a + b)
        newPrior[i] = total_mass[i] / X.length;
    }
    const clusterRet = new Array(clusters.length);
    for (let c = 0; c < clusters.length; c++) {
        const frac = 1 / total_mass[c];
        const newMu = [0, 0]
        for (let x = 0; x < X.length; x++) {
            newMu[0] += (1 / total_mass[c]) * posterior[c][x] * X[x][0];
            newMu[1] += (1 / total_mass[c]) * posterior[c][x] * X[x][1];
        }
        const newCov = [[0, 0], [0, 0]];
        const XdX = new Array(X.length);
        const XdY = new Array(X.length);
        for (let x = 0; x < X.length; x++) {
            XdX[x] = X[x][0] - newMu[0];
            XdY[x] = X[x][1] - newMu[1];
        }
        for (let i = 0; i < X.length; i++) {
            //for (let j = 0; j < X.length; j++) {
                newCov[0][0] += frac * posterior[c][i] * XdX[i] * XdX[i];
                newCov[0][1] += frac * posterior[c][i] * XdX[i] * XdY[i];
                newCov[1][0] += frac * posterior[c][i] * XdY[i] * XdX[i]; // UNNECESS.
                newCov[1][1] += frac * posterior[c][i] * XdY[i] * XdY[i]; 
            //}
        }
        clusterRet[c] = [newMu, newCov]
    }
    return [clusterRet, newPrior]
}

window.emStep = emStep;

export const normalPdfVec = (X, mu, cov) => {
    const arr = new Float64Array(X.length).fill(0);
    for (let i = 0; i < X.length; i++) {
        arr[i] = normalPdf(X[i], mu, cov);
    }
    return arr;
}

window.normalPdfVec = normalPdfVec;

export const normalPdf = (x, mu, cov) => {
    const d = mu.length;
    const [det, inv] = directInv(cov)
    if (!isFinite(det) || !isFinite(inv[0][0])) {
        throw "Invalid Covariance Matrix";
    }
    const diff = vectorSub(x, mu);
    const invDiffMul = matrixVectorMul(inv, diff);
    const exponent = vectorDot(diff, invDiffMul);
    const res = Math.exp(-0.5 * exponent) / Math.sqrt(Math.pow(2 * Math.PI, d) * det);
    return res;
}

window.normalPdf = normalPdf;