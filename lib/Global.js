"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._registerNode = exports.Konva = exports.glob = void 0;
const Util_1 = require("./Util");
const PI_OVER_180 = Math.PI / 180;
const VERTICAL_TOP_RIGHT = [
    'っ'
];
const VERTICAL_TOP_RIGHT_OVER = [
    '。',
    '、'
];
const VERTICAL_ROTATE_90 = [
    ' ', '　', '[', ']', '(', ')', '{', '}', '〈', '〉', '《', '》', '〔', '〕', '〚', '〛', '〘', '〙', '〖', '〗', '〝', '〞'
];
const VERTICAL_ROTATE_90_UP = ['「', '（', '『', '【'];
const VERTICAL_ROTATE_90_DOWN = ['」', '）', '』', '】'];
function detectBrowser() {
    return (typeof window !== 'undefined' &&
        ({}.toString.call(window) === '[object Window]' ||
            {}.toString.call(window) === '[object global]'));
}
var dummyContext, CONTEXT_2D = '2d';
function getDummyContext() {
    if (dummyContext) {
        return dummyContext;
    }
    dummyContext = Util_1.Util.createCanvasElement().getContext(CONTEXT_2D);
    return dummyContext;
}
const textHorizontalSizes = {};
const textVerticalSizes = {};
function measureText(text, fontSize, font, vertical) {
    if (!text) {
        return vertical
            ? { width: fontSize, height: 0 }
            : { width: 0, height: fontSize };
    }
    if (!textHorizontalSizes[fontSize]) {
        textHorizontalSizes[fontSize] = {};
        textVerticalSizes[fontSize] = {};
    }
    let size = vertical
        ? textVerticalSizes[fontSize][text]
        : textHorizontalSizes[fontSize][text];
    if (size) {
        return size;
    }
    const _context = getDummyContext();
    _context.save();
    _context.font = font;
    if (vertical) {
        let h = 0;
        let maxWidth = 0;
        for (const char of text) {
            const metrics = _context.measureText(char);
            if (VERTICAL_ROTATE_90.includes(char)
                || VERTICAL_ROTATE_90_DOWN.includes(char)
                || VERTICAL_ROTATE_90_UP.includes(char)) {
                size = { width: fontSize, height: metrics.width };
                h += metrics.width;
            }
            else {
                size = { width: metrics.width, height: fontSize };
                h += fontSize;
            }
            maxWidth = Math.max(maxWidth, size.width);
            textHorizontalSizes[fontSize][char] = size;
        }
        size = { width: maxWidth, height: h };
        textVerticalSizes[fontSize][text] = size;
    }
    else {
        const metrics = _context.measureText(text);
        size = {
            width: metrics.width,
            height: fontSize,
        };
        textHorizontalSizes[fontSize][text] = size;
    }
    _context.restore();
    return size;
}
exports.glob = typeof global !== 'undefined'
    ? global
    : typeof window !== 'undefined'
        ? window
        : typeof WorkerGlobalScope !== 'undefined'
            ? self
            : {};
exports.Konva = {
    _global: exports.glob,
    version: '9.3.6',
    isBrowser: detectBrowser(),
    isUnminified: /param/.test(function (param) { }.toString()),
    dblClickWindow: 400,
    getAngle(angle) {
        return exports.Konva.angleDeg ? angle * PI_OVER_180 : angle;
    },
    VERTICAL_TOP_RIGHT,
    VERTICAL_TOP_RIGHT_OVER,
    VERTICAL_ROTATE_90,
    VERTICAL_ROTATE_90_UP,
    VERTICAL_ROTATE_90_DOWN,
    measureText,
    getDummyContext,
    enableTrace: false,
    pointerEventsEnabled: true,
    autoDrawEnabled: true,
    hitOnDragEnabled: false,
    capturePointerEventsEnabled: false,
    _mouseListenClick: false,
    _touchListenClick: false,
    _pointerListenClick: false,
    _mouseInDblClickWindow: false,
    _touchInDblClickWindow: false,
    _pointerInDblClickWindow: false,
    _mouseDblClickPointerId: null,
    _touchDblClickPointerId: null,
    _pointerDblClickPointerId: null,
    pixelRatio: (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
    dragDistance: 3,
    angleDeg: true,
    showWarnings: true,
    dragButtons: [0, 1],
    isDragging() {
        return exports.Konva['DD'].isDragging;
    },
    isTransforming() {
        var _a;
        return (_a = exports.Konva['Transformer']) === null || _a === void 0 ? void 0 : _a.isTransforming();
    },
    isDragReady() {
        return !!exports.Konva['DD'].node;
    },
    releaseCanvasOnDestroy: true,
    document: exports.glob.document,
    _injectGlobal(Konva) {
        exports.glob.Konva = Konva;
    },
};
const _registerNode = (NodeClass) => {
    exports.Konva[NodeClass.prototype.getClassName()] = NodeClass;
};
exports._registerNode = _registerNode;
exports.Konva._injectGlobal(exports.Konva);
