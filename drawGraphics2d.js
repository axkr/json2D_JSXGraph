//TODO: no scaled coords yet

//TODO: axes options?
//TODO: scaled axes
//TODO: logarithmic scale -> very important, see example
//TODO: custom ticks
//TODO: custom coordinates


//TODO: hide grid?
//TODO: ratio of bounding box

//TODO: graphicscomplex

//TODO: filling for points and curves possible with fillColor,
//TODO: top/bottom with inequality

//TODO: documentation in md

function drawGraphics2d(id, json) {
    var myoptions = {
        elements: {dragToTopOfLayer: true},
        polygon: { vertices: { layer:5}, borders: {layer: 5}},
         layer: {
             text: 5,
             point: 5,
             glider: 9,
             arc: 5,
             line: 5,
             circle: 5,
             curve: 5,
             turtle: 5,
             polygon: 5,
             sector: 3,
             angle: 5,
             integral: 5,
             axis: 2,
             ticks: 2,
             grid: 1,
             image: 5,
             trace: 0
         }
     };
    JXG.Options = JXG.merge(JXG.Options, myoptions);
    var opts = {},
        boundingBox = json.extent,
        board = JXG.JSXGraph.initBoard(id, {
            boundingbox: [
                boundingBox.xmin,
                boundingBox.ymax,
                boundingBox.xmax,
                boundingBox.ymin,
            ],
            //axis: json.axes.hasaxes,
            axis: false,
            keepaspectratio: false,
            showClearTraces: true,
        });
    // draw every element in the json
    //board.suspendUpdate();
    drawAxes(board, json);
    for (element of json.elements) {
        drawGraphic(board, element, opts);
    }
    //board.unsuspendUpdate();
}

function drawGraphic(board, json, opts) {
    var args;

    switch (json.type) {
        case "point":
            args = getArgs(
                ["coords", "color", "opacity", "pointSize"],
                json,
                opts,
                json.type
            );
            drawPoint(board, args);
            break;
        case "arrow":
        case "line":
            args = getArgs(
                ["coords", "color", "opacity", "arrow", "thickness"],
                json,
                opts,
                json.type
            );
            drawLine(board, args);
            break;
        case "disk":
        case "circle":
            args = getArgs(
                [
                    "coords",
                    "color",
                    "opacity",
                    "radius1",
                    "radius2",
                    "angle1",
                    "angle2",
                    "filled",
                ],
                json,
                opts,
                json.type
            );
            drawCircle(board, args);
            break;
        case "rectangle":
            args = getArgs(
                ["coords", "color", "opacity"],
                json,
                opts,
                json.type
            );
            drawRectangle(board, args);
            break;
        case "polygon":
            args = getArgs(
                ["coords", "color", "opacity"],
                json,
                opts,
                json.type
            );
            drawPolygon(board, args);
            break;
        case "text":
            args = getArgs(
                ["coords", "color", "opacity", "texts", "fontSize"],
                json,
                opts,
                json.type
            );
            drawText(board, args);
            break;
        case undefined:
            setOption(json, opts);
            break;
        default:
            console.warn("Type " + json.type + " not supported");
    }
}

function drawAxes(board, json){
    var attr = JXG.Options.board.defaultAxes.x;
    attr.ticks.drawZero = false;
    var xAxis = board.create('axis', [[0, 0], [1, 0]], attr);

    attr = JXG.Options.axis;
    var yAxis = board.create('line', [[0, 0], [0, 1]], attr);

    attr = JXG.Options.board.defaultAxes.y.ticks;
    attr.drawLabels = true;
    attr.drawZero = false;
    attr.generateLabelText = function (tick, zero) {
        return (Math.pow(10, Math.round(tick.usrCoords[2] - zero.usrCoords[2]))).toString();
    }

    board.create('ticks', [yAxis, 1], attr);
}

function getScalingFunction(string){
    switch(string){
        case "log":

    }
}

function setOption(json, opts) {
    //TODO: error handling
    opts[json.option] = validateAttr(json.option, json.value, undefined);
}

function getAttr(attr, json, opts, type) {
    var value;
    if (json[attr] != undefined) value = validateAttr(attr, json[attr], type);
    else if (opts[attr] != undefined) value = opts[attr];
    else value = validateAttr(attr, undefined, type);

    return value;
}

function validateAttr(attr, value, type) {
    //TODO: error handling
    switch (attr) {
        case "color":
            if (value == undefined) value = [0.0, 0.0, 0.0];
            else value = convertColor(value);
            break;
        case "coords":
            value = convertCoords(value);
            break;
        case "opacity":
            if (value == undefined) value = 1.0;
            break;
        case "pointSize":
            if (value == undefined) value = 0.005;
            break;
        case "fontSize":
            if (value == undefined) value = 20;
            break;
        case "radius1":
        case "radius2":
            if (value == undefined) value = 1;
            break;
        case "arrow":
            value = type == "arrow";
            break;
        case "filled":
            value = type == "disk";
            break;
        default:
    }
    return value;
}

function getArgs(lst, json, opts, type) {
    var args = {};
    for (attr of lst) {
        args[attr] = getAttr(attr, json, opts, type);
    }
    return args;
}

function drawPoint(board, args) {
    for (coord of args.coords) {
        board.create("point", coord, {
            strokeColor: args.color,
            fillColor: args.color,
            strokeOpacity: args.opacity,
            fillOpacity: args.opacity,
            fixed: true,
            name: "",
            size: (board.canvasWidth * args.pointSize) / 2,
        });
    }
}

function drawCircle(board, args) {
    for (coord of args.coords) {
        // calculate the foci of the ellipse
        var foci = calculateFoci(args.radius1, args.radius2, coord);
        board.create(
            "ellipse",
            [foci[0], foci[1], foci[2], args.angle1, args.angle2],
            {
                strokeColor: args.color,
                fillColor: args.color,
                strokeOpacity: args.opacity,
                fillOpacity: args.opacity * args.filled,
            }
        );
    }
}

function drawLineSegmented(board, args) {
    for (index = 1; index < args.coords.length; index++) {
        board.create("line", [args.coords[index], args.coords[index - 1]], {
            straightFirst: false,
            straightLast: false,
            strokeColor: args.color,
        });
    }
}

function drawLine(board, args) {
    //TODO: additional directives: width, dashed, gap
    var newCoords = convertCoordsCurve(args.coords);

    board.create("curve", newCoords, {
        lastArrow: args.arrow,
        strokeColor: args.color,
        strokeOpacity: args.opacity,
        strokeWidth: (board.canvasWidth * args.thickness) / 2,
    });
}

function drawPolygon(board, args) {
    board.create("polygon", args.coords, {
        fillColor: args.color,
        strokeOpacity: args.opacity,
        fillOpacity: args.opacity,
        borders: { strokeColor: args.color },
        vertices: { fixed: true, visible: false },
    });
}

function drawText(board, args) {
    for (index in args.coords) {
        board.create(
            "text",
            [args.coords[index][0], args.coords[index][1], args.texts[index]],
            {
                color: args.color,
                fixed: true,
                opacity: args.opacity,
                fontSize: args.fontSize,
            }
        );
    }
}

function drawRectangle(board, args) {
    var start, end, p1, p2, p3, p4;
    start = args.coords[0];
    if (args.coords.length == 1) end = [start[0] + 1, start[1] + 1];
    else if (args.coords.length == 2) end = args.coords[1];

    p1 = board.create("point", [start[0], start[1]], { visible: false });
    p2 = board.create("point", [end[0], end[1]], { visible: false });
    p3 = board.create(
        "point",
        [
            function () {
                return p1.X();
            },
            function () {
                return p2.Y();
            },
        ],
        { visible: false }
    );
    p4 = board.create(
        "point",
        [
            function () {
                return p2.X();
            },
            function () {
                return p1.Y();
            },
        ],
        { visible: false }
    );

    board.create("polygon", [p1, p3, p2, p4], {
        strokeColor: args.color,
        fillColor: args.color,
        strokeOpacity: args.opacity,
        fillOpacity: args.opacity,
        fixed: true,
    });
}

function calculateFoci(radiusX, radiusY, coords) {
    var eccentricity, diff;
    diff = Math.abs(radiusX * radiusX - radiusY * radiusY);
    eccentricity = Math.sqrt(diff);
    if (radiusX > radiusY) {
        return [
            [eccentricity + coords[0], coords[1]],
            [-eccentricity + coords[0], coords[1]],
            [coords[0], radiusY + coords[1]],
        ];
    } else {
        diff = radiusY ^ (2 - radiusX) ^ 2;
        return [
            [coords[0], eccentricity + coords[1]],
            [coords[0], -eccentricity + coords[1]],
            [coords[0], radiusY + coords[1]],
        ];
    }
}

function convertColor(rgb) {
    var color = [];
    if (rgb != null) {
        color[0] = Number((rgb[0] * 255).toFixed(0));
        color[1] = Number((rgb[1] * 255).toFixed(0));
        color[2] = Number((rgb[2] * 255).toFixed(0));
        color = JXG.rgb2hex(color);
    }
    return color;
}

function convertCoords(coords) {
    var newCoords = [];
    for (key in coords) {
        newCoords[key] = coords[key][0];
    }
    return newCoords;
}

function convertCoordsCurve(coords) {
    var x = [];
    var y = [];
    for (key in coords) {
        x[key] = coords[key][0];
        y[key] = coords[key][1];
    }
    return [x, y];
}

function testRun() {
    /**
    drawGraphics2d("graphics2d", {
        elements: [
            { option: "opacity", value: 1.0 },
            { option: "pointSize", value: 0.0013 },
            { option: "textSize", value: 12 },
            { option: "color", value: [1.0, 0.0, 0.0] },
            {
                type: "disk",
                radius1: 1.0,
                radius2: 1.0,
                coords: [[[0.0, 0.0]]],
            },
            { option: "color", value: [0.0, 1.0, 0.0] },
            { type: "rectangle", coords: [[[0.0, 0.0]], [[2.0, 2.0]]] },
            { option: "color", value: [0.0, 0.0, 1.0] },
            {
                type: "disk",
                radius1: 1.0,
                radius2: 1.0,
                coords: [[[2.0, 2.0]]],
            },
        ],
        extent: { xmin: -1.0, xmax: 3.0, ymin: -1.0, ymax: 3.0 },
        axes: { hasaxes: false },
        aspectRatio: { symbol: "automatic" },
    });
    **/
    drawGraphics2d("graphics2d", {
        elements: [
            {
                type: "disk",
                color: [0.3, 0.0, 0.8],
                opacity: 0.5,
                radius1: 2.0,
                radius2: 2.0,
                coords: [[[1.0, 0.0]]],
            },
            {
                type: "circle",
                color: [0.2, 0.9, 0.0],
                opacity: 0.9,
                radius1: 4.0,
                radius2: 2.0,
                coords: [[[0.0, 5.0]]],
            },
            {
                type: "circle",
                color: [0.0, 0.0, 1.0],
                opacity: 1.0,
                radius1: 4.0,
                radius2: 2.0,
                angle1: 0.523598775598298,
                angle2: 2.35619449019234,
                coords: [[[0.0, 5.0]]],
            },
            {
                type: "line",
                color: [1.0, 0.5, 0.0],
                opacity: 0.6,
                coords: [
                    [[1.0, 1.0]],
                    [[3.0, 1.0]],
                    [[4.0, 3.0]],
                    [[4.0, 7.0]],
                ],
                thickness: 0.01
            },
            {
                type: "point",
                color: [0.7, 1.0, 0.0],
                coords: [[[0, 0]], [[1, 1]], [[2, 2]], [[3, 3]]],
                opacity: 0.5,
                pointSize: 0.005,
            },
            {option: "pointSize", value: 0.01},
            {option: "color", value: [1,0,1]},
            {
                type: "point",
                coords: [[[-1, -1]], [[-2, -2]], [[-3, -3]]],
                opacity: 0.5,
            },
            {
                type: "rectangle",
                color: [0.0, 0.5, 1.0],
                opacity: 1.0,
                coords: [[[2.0, -5.0]], [[4.0, -2.0]]],
            },
            {
                type: "arrow",
                color: [0.2, 0.0, 1.0],
                opacity: 1.0,
                coords: [[[0.0, 0.0]], [[-4.0, 3.0]]],
                thickness: 0.02
            },
            {
                type: "polygon",
                color: [1.0, 0.5, 0.0],
                opacity: 1.0,
                coords: [
                    [[-1.0, -1.0]],
                    [[0.0, -1.0]],
                    [[-4.0, -4.0]],
                    [[-1.0, 0.0]],
                ],
            },
            {
                type: "text",
                color: [0.5, 0.4, 0.1],
                fontSize: 40,
                opacity: 0.8,
                coords: [[[-5, -5]], [[5, 5]]],
                texts: ["Bottom left", "Top right"],
            },
        ],
        extent: { xmin: -6.0, xmax: 9.0, ymin: -6.0, ymax: 9.0 },
        axes: { hasaxes: true },
    });
}
