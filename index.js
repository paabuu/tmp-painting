function GetSvg(svgText) {
    const $ = selector => document.querySelector(selector);
    const $$ = selector => document.querySelectorAll(selector);
    const container = $('#container');
    $('#container').innerHTML = svgText;
    const svg = $('#container>svg');

    const width = +svg.getAttribute('width').replace('px', '');
    const height = +svg.getAttribute('height').replace('px', '');
    const clientWidth = document.body.clientWidth;
    const ratio = width / clientWidth;
    const w = clientWidth;
    const h = height / ratio;

    container.style.width = `${w}px`;
    container.style.height = `${h}px`;
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.style.display = 'block';

    $$('svg .white').forEach(p => {
        p.addEventListener('click', () => {
            p.setAttribute('style', 'fill: red;')

            const cloneNode = svg.cloneNode(true);
            cloneNode.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';
            cloneNode.style.transfromOrigin =  '50% 50%';
            const div = document.createElement('div');
            div.appendChild(cloneNode);
            window.UpdateSvg(div.innerHTML);
        })
    });


    let zoomDistance = 0;
    let zoomRatio = 1;

    let start;
    let swipeDistance = {x: 0, y: 0};
    let deltaX = 0;
    let deltaY = 0;

    let isDouble = false;
    let isTouch = false;

    document.addEventListener('touchstart', function(e) {
        if (e.touches.length >= 2) {
            const [p1, p2] = e.touches;
            zoomDistance = getDistance(p1, p2);
            // $('#touch').innerHTML = zoomDistance;
            isDouble = true;
        }

        if (e.touches.length === 1) {
            start = e.touches[0];
            isTouch = true;
        }
    });

    $('#container').addEventListener('touchend', function(e) {
        if (isTouch) {
            // 更新transform origin
            swipeDistance = {x: swipeDistance.x + deltaX, y: swipeDistance.y + deltaY};
            deltaX = 0;
            deltaY = 0;
            svg.style.transformOrigin = `${w / 2 - swipeDistance.x * zoomRatio}px ${h / 2 - swipeDistance.y * zoomRatio}px`;
            // svg.style.transform = `matrix(${zoomRatio}, 0, 0, ${zoomRatio}, ${swipeDistance.x}, ${swipeDistance.y})`;
            // svg.style.transformOrigin = `50% 50%`;

            const minX = w * (zoomRatio - 1) / 2;
            const minY = h * (zoomRatio - 1) / 2;

            // if (swipeDistance.x > minX) {
            //     for (let i = swipeDistance.x, j = 1; i >= minX; i -= 1, j++) {
            //         setTimeout(function() {
            //             swipeDistance.x = i;
            //             svg.style.transform = `matrix(${zoomRatio}, 0, 0, ${zoomRatio}, ${i}, ${swipeDistance.y})`;
            //         }, j * 3);
            //     }
            // }
            // if (swipeDistance.x < -minX) {
            //     for (let i = swipeDistance.x, j = 1; i <= -minX; i += 1, j++) {
            //         setTimeout(function() {
            //             swipeDistance.x = i;
            //             svg.style.transform = `matrix(${zoomRatio}, 0, 0, ${zoomRatio}, ${i}, ${swipeDistance.y})`;
            //         }, j * 3);
            //     }
            // }
            // if (swipeDistance.y > minY) {
            //     for (let i = swipeDistance.y, j = 1; i >= minY; i -= 1, j++) {
            //         setTimeout(function() {
            //             swipeDistance.y = i;
            //             svg.style.transform = `matrix(${zoomRatio}, 0, 0, ${zoomRatio}, ${swipeDistance.x}, ${i})`;
            //         }, j * 3);
            //     }
            // }
            // if (swipeDistance.y < -minY) {
            //     for (let i = swipeDistance.y, j = 1; i <= -minY; i += 1, j++) {
            //         setTimeout(function() {
            //             swipeDistance.y = i;
            //             svg.style.transform = `matrix(${zoomRatio}, 0, 0, ${zoomRatio}, ${swipeDistance.x}, ${i})`;
            //         }, j * 3);
            //     }
            // }
        }

        if (isDouble) {
            if (zoomRatio < 1) {
                // $('#touch').innerHTML = 'zoomDistance < 1';
                // const steps = 50;
                // const ratioStep = (1 - zoomRatio) / steps;
                // const xStep = swipeDistance.x / steps;
                // const yStep = swipeDistance.y / steps;
                // for (let s = 1; s <= steps; s++) {
                //     setTimeout(function() {
                //         const r = zoomRatio + s * ratioStep;
                //         // const x = swipeDistance.x + ;
                //         $('#touch').innerHTML = `${swipeDistance.x}, ${swipeDistance.y}`;
                //         svg.style.transform = `matrix(${r}, 0, 0, ${r}, ${swipeDistance.x - s * xStep}, ${swipeDistance.y - s * yStep})`;
                //     }, s * 10)

                //     setTimeout(function() {
                //         svg.style.transform = `matrix(1, 0, 0, 1, 0, 0)`;
                //     }, steps * 10);
                // }
                for (let i = zoomRatio, j = 1; i <= 1; i+=0.01, j++) {
                    setTimeout(function() {
                        zoomRatio = i;
                        svg.style.transform = `matrix(${i}, 0, 0, ${i}, ${swipeDistance.x}, ${swipeDistance.y})`;
                    }, j * 10)
                }
                
                // zoomRatio = 1;
            }
        }
            
        // $('#touch').innerHTML = `r:${zoomRatio}, x: ${swipeDistance.x}, y: ${swipeDistance.y}`

        isDouble = false;
        isTouch = false;
    });

    $('#container').addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (e.touches.length >= 2 && isDouble) {
            const [p1, p2] = e.touches;
            const dis = getDistance(p1, p2);
            if (dis - zoomDistance < 0) {
                if (zoomRatio <= 0.8) return;
                zoomRatio = zoomRatio < 1 ? zoomRatio - 0.05 : zoomRatio  - 0.08;    
                // zoomRatio -= 0.08;        
            } else {
                zoomRatio += 0.03;
            }
            // if (zoomRatio < 1) {
            //     zoomRatio = 1;
            //     swipeDistance = {x: 0, y: 0};
            // }
            svg.style.transform = `matrix(${zoomRatio}, 0, 0, ${zoomRatio}, ${swipeDistance.x}, ${swipeDistance.y})`;
            zoomDistance = dis;
            // $('#touch').innerHTML = `r:${zoomRatio}, x: ${swipeDistance.x}, y: ${swipeDistance.y}`
        }

        if (e.touches.length === 1 && isTouch) {
            const end = e.touches[0];
            deltaX = end.pageX - start.pageX;
            deltaY = end.pageY - start.pageY;

            svg.style.transform = `matrix(${zoomRatio}, 0, 0, ${zoomRatio}, ${swipeDistance.x + deltaX}, ${swipeDistance.y + deltaY})`;

            $('#touch').innerHTML = `r:${zoomRatio}, x: ${swipeDistance.x + deltaX}, y: ${swipeDistance.y + deltaY} istouch`
        }
    });

    function getDistance(p1, p2) {
        const x = p1.pageX - p2.pageX;
        const y = p1.pageY - p2.pageY;
        return Math.sqrt(x * x + y * y);
    }
}

window.GetSvg = GetSvg;

GetSvg(svgText);