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
    const w = clientWidth / 2;
    const h = height / ratio / 2;

    // container.style.width = `${w}px`;
    container.style.height = `${h}px`;
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.style.display = 'block';
    $$('svg path').forEach(p => {
        p.addEventListener('click', () => {
            $('#touch').innerHTML = p.getAttribute('id');
            const fill = p.getAttribute('fill');
            const classname = p.getAttribute('class');
            if (fill === 'black' || !fill || classname.indexOf(color.slice(1)) < 0) return;
            p.setAttribute('fill', color);
            p.setAttribute('painted', true);
            p.style.fill = color;

            const cloneNode = svg.cloneNode(true);
            cloneNode.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';
            cloneNode.style.transfromOrigin =  '50% 50%';
            const div = document.createElement('div');
            div.appendChild(cloneNode);
            window.webkit.messageHandlers.UpdateSvg.postMessage(div.innerHTML);
        })
    });

    /**
     * @var {number}: scale 缩放比例
     * @var {object}: pan 总偏移距离
     * @var {number}: dx x方向每次划动的距离
     * @var {number}: dy y方向每次划动的距离
     * @var {object}: origin 对称中心的坐标
     * @var {object}: point 缩放时的中心坐标
     * @var {string}: color 画笔颜色
     */

    let scale = 1;
    let pan = {x: 0, y: 0};
    let dx = 0;
    let dy = 0;
    let origin = {x: w / 2, y: h / 2};
    let point = {x: w / 2, y: h / 2};
    let color = 'red';

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
        point.y += e.deltaY;
        dx = 0;
        dy = 0;
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
            origin.x += (Math.abs(dx) + x - point.x) / scale;
            origin.y += (Math.abs(dy) + y - point.y) / scale;
            $('#touch').innerHTML = `${x}-${origin.x} ${y}-${origin.y}`;
            point.x = x;
            point.y = y;

            if (origin.x > w) {
                origin.x = w;
                point.x = w;
            }

            if (origin.x < 0) {
                origin.x = 0;
                point.x = 0;
            }

            if (origin.y > h) {
                origin.y = h;
                point.y = h;
            }

            if (origin.y < 0) {
                origin.y = 0;
                point.y = 0;
            }
            svg.style.transformOrigin = `${origin.x}px ${origin.y}px`;
        } catch(e) {
            $('#touch').innerHTML = e
        }
    });

    mc.on('pinchend', function(e) {
        boundsCheck();
    });

    function boundsCheck() {
        // 根据对称中心计算左右边界
        const range = {
            left: w * (scale - 1) * origin.x / w,
            right: w * (scale - 1) * (1 - origin.x / w),
            top: h * (scale - 1) * origin.y / h,
            bottom: h * (scale - 1) * (1 - origin.y / h)
        };

        // 向左划
        if (dx < 0 && Math.abs(dx) >= range.right) {
            dx = -range.right;
        }
        // 向右划
        if (dx > 0 && Math.abs(dx) >= range.left) {
            dx = range.left;
        }
        // 向上划
        if (dy < 0 && Math.abs(dy) >= range.bottom) {
            dy = -range.bottom;
        }
        // 向下划
        if (dy > 0 && Math.abs(dy) >= range.top) {
            dy = range.top;
        }

        svg.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${dx}, ${dy})`;

        if (scale === 1) {
            svg.style.transform = `matrix(1, 0, 0, 1, 50%, 50%)`;
            dx = 0;
            dy = 0;
            origin = { x: w / 2, y: h / 2 };
            point = { x: w /2, y: h / 2 };
        }
    }

    const COLORS = [
        "be8c65",
        "d7d9c6",
        "e5e3d5",
        "918474",
        "dec99d",
        "c2a27f",
        "4d3116",
        "716b4d",
        "f9f8f6",
        "be5937",
        "b2af9b",
        "e2d6bd",
        "ac9a83",
        "c6cbb8",
        "b0b885",
        "cec26d",
        "cab493",
        "775838",
        "efece3",
        "b1754e"
    ];

    COLORS.forEach(c => {
        const ele = document.createElement('p');
        ele.innerHTML = c;
        ele.setAttribute('class', 'color');
        ele.style.backgroundColor = '#' + c;
        ele.addEventListener('click', function() {
            color = '#' + c;
            try {
                $$('.white').forEach(el => {
                    if(el.getAttribute('painted')) {
                        return;
                    }
                    el.setAttribute('fill', 'white');
                });
                $$(`.color-${c}`).forEach(el => {
                    if (el.getAttribute('fill') === 'white') {
                        el.setAttribute('fill', '#ccc')
                    }
                });
            } catch(e) {
                alert(e)
            }
        });
        $('.colors').appendChild(ele);
    });
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

GetSvg(tarot);