// 立即执行函数：避免变量污染全局作用域，代码加载后直接运行
!function() {
    // 函数o：获取元素属性值，若属性不存在则返回默认值
    function o(w, v, i) {
        return w.getAttribute(v) || i
    }

    // 函数j：通过标签名获取页面元素集合（封装document.getElementsByTagName）
    function j(i) {
        return document.getElementsByTagName(i)
    }

    // 函数l：读取当前脚本标签的自定义属性，生成配置对象（控制粒子效果的核心参数）
    function l() {
        var i = j("script");          // 获取所有script标签
        var w = i.length;             // 所有script标签的数量
        var v = i[w - 1];             // 当前粒子效果脚本标签（页面中最后加载的script）
        // 返回配置对象：z(zIndex)、o(opacity)、c(color)、n(count)
        return {
            l: w,
            z: o(v, "zIndex", -1),    // canvas层级（默认-1，值越大越靠上）
            o: o(v, "opacity", 0.5),  // canvas整体透明度（默认0.5，0-1之间）
            c: o(v, "color", "0,0,0"),// 粒子/连线颜色（默认黑色，格式"r,g,b"）
            n: o(v, "count", 50)      // 粒子总数（默认99个，值越大粒子越密集）
        }
    }

    // 函数k：设置canvas尺寸为当前窗口大小（适配窗口初始尺寸和 resize 事件）
    function k() {
        // 兼容不同浏览器的窗口宽度获取方式
        r = u.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        // 兼容不同浏览器的窗口高度获取方式
        n = u.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    }

    // 函数b：核心绘制函数（清除画布、更新粒子位置、绘制粒子、绘制粒子间连线）
    function b() {
        // 1. 清除画布：每次绘制前清空整个canvas，避免画面残留
        e.clearRect(0, 0, r, n);
        
        // 2. 组合鼠标点和所有粒子：用于后续计算粒子与鼠标、粒子与粒子的连线
        var w = [f].concat(t);
        var x, v, A, B, z, y;

        // 3. 遍历所有粒子，更新位置并绘制
        t.forEach(function(i) {
            // 3.1 更新粒子位置：按自身速度（xa/ya）移动
            i.x += i.xa;
            i.y += i.ya;

            // 3.2 边界碰撞检测：粒子碰到窗口边缘时反向运动
            i.xa *= i.x > r || i.x < 0 ? -1 : 1;
            i.ya *= i.y > n || i.y < 0 ? -1 : 1;

            // 3.3 绘制单个粒子：1px*1px的矩形（视觉上是小点）
            e.fillRect(i.x - 0.5, i.y - 0.5, 1, 1);

            // 3.4 计算当前粒子与其他点（粒子/鼠标）的连线
            for (v = 0; v < w.length; v++) {
                x = w[v];  // 当前对比的点（可能是其他粒子或鼠标）
                
                // 跳过自身，且只处理有有效坐标的点（鼠标移出窗口时坐标为null）
                if (i !== x && null !== x.x && null !== x.y) {
                    // 计算两点在x/y轴的距离差
                    B = i.x - x.x;
                    z = i.y - x.y;
                    // 计算两点距离的平方（避免开方运算，提升性能）
                    y = B * B + z * z;

                    // 若两点距离小于“最大连线距离”，则绘制连线
                    if (y < x.max) {
                        // 鼠标对粒子的吸引力：当点是鼠标且距离适中时，粒子向鼠标移动
                        if (x === f && y >= x.max / 2 && (i.x -= 0.03 * B, i.y -= 0.03 * z)) {}
                        
                        // 计算连线的透明度：距离越近，透明度越高（A值0-1）
                        A = (x.max - y) / x.max;
                        // 绘制连线
                        e.beginPath();
                        e.lineWidth = A / 2;  // 线宽：距离越近线越粗（A值0-1）
                        // 连线颜色：配置的基础色 + 动态透明度（A+0.2避免完全透明）
                        e.strokeStyle = "rgba(" + s.c + "," + (A + 0.2) + ")";
                        e.moveTo(i.x, i.y);  // 连线起点（当前粒子）
                        e.lineTo(x.x, x.y);  // 连线终点（对比的点）
                        e.stroke();  // 执行绘制
                    }
                }
            }

            // 从点集合中移除当前粒子：避免后续重复计算连线
            w.splice(w.indexOf(i), 1)
        });

        // 4. 循环调用绘制函数：使用浏览器动画帧API，保证画面流畅（约60帧/秒）
        m(b)
    }

    // -------------------------- 变量初始化 --------------------------
    var u = document.createElement("canvas");  // 创建canvas元素（粒子效果的载体）
    var s = l();                               // 加载配置对象（从当前脚本标签读取）
    var c = "c_n" + s.l;                       // 生成canvas的唯一ID（避免重复）
    var e = u.getContext("2d");                 // 获取canvas的2D绘图上下文
    var r, n;                                  // 存储canvas的宽/高（即窗口宽/高）
    
    // 兼容不同浏览器的“动画帧API”：优先使用原生API，无则降级为setTimeout（45帧/秒）
    var m = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(i) {
        window.setTimeout(i, 1000 / 45)
    };
    
    var a = Math.random;  // 简化Math.random()调用（生成0-1的随机数）
    // 鼠标坐标对象：x/y存储鼠标位置，max是鼠标与粒子的最大连线距离
    var f = {
        x: null,
        y: null,
        max: 5000  // 鼠标与粒子的最大连线距离（值越大，鼠标影响范围越广）
    };

    // -------------------------- 配置并添加canvas到页面 --------------------------
    u.id = c;  // 设置canvas的ID
    // 设置canvas样式：固定定位（全屏覆盖）、层级、透明度
    u.style.cssText = "position:fixed;top:0;left:0;z-index:" + s.z + ";opacity:" + s.o;
    j("body")[0].appendChild(u);  // 将canvas添加到页面body中

    // -------------------------- 绑定事件 --------------------------
    k();  // 初始化canvas尺寸（适配初始窗口大小）
    window.onresize = k;  // 窗口大小改变时，重新调整canvas尺寸

    // 鼠标移动时：更新鼠标坐标对象的x/y值
    window.onmousemove = function(i) {
        i = i || window.event;
        f.x = i.clientX;
        f.y = i.clientY
    };

    // 鼠标移出窗口时：清空鼠标坐标（避免粒子与“不存在的鼠标”连线）
    window.onmouseout = function() {
        f.x = null;
        f.y = null
    };

    // -------------------------- 生成初始粒子 --------------------------
    var t = [];  // 存储所有粒子的数组
    // 循环生成粒子（数量由配置的s.n决定）
    for (var p = 0; s.n > p; p++) {
        var h = a() * r;          // 粒子初始x坐标（窗口内随机）
        var g = a() * n;          // 粒子初始y坐标（窗口内随机）
        var q = 1 * a() - 0.5;      // 粒子x方向速度（-1到1之间，负数向左、正数向右）
        var d = 1 * a() - 0.5;      // 粒子y方向速度（-1到1之间，负数向上、正数向下）
        // 将粒子添加到数组：max是粒子与其他粒子的最大连线距离
        t.push({
            x: h,
            y: g,
            xa: q,
            ya: d,
            max: 10000  // 粒子间的最大连线距离（值越大，粒子间连线越密集）
        })
    }

    // 延迟100ms执行绘制：确保canvas已添加到页面，避免绘制异常
    setTimeout(function() {
        b()
    }, 100)
}();