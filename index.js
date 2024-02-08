const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

window.x = nj.random([1000, 2]);

const clear = () => {
    // canvas height / width should match the element height / width
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const drawPoints = (x) => {
    for (var i = 0; i < x.shape[0]; i++) {
        ctx.beginPath();
        ctx.arc(x.get(i, 0) * canvas.width, x.get(i, 1) * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

const animate = () => {
    const x = window.x;
    clear();
    ctx.fillStyle = "green";
    drawPoints(window.x);
    window.requestAnimationFrame(animate);
}


window.requestAnimationFrame(animate);

var a = nj.array([1, 2, 3]);
console.log(a.toString());