const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

window.x = nj.random([2, 20]);

let touch = undefined;

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
    if (touch) {
        touch = {x, y, click: touch.click};
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (touch) {
        touch = {x: touch.x, y: touch.y, click: false};
    }
});

const clear = () => {
    // canvas height / width should match the element height / width
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const drawPoints = (x) => {
    for (var i = 0; i < x.shape[1]; i++) {
        ctx.beginPath();
        ctx.arc(x.get(0, i) * canvas.width, x.get(1, i) * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

const drawTouch = () => {
    ctx.beginPath();
    ctx.arc(touch.x, touch.y, 5, 0, 2 * Math.PI);
    ctx.fill();
}

const generateNormalDistributedPoint = () => {
    const unif = nj.random([2]);
    const mu1 = touch.x;
    const mu2 = touch.y;
    const norm = nj.array([jStat.normal.inv(unif.get(0), mu1, 50) / canvas.width, jStat.normal.inv(unif.get(1), mu2, 50) / canvas.height]);
    window.x = nj.concatenate(window.x, norm.reshape([2, 1]));
}

const animate = () => {
    const x = window.x;
    clear();
    ctx.fillStyle = "green";
    drawPoints(window.x);
    if (touch) {
        drawTouch();
        if (touch.click) {
            generateNormalDistributedPoint();
        }
    }
    window.requestAnimationFrame(animate);
}


window.requestAnimationFrame(animate);

var a = nj.array([1, 2, 3]);
console.log(a.toString());