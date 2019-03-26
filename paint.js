/**
 * 
 * @param {string} svgText svg xml内容
 * @param {object} c 色块数据
 */
function Render(svgText, c) {
    $('#container').empty().append($(svgText));
    var svgRatio = $('#container svg').width() / $('#container svg').height();
    var h = $('#container').height() * 0.8;
    var w = h * svgRatio;
    var color = 'white';
    var progress = {};
    var HIGHLIGHT_COLOR = '#b2b2b2';
    var colors = c.map(item => item.toLowerCase());
    // 计算色块总数及每个色块已涂完的数量
    colors.forEach(function(c) {
        var all = $('.color-' + c).length;
        var now = $('.color-' + c).filter(function(i, c) {return !!$(c).attr('painted')}).length;
        progress[c] = { all: all, now: now };
    });

    $('#container svg').attr('height', h);

    // 添加涂色事件
    $('#container svg path').each(function(index, path) {
        $(path).on('touchstart', function() {
            var classname = $(this).attr('class');
            if(!classname || classname.indexOf('paintable') < 0 || classname.indexOf(color.slice(1)) < 0 || !!$(this).attr('painted')) return;
            $(this).attr('fill', color);
            $(this).attr('painted', "true");

            var selectedColor = progress[color.slice(1)];
            selectedColor.now += 1;

            // 单个颜色完成
            if(selectedColor.now >= selectedColor.all) {
                $('.brush-' + color.slice(1)).addClass('brush-finished');
                $('.brush-' + color.slice(1)).find('.check').attr({ fill: '#ffffff'});
                $('.brush-' + color.slice(1)).find('.border').attr({ stroke: 'none'});
            }

            // 100%完成
            if($('.brush-finished').length === colors.length) {
                try {
                    window.webkit.messageHandlers.PaintDone.postMessage();
                } catch (e) {
                    console.log(e);
                }
            }

            // 保存进度
            var clone = $('#container svg').clone();
            // 原始缩放比例
            clone.css('transform', 'matrix(1, 0, 0, 1, 0, 0)').css('transform-origin', '50% 50%');
            // 清除未涂完的高亮色
            clone.find('.paintable').each(function(i, el) {
                if($(this).attr('fill') == HIGHLIGHT_COLOR) {
                    $(this).attr('fill', 'white');
                }
            });
            var div = document.createElement('div');
            $(div).append(clone);
            try {
                window.webkit.messageHandlers.UpdateSvg.postMessage($(div).html());
            } catch (e) {
                console.log(e);
            }
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
    var svg = document.querySelector('#container svg');
    // svg.style.transform = 'matrix(' + minScale + ', 0, 0, ' + minScale + ', 0, 0)'
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
                if(scale < 1) {
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

            if(origin.x > w) {
                origin.x = w;
                point.x = w;
            }

            if(origin.x < 0) {
                origin.x = 0;
                point.x = 0;
            }

            if(origin.y > h) {
                origin.y = h;
                point.y = h;
            }

            if(origin.y < 0) {
                origin.y = 0;
                point.y = 0;
            }
            svg.style.transformOrigin = `${origin.x}px ${origin.y}px`;
        } catch(e) {
            console.log(e);
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
        if(dx < 0 && Math.abs(dx) >= range.right) {
            dx = -range.right;
        }
        // 向右划
        if(dx > 0 && Math.abs(dx) >= range.left) {
            dx = range.left;
        }
        // 向上划
        if(dy < 0 && Math.abs(dy) >= range.bottom) {
            dy = -range.bottom;
        }
        // 向下划
        if(dy > 0 && Math.abs(dy) >= range.top) {
            dy = range.top;
        }
        svg.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${dx}, ${dy})`;

        if(scale === 1) {
            svg.style.transform = `matrix(1, 0, 0, 1, 50%, 50%)`;
            dx = 0;
            dy = 0;
            origin = { x: w / 2, y: h / 2 };
            point = { x: w /2, y: h / 2 };
        }

        return 1;
    }

    function renderBrush(colors) {
        const BRUSH_SVG = '' +
        '<svg width="117px" height="118px" viewBox="0 0 117 118" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
            '<g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">' +
                '<g id="Me-Save-Copy-2" transform="translate(-302.000000, -1029.000000)">' +
                    '<g id="ic_svg-copy" transform="translate(302.000000, 1029.000000)">' +
                        '<!-- 实心部分  -->' +
                        '<path class="oval" stroke="none" d="M46.3400913,13.6731671 C67.9159477,5.60855147 84.6370339,7.98193597 96.5033501,20.7933207 C108.122065,36.3187746 110.970911,54.7748258 105.049889,76.1614744 C98.9638754,91.7137382 90.8129491,101.509241 80.5971098,105.547982 C61.3324992,111.559984 44.3132415,108.492363 37.2599686,105.547982 C33.7484605,102.721651 7.98718436,95.2826 9.03084867,59.5017502 C12.0810712,38.7589745 24.5174854,23.4827801 46.3400913,13.6731671 Z" id="路径-2-copy-2" fill="none"></path>' +
                        '<!-- 边框部分 -->' +
                        '<path class="border" d="M44.481251,7.70505519 C68.6779355,-1.33273874 87.8209765,1.38248414 101.404413,16.0373133 L101.493445,16.1333669 L101.571952,16.2381976 C114.612729,33.6514786 117.81544,54.3852611 111.216972,78.201881 L111.182574,78.3260361 L111.135596,78.4459978 C104.326807,95.8328727 95.0736852,106.945045 83.2984915,111.596952 L83.1242058,111.65846 C65.0192136,117.304554 45.9879857,116.337978 34.5800011,111.579115 L34.2523165,111.442421 L33.9756486,111.219896 C33.6160966,110.930706 28.8307831,108.410538 28.6576287,108.314672 C25.0379211,106.310646 21.8820921,104.193143 18.8395092,101.535128 C8.0784688,92.1342292 1.9760041,78.5994592 2.5344046,59.4689488 L2.53867382,59.3226878 L2.55997654,59.1779235 C5.98609412,35.8954801 19.996946,18.6975777 44.3316199,7.76653141 L44.481251,7.70505519 Z" id="路径-2-copy-2" stroke-width="5"></path>' +
                        '<!-- 对勾 -->' +
                        '<g id="ic_donr-copy" transform="translate(40.000000, 45.000000)" fill="#FFFFFF">' +
                            '<g id="duihao-6">' +
                                '<path class="check" stroke="none" d="M39,5.85222639 C39,6.52748328 38.766,7.09998369 38.298,7.56972761 L20.080125,25.8554885 L16.653,29.2953841 C16.185,29.765128 15.60975,30 14.941875,30 C14.269125,30 13.69875,29.765128 13.23075,29.2953841 L9.803625,25.8554885 L0.702,16.7150546 C0.234,16.2453107 0,15.6679171 0,14.9975534 C0,14.3222965 0.234,13.7497961 0.702,13.2800522 L4.129125,9.84015658 C4.597125,9.37041266 5.172375,9.13554069 5.84025,9.13554069 C6.513,9.13554069 7.083375,9.37041266 7.551375,9.84015658 L14.94675,17.2973414 L31.448625,0.704615886 C31.916625,0.234871962 32.491875,0 33.15975,0 C33.8325,0 34.402875,0.234871962 34.870875,0.704615886 L38.298,4.1445115 C38.761125,4.60936226 39,5.18186267 39,5.85222639 Z" id="路径"></path>' +
                            '</g>' +
                        '</g>' +
                    '</g>' +
                '</g>' +
            '</g>' +
        '</svg>';
        var width = colors.length * 12 + 2; 
        $('.brushes').css('width', width + 'vh');
        colors.forEach(function(c) {
            const ele = document.createElement('div');
            ele.innerHTML = BRUSH_SVG;
            ele.setAttribute('class', 'brush ' + 'brush-' + c);
            $(ele).find('.oval').attr('fill', '#' + c);
            $(ele).find('.check').attr('fill', '#' + c);
            var colorProgress = progress[c];

            ele.addEventListener('click', function() {
                if(c !== color.slice(1)) {
                    try {
                        window.webkit.messageHandlers.ChangePencil.postMessage('#' + c);
                    } catch(e) {
                        console.log(e);
                    }
                }
                color = '#' + c;

                $('.paintable').each(function(index, el) {
                    if(!!$(el).attr('painted')) return;
                    $(el).attr('fill', 'white');
                });

                $('.color-' + c).each(function(i, el) {
                    if(!$(el).attr('painted')) {
                        $(el).attr('fill', HIGHLIGHT_COLOR);
                    }
                });
                $('.border').attr({ stroke: 'none' });

                if(colorProgress.now === colorProgress.all) return;
                $(this).find('.border').attr({
                    stroke: color
                });
            });

            $('.brushes').append(ele);

            // 完成状态
            if(colorProgress.now === colorProgress.all) {
                var classname = '.brush-' + c;
                $(classname).find('.border').attr({ stroke: 'none' });
                $(classname).find('.check').attr({ fill: '#ffffff' });
                $(classname).addClass('brush-finished');
            }
        });
    }
}

// 阻止页面全局放大
window.onload = function() {
    // 阻止双击放大
    var lastTouchEnd = 0;
    document.addEventListener('touchstart', function(event) {
        if(event.touches.length > 1) {
            event.preventDefault();
        }
    });
    document.addEventListener('touchend', function(event) {
        var now = (new Date()).getTime();
        if(now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // 阻止双指放大
    document.addEventListener('gesturestart', function(event) {
        event.preventDefault();
    });
};

Render(
    window.localStorage.getItem('svg'),
    ["C7a480", "7B5733", "ebcC9e", "8B8f78", "Bbc8b5", "cf8f57", "fef6e3", "be5937", "4d3116", "cec26d", "a8b5a0", "b18967", "c4b99d", "927f6f", "706a4c", "ddc58a", "b77044", "a3917d", "d6d5c1", "b4a38f"],
    'The Fool'
)