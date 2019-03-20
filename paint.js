/**
 * 
 * @param {string} svgText svg xml内容
 * @param {object} colors 色块数据
 */
function render(svgText, colors) {
    $('#container').append($(svgText));
    var clientWidth = document.body.clientWidth;
    var svgRatio = $('svg').width() / $('svg').height();
    var w = clientWidth * 0.5;
    var h = w / svgRatio;
    var color = 'white';

    // 添加涂色事件
    $('svg').attr('width', w).attr('height', h);
    $('svg path').each(function(index, path) {
        $(path).on('touchstart', function() {
            var classname = $(this).attr('class');
            console.log(classname, color);
            if (!classname || classname.indexOf('paintable') < 0 || classname.indexOf(color.slice(1)) < 0) return;
            $(this).attr('fill', color);
            $(this).attr('painted', 'true');
        });
    });

    renderBrush(colors);

    /**
     * @var {number}: scale 缩放比例
     * @var {object}: pan 总偏移距离
     * @var {number}: dx x方向每次划动的距离
     * @var {number}: dy y方向每次划动的距离
     * @var {object}: origin 对称中心的坐标
     * @var {object}: point 缩放时的中心坐标
     */

    var scale = 1;
    var pan = {x: 0, y: 0};
    var dx = 0;
    var dy = 0;
    var origin = {x: w / 2, y: h / 2};
    var point = {x: w / 2, y: h / 2};

    // 事件管理器
    var svg = document.querySelector('svg');
    var mc = new Hammer.Manager(svg);
    var panInstance = new Hammer.Pan({
        threshold: 2,
        direction: Hammer.DIRECTION_ALL
    });
    var pinchInstance = new Hammer.Pinch();
    mc.add([panInstance, pinchInstance]);

    // 拖动事件
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

    // 缩放事件
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

    function renderBrush(colors) {
        colors.forEach(function(c) {
            const ele = document.createElement('p');
            ele.innerHTML = c;
            ele.setAttribute('class', 'color');
            ele.style.backgroundColor = '#' + c;
            ele.addEventListener('click', function() {
                color = '#' + c;

                $('.paintable').each(function(index, el) {
                    if(!!$(el).attr('painted')) return;
                    $(el).attr('fill', 'white');
                });

                $('svg path').each(function(i, el) {
                    // $(el).attr('stroke', '#ccc');
                });

                $('.color-' + c).each(function(i, el) {
                    // console.log($(el).attr('painted'))
                    if(!$(el).attr('painted')) {
                        $(el).attr('fill', '#333');
                    }
                });
            });
            $('.colors').append(ele);
        });
    }
}

const COLORS = ["c7a480", "7b5733", "ebcc9e", "8b8f78", "bbc8b5", "cf8f57", "fef6e3", "be5937", "4d3116", "cec26d", "a8b5a0", "b18967", "c4b99d", "927f6f", "706a4c", "ddc58a", "b77044", "a3917d", "d6d5c1", "b4a38f"];

render(tarot, COLORS);

// 阻止页面全局放大
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
};