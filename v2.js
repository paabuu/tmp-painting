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

    $('#touch').innerHTML = '11'

    $$('svg .white').forEach(p => {
        p.addEventListener('click', () => {
            p.setAttribute('style', 'fill: red;')

            const cloneNode = svg.cloneNode(true);
            cloneNode.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';
            cloneNode.style.transfromOrigin =  '50% 50%';
            const div = document.createElement('div');
            div.appendChild(cloneNode);
            window.webkit.messageHandlers.UpdateSvg.postMessage(div.innerHTML);
        })
    });

    let scale = 1;
    let pan = {x: 0, y: 0};
    let dx = 0;
    let dy = 0;
    let origin = {x: w / 2, y: h / 2};
    let point = {x: w / 2, y: h / 2};

    // svg.style.transform = `matrix(1.2, 0, 0, 1.2, 0, 0)`;
    var mc = new Hammer.Manager(svg);
    var panInstance = new Hammer.Pan({
        threshold: 2,
        direction: Hammer.DIRECTION_ALL
    });
    var pinchInstance = new Hammer.Pinch();
    mc.add([panInstance, pinchInstance]);

    mc.on('panmove', function(e) {
        const { x, y } = pan;
        const { deltaX, deltaY } = e;
        dx = x + deltaX;
        dy = y + deltaY;

        boundsCheck();
    });

    mc.on('panend', function(e) {
        pan.x = dx;
        pan.y = dy;
        point.x += e.deltaX;
        point.y += e.deltaY
    });

    mc.get('pinch').set({ enable: true });

    mc.on('pinch', function(e) {
        switch(e.additionalEvent) {
            case 'pinchin':
                scale -= .05;
                if (scale < 1) {
                    scale = 1;
                }
                svg.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${pan.x}, ${pan.y})`;
                break;
            case 'pinchout':
                scale += .03;
                svg.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${pan.x}, ${pan.y})`;
                break;
        }

        boundsCheck();
    });

    mc.on('pinchstart', function(e) {
        // 原点在contianer的位置
        try {
            const {x, y} = e.center;
            $('#touch').innerHTML = `${x}-${y}-${scale}`
            origin.x += (x - point.x) / scale;
            origin.y += (y - point.y) / scale;
            point.x = x;
            point.y = y;
            // const range = {x: scale * x - pan.x, y: scale * y - pan.y};
            svg.style.transformOrigin = `${origin.x}px ${origin.y}px`;
            // $('#touch').style.color = 'red';
            // $('#touch').innerHTML = `${origin.x}-${origin.y}-${scale}`
        } catch(e) {
            $('#touch').innerHTML = e
        }
    });

    mc.on('pinchend', function(e) {
        boundsCheck();
        $('#touch').style.color = 'green';
    });

    function boundsCheck() {
        const range = {x: w * (scale - 1) / 2, y: h * (scale - 1) / 2};
        const sign = { x: dx === 0 ? 1 : dx / Math.abs(dx), y: dy === 0 ? 1 : dy / Math.abs(dy)};
        if (Math.abs(dx) >= range.x) {
            dx = sign.x * range.x;
        } 
        if (Math.abs(dy) >= range.y) {
            dy = sign.y * range.y;
        } 

        // $('#touch').innerHTML =   `dx: ${dx}, scale: ${scale}, w: ${w}, rangeX: ${range.x}`
        svg.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${dx}, ${dy})`;
    }

    console.log(mc)
}

window.onload = function() {
    // 阻止双击放大
    var lastTouchEnd = 0;
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    });
    document.addEventListener('touchend', function(event) {
        var now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // 阻止双指放大
    document.addEventListener('gesturestart', function(event) {
        event.preventDefault();
    });
}

function getDistance(p1, p2) {
    const x = p1.pageX - p2.pageX;
    const y = p1.pageY - p2.pageY;
    return Math.sqrt(x * x + y * y);
}

window.GetSvg = GetSvg;

GetSvg(svgText)