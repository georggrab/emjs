const canvas = document.getElementById('canvas');
const btnReset = document.getElementById('btn-reset');
const ctx = canvas.getContext('2d');

window.x = []
const var_ = 50;

let touch = undefined;

btnReset.addEventListener('click', () => {
    window.x = [];
    localStorage.setItem('x', JSON.stringify(window.x));
});

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
    localStorage.setItem('x', JSON.stringify(window.x));
});

const clear = () => {
    // canvas height / width should match the element height / width
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const drawPoints = (x) => {
    for (const point of x) {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

const drawTouch = () => {
    ctx.beginPath();
    ctx.arc(touch.x, touch.y, 5, 0, 2 * Math.PI);
    ctx.fill();
}

const generateNormalDistributedPoint = () => {
    const mu1 = touch.x;
    const mu2 = touch.y;
    const norm = { 
        x: jStat.normal.inv(Math.random(), mu1, var_) / canvas.width, 
        y: jStat.normal.inv(Math.random(), mu2, var_) / canvas.height 
    };
    window.x.push(norm);
}

const animate = () => {
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

if (localStorage.getItem('x')) {
    console.log('loading from localstorage');
    try {
        window.x = JSON.parse(localStorage.getItem('x'));
    } catch (e) {
        console.warn('error loading from localstorage', e);
        window.x = [];
    }
}
