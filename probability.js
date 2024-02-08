export const normalPdf = (x, mu, cov) => {
    const d = mu.length;
    const det = jStat.det(cov);
    const inv = jStat.inv(cov);
    const diff = jStat.subtract(x, mu);
    const exponent = jStat.dot(diff, jStat.multiply(inv, diff));
    return Math.exp(-0.5 * exponent) / Math.sqrt(Math.pow(2 * Math.PI, d) * det);
}