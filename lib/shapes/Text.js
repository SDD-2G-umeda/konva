"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Text = exports.stringToArray = void 0;
const Util_1 = require("../Util");
const Factory_1 = require("../Factory");
const Shape_1 = require("../Shape");
const Global_1 = require("../Global");
const Validators_1 = require("../Validators");
const Global_2 = require("../Global");
function stringToArray(string) {
    return Array.from(string);
}
exports.stringToArray = stringToArray;
var AUTO = 'auto', CENTER = 'center', INHERIT = 'inherit', JUSTIFY = 'justify', CHANGE_KONVA = 'Change.konva', CONTEXT_2D = '2d', DASH = '-', LEFT = 'left', LTR = 'ltr', TEXT = 'text', TEXT_UPPER = 'Text', TOP = 'top', BOTTOM = 'bottom', MIDDLE = 'middle', NORMAL = 'normal', PX_SPACE = 'px ', SPACE = ' ', RIGHT = 'right', RTL = 'rtl', WORD = 'word', CHAR = 'char', NONE = 'none', ELLIPSIS = '…', ATTR_CHANGE_LIST = [
    'direction',
    'fontFamily',
    'fontSize',
    'fontStyle',
    'fontVariant',
    'padding',
    'align',
    'verticalAlign',
    'lineHeight',
    'text',
    'width',
    'height',
    'wrap',
    'ellipsis',
    'letterSpacing',
    'vertical'
], attrChangeListLen = ATTR_CHANGE_LIST.length, VERTICAL_SPACING = 8, VERTICAL_UNDERLINE_SPACING = 1, UNDERLINE_WIDTH = 2;
function normalizeFontFamily(fontFamily) {
    return fontFamily
        .split(',')
        .map((family) => {
        family = family.trim();
        const hasSpace = family.indexOf(' ') >= 0;
        const hasQuotes = family.indexOf('"') >= 0 || family.indexOf("'") >= 0;
        if (hasSpace && !hasQuotes) {
            family = `"${family}"`;
        }
        return family;
    })
        .join(', ');
}
function _fillFunc(context) {
    context.fillText(this._partialText, this._partialTextX, this._partialTextY);
}
function _strokeFunc(context) {
    context.setAttr('miterLimit', 2);
    context.strokeText(this._partialText, this._partialTextX, this._partialTextY);
}
function checkDefaultFill(config) {
    config = config || {};
    if (!config.fillLinearGradientColorStops &&
        !config.fillRadialGradientColorStops &&
        !config.fillPatternImage) {
        config.fill = config.fill || 'black';
    }
    return config;
}
class Text extends Shape_1.Shape {
    constructor(config) {
        super(checkDefaultFill(config));
        this._partialTextX = 0;
        this._partialTextY = 0;
        for (var n = 0; n < attrChangeListLen; n++) {
            this.on(ATTR_CHANGE_LIST[n] + CHANGE_KONVA, this._setTextData);
        }
        this._setTextData();
    }
    _sceneFunc(context) {
        var textArr = this.textArr, textArrLen = textArr.length;
        if (!this.text()) {
            return;
        }
        var padding = this.padding(), fontSize = this.fontSize(), fontFamily = this._getContextFont(), lineHeightPx = this.lineHeight() * fontSize, verticalAlign = this.verticalAlign(), direction = this.direction(), alignY = 0, align = this.align(), totalWidth = this.getWidth(), letterSpacing = this.letterSpacing(), fill = this.fill(), textDecoration = this.textDecoration(), vertical = this.vertical(), shouldUnderline = textDecoration.indexOf('underline') !== -1, shouldLineThrough = textDecoration.indexOf('line-through') !== -1, n;
        direction = direction === INHERIT ? context.direction : direction;
        var translateY = lineHeightPx / 2;
        var lineTranslateX = 0;
        if (direction === RTL) {
            context.setAttr('direction', direction);
        }
        context.setAttr('font', this._getContextFont());
        context.setAttr('textBaseline', MIDDLE);
        context.setAttr('textAlign', LEFT);
        if (verticalAlign === MIDDLE) {
            alignY = (this.getHeight() - textArrLen * lineHeightPx - padding * 2) / 2;
        }
        else if (verticalAlign === BOTTOM) {
            alignY = this.getHeight() - textArrLen * lineHeightPx - padding * 2;
        }
        context.translate(padding, alignY + padding);
        var lineTranslateX = this.getWidth() - padding * 2;
        for (n = 0; n < textArrLen; n++) {
            var obj = textArr[n], text = obj.text, width = Math.max(obj.width, fontSize), height = obj.height, lastLine = obj.lastInParagraph, spacesNumber, oneWord, lineWidth;
            context.save();
            if (vertical) {
                translateY = fontSize / 2;
                lineTranslateX -= width;
                if (n !== 0) {
                    lineTranslateX -= VERTICAL_SPACING;
                }
                for (var char of text) {
                    const size = Global_1.Konva.measureText(char, fontSize, fontFamily, vertical);
                    const diffX = (width - size.width) / 2;
                    this._partialText = char;
                    const isRotate = Global_1.Konva.VERTICAL_ROTATE_90.includes(char);
                    const isRotateUp = Global_1.Konva.VERTICAL_ROTATE_90_UP.includes(char);
                    const isRotateDown = Global_1.Konva.VERTICAL_ROTATE_90_DOWN.includes(char);
                    if (isRotate || isRotateUp || isRotateDown) {
                        this._partialTextX = 0;
                        this._partialTextY = 0;
                        let rotateDiffX;
                        let rotateDiffY;
                        if (isRotate) {
                            rotateDiffX = size.width * 0.65;
                            rotateDiffY = size.height * 0.5;
                        }
                        else if (isRotateUp) {
                            rotateDiffX = size.width * 0.5;
                            rotateDiffY = size.height * 0.65;
                        }
                        else {
                            rotateDiffX = size.width * 0.5;
                            rotateDiffY = size.height * 0.35;
                        }
                        context.save();
                        context.translate(lineTranslateX + diffX + rotateDiffX, translateY - rotateDiffY);
                        context.rotate(Math.PI / 2);
                        context.fillStrokeShape(this);
                        context.restore();
                    }
                    else {
                        if (Global_1.Konva.VERTICAL_TOP_RIGHT.includes(char)) {
                            this._partialTextX = lineTranslateX + diffX + size.width / 8;
                            this._partialTextY = translateY - size.height / 8;
                        }
                        else if (Global_1.Konva.VERTICAL_TOP_RIGHT_OVER.includes(char)) {
                            this._partialTextX = lineTranslateX + diffX + size.width * 0.65;
                            this._partialTextY = translateY - size.height / 2;
                        }
                        else {
                            this._partialTextX = lineTranslateX + diffX;
                            this._partialTextY = translateY;
                        }
                        context.fillStrokeShape(this);
                    }
                    translateY += size.height;
                }
                context.restore();
                if (shouldUnderline) {
                    context.save();
                    context.beginPath();
                    const underLineX = lineTranslateX + width + VERTICAL_UNDERLINE_SPACING;
                    context.moveTo(underLineX, 0);
                    context.lineTo(underLineX, height);
                    context.lineWidth = UNDERLINE_WIDTH;
                    const gradient = this._getLinearGradient();
                    context.strokeStyle = gradient || fill;
                    context.stroke();
                    context.restore();
                }
            }
            else {
                lineTranslateX = 0;
                if (align === RIGHT) {
                    lineTranslateX += totalWidth - width - padding * 2;
                }
                else if (align === CENTER) {
                    lineTranslateX += (totalWidth - width - padding * 2) / 2;
                }
                if (shouldUnderline) {
                    context.save();
                    context.beginPath();
                    context.moveTo(lineTranslateX, translateY + Math.round(fontSize / 2));
                    spacesNumber = text.split(' ').length - 1;
                    oneWord = spacesNumber === 0;
                    lineWidth =
                        align === JUSTIFY && !lastLine ? totalWidth - padding * 2 : width;
                    context.lineTo(lineTranslateX + Math.round(lineWidth), translateY + Math.round(fontSize / 2));
                    context.lineWidth = fontSize / 15;
                    const gradient = this._getLinearGradient();
                    context.strokeStyle = gradient || fill;
                    context.stroke();
                    context.restore();
                }
                if (shouldLineThrough) {
                    context.save();
                    context.beginPath();
                    context.moveTo(lineTranslateX, translateY);
                    spacesNumber = text.split(' ').length - 1;
                    oneWord = spacesNumber === 0;
                    lineWidth =
                        align === JUSTIFY && lastLine && !oneWord
                            ? totalWidth - padding * 2
                            : width;
                    context.lineTo(lineTranslateX + Math.round(lineWidth), translateY);
                    context.lineWidth = fontSize / 15;
                    const gradient = this._getLinearGradient();
                    context.strokeStyle = gradient || fill;
                    context.stroke();
                    context.restore();
                }
                if (direction !== RTL && (letterSpacing !== 0 || align === JUSTIFY)) {
                    spacesNumber = text.split(' ').length - 1;
                    var array = stringToArray(text);
                    for (var li = 0; li < array.length; li++) {
                        var letter = array[li];
                        if (letter === ' ' && !lastLine && align === JUSTIFY) {
                            lineTranslateX += (totalWidth - padding * 2 - width) / spacesNumber;
                        }
                        this._partialTextX = lineTranslateX;
                        this._partialTextY = translateY;
                        this._partialText = letter;
                        context.fillStrokeShape(this);
                        lineTranslateX += Global_1.Konva.measureText(letter, fontSize, fontFamily, vertical).width + letterSpacing;
                    }
                }
                else {
                    if (letterSpacing !== 0) {
                        context.setAttr('letterSpacing', `${letterSpacing}px`);
                    }
                    this._partialTextX = lineTranslateX;
                    this._partialTextY = translateY;
                    this._partialText = text;
                    context.fillStrokeShape(this);
                }
                context.restore();
                if (textArrLen > 1) {
                    translateY += lineHeightPx;
                }
            }
        }
    }
    _hitFunc(context) {
        var width = this.getWidth(), height = this.getHeight();
        context.beginPath();
        context.rect(0, 0, width, height);
        context.closePath();
        context.fillStrokeShape(this);
    }
    setText(text) {
        var str = Util_1.Util._isString(text)
            ? text
            : text === null || text === undefined
                ? ''
                : text + '';
        this._setAttr(TEXT, str);
        return this;
    }
    getWidth() {
        var isAuto = this.attrs.width === AUTO || this.attrs.width === undefined;
        return isAuto ? this.getTextWidth() + this.padding() * 2 : this.attrs.width;
    }
    getHeight() {
        var isAuto = this.attrs.height === AUTO || this.attrs.height === undefined;
        return isAuto
            ? this.fontSize() * this.textArr.length * this.lineHeight() +
                this.padding() * 2
            : this.attrs.height;
    }
    getTextWidth() {
        return this.textWidth;
    }
    getTextHeight() {
        Util_1.Util.warn('text.getTextHeight() method is deprecated. Use text.height() - for full height and text.fontSize() - for one line height.');
        return this.textHeight;
    }
    _getContextFont() {
        return (this.fontStyle() +
            SPACE +
            this.fontVariant() +
            SPACE +
            (this.fontSize() + PX_SPACE) +
            normalizeFontFamily(this.fontFamily()));
    }
    _addTextLine(line) {
        const align = this.align();
        if (align === JUSTIFY) {
            line = line.trim();
        }
        const size = Global_1.Konva.measureText(line, this.fontSize(), this._getContextFont(), this.vertical());
        return this.textArr.push({
            text: line,
            width: size.width,
            height: size.height,
            lastInParagraph: false,
        });
    }
    _setTextData() {
        var lines = this.text().split('\n'), fontSize = +this.fontSize(), fontFamily = this._getContextFont(), textWidth = 0, lineHeightPx = this.lineHeight() * fontSize, width = this.attrs.width, height = this.attrs.height, vertical = this.vertical(), fixedWidth = width !== AUTO && width !== undefined, fixedHeight = height !== AUTO && height !== undefined, padding = this.padding(), maxWidth = typeof width === 'number' ? width - padding * 2 : undefined, maxHeightPx = typeof height === 'number' ? height - padding * 2 : undefined, currentHeightPx = 0, wrap = this.wrap(), shouldWrap = wrap !== NONE, wrapAtWord = wrap !== CHAR && shouldWrap, shouldAddEllipsis = this.ellipsis();
        this.textArr = [];
        var additionalWidth = shouldAddEllipsis
            ? Global_1.Konva.measureText(ELLIPSIS, fontSize, fontFamily, vertical).width
            : 0;
        if (vertical) {
            if (maxHeightPx) {
                let w = 0;
                for (const line of lines) {
                    if (!line) {
                        textWidth += fontSize;
                        this._addTextLine(line);
                        continue;
                    }
                    const textArr = stringToArray(line);
                    let h = 0;
                    let lineText = '';
                    for (const char of textArr) {
                        const size = Global_1.Konva.measureText(char, fontSize, fontFamily, true);
                        if (Global_1.Konva.VERTICAL_ROTATE_90.includes(char)
                            || Global_1.Konva.VERTICAL_ROTATE_90_DOWN.includes(char)
                            || Global_1.Konva.VERTICAL_ROTATE_90_UP.includes(char)) {
                            w = Math.max(w, size.height);
                            h += size.width;
                        }
                        else {
                            w = Math.max(w, size.width);
                            h += size.height;
                        }
                        if (h > maxHeightPx) {
                            this._addTextLine(lineText);
                            lineText = char;
                            h = size.height;
                            textWidth += Math.max(w, fontSize);
                        }
                        else {
                            lineText += char;
                        }
                    }
                    textWidth += w;
                    this._addTextLine(lineText);
                }
                textWidth += (this.textArr.length - 1) * VERTICAL_SPACING;
                this.textHeight = maxHeightPx;
                this.textWidth = textWidth;
            }
            else {
                const sizes = lines.map((line) => Global_1.Konva.measureText(line, fontSize, fontFamily, true));
                this.textHeight = Math.max(...sizes.map((size) => size.height));
                this.textWidth = sizes.reduce((prev, curr) => prev + curr.width, 0) + (lines.length - 1) * VERTICAL_SPACING;
            }
        }
        else {
            for (var i = 0, max = lines.length; i < max; ++i) {
                var line = lines[i];
                var lineWidth = Global_1.Konva.measureText(line, fontSize, fontFamily, false).width;
                if (fixedWidth && maxWidth && lineWidth > maxWidth) {
                    while (line.length > 0) {
                        var low = 0, high = line.length, match = '', matchWidth = 0;
                        while (low < high) {
                            var mid = (low + high) >>> 1, substr = line.slice(0, mid + 1), substrWidth = Global_1.Konva.measureText(substr, fontSize, fontFamily, false).width + additionalWidth;
                            if (substrWidth <= maxWidth) {
                                low = mid + 1;
                                match = substr;
                                matchWidth = substrWidth;
                            }
                            else {
                                high = mid;
                            }
                        }
                        if (match) {
                            if (wrapAtWord) {
                                var wrapIndex;
                                var nextChar = line[match.length];
                                var nextIsSpaceOrDash = nextChar === SPACE || nextChar === DASH;
                                if (nextIsSpaceOrDash && matchWidth <= maxWidth) {
                                    wrapIndex = match.length;
                                }
                                else {
                                    wrapIndex =
                                        Math.max(match.lastIndexOf(SPACE), match.lastIndexOf(DASH)) +
                                            1;
                                }
                                if (wrapIndex > 0) {
                                    low = wrapIndex;
                                    match = match.slice(0, low);
                                    matchWidth = Global_1.Konva.measureText(match, fontSize, fontFamily, false).width;
                                }
                            }
                            match = match.trimRight();
                            this._addTextLine(match);
                            textWidth = Math.max(textWidth, matchWidth);
                            currentHeightPx += lineHeightPx;
                            var shouldHandleEllipsis = this._shouldHandleEllipsis(currentHeightPx);
                            if (shouldHandleEllipsis) {
                                this._tryToAddEllipsisToLastLine();
                                break;
                            }
                            line = line.slice(low);
                            line = line.trimLeft();
                            if (line.length > 0) {
                                lineWidth = Global_1.Konva.measureText(line, fontSize, fontFamily, false).width;
                                if (lineWidth <= maxWidth) {
                                    this._addTextLine(line);
                                    currentHeightPx += lineHeightPx;
                                    textWidth = Math.max(textWidth, lineWidth);
                                    break;
                                }
                            }
                        }
                        else {
                            break;
                        }
                    }
                }
                else {
                    this._addTextLine(line);
                    currentHeightPx += lineHeightPx;
                    textWidth = Math.max(textWidth, lineWidth);
                    if (this._shouldHandleEllipsis(currentHeightPx) && i < max - 1) {
                        this._tryToAddEllipsisToLastLine();
                    }
                }
                if (this.textArr[this.textArr.length - 1]) {
                    this.textArr[this.textArr.length - 1].lastInParagraph = true;
                }
                if (fixedHeight && maxHeightPx && currentHeightPx + lineHeightPx > maxHeightPx) {
                    break;
                }
            }
            this.textHeight = fontSize;
            this.textWidth = textWidth;
        }
    }
    _shouldHandleEllipsis(currentHeightPx) {
        var fontSize = +this.fontSize(), lineHeightPx = this.lineHeight() * fontSize, height = this.attrs.height, fixedHeight = height !== AUTO && height !== undefined, padding = this.padding(), maxHeightPx = height - padding * 2, wrap = this.wrap(), shouldWrap = wrap !== NONE;
        return (!shouldWrap ||
            (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx));
    }
    _tryToAddEllipsisToLastLine() {
        var width = this.attrs.width, fixedWidth = width !== AUTO && width !== undefined, padding = this.padding(), maxWidth = width - padding * 2, shouldAddEllipsis = this.ellipsis();
        var lastLine = this.textArr[this.textArr.length - 1];
        if (!lastLine || !shouldAddEllipsis) {
            return;
        }
        if (fixedWidth) {
            var haveSpace = Global_1.Konva.measureText(lastLine.text + ELLIPSIS, this.fontSize(), this._getContextFont(), this.vertical()).width < maxWidth;
            if (!haveSpace) {
                lastLine.text = lastLine.text.slice(0, lastLine.text.length - 3);
            }
        }
        this.textArr.splice(this.textArr.length - 1, 1);
        this._addTextLine(lastLine.text + ELLIPSIS);
    }
    getStrokeScaleEnabled() {
        return true;
    }
    _useBufferCanvas() {
        const hasLine = this.textDecoration().indexOf('underline') !== -1 ||
            this.textDecoration().indexOf('line-through') !== -1;
        const hasShadow = this.hasShadow();
        if (hasLine && hasShadow) {
            return true;
        }
        return super._useBufferCanvas();
    }
}
exports.Text = Text;
Text.prototype._fillFunc = _fillFunc;
Text.prototype._strokeFunc = _strokeFunc;
Text.prototype.className = TEXT_UPPER;
Text.prototype._attrsAffectingSize = [
    'text',
    'fontSize',
    'padding',
    'wrap',
    'lineHeight',
    'letterSpacing',
];
(0, Global_2._registerNode)(Text);
Factory_1.Factory.overWriteSetter(Text, 'width', (0, Validators_1.getNumberOrAutoValidator)());
Factory_1.Factory.overWriteSetter(Text, 'height', (0, Validators_1.getNumberOrAutoValidator)());
Factory_1.Factory.addGetterSetter(Text, 'direction', INHERIT);
Factory_1.Factory.addGetterSetter(Text, 'fontFamily', 'Arial');
Factory_1.Factory.addGetterSetter(Text, 'fontSize', 12, (0, Validators_1.getNumberValidator)());
Factory_1.Factory.addGetterSetter(Text, 'fontStyle', NORMAL);
Factory_1.Factory.addGetterSetter(Text, 'fontVariant', NORMAL);
Factory_1.Factory.addGetterSetter(Text, 'padding', 0, (0, Validators_1.getNumberValidator)());
Factory_1.Factory.addGetterSetter(Text, 'align', LEFT);
Factory_1.Factory.addGetterSetter(Text, 'verticalAlign', TOP);
Factory_1.Factory.addGetterSetter(Text, 'lineHeight', 1, (0, Validators_1.getNumberValidator)());
Factory_1.Factory.addGetterSetter(Text, 'wrap', WORD);
Factory_1.Factory.addGetterSetter(Text, 'ellipsis', false, (0, Validators_1.getBooleanValidator)());
Factory_1.Factory.addGetterSetter(Text, 'letterSpacing', 0, (0, Validators_1.getNumberValidator)());
Factory_1.Factory.addGetterSetter(Text, 'text', '', (0, Validators_1.getStringValidator)());
Factory_1.Factory.addGetterSetter(Text, 'textDecoration', '');
Factory_1.Factory.addGetterSetter(Text, 'vertical', false, (0, Validators_1.getBooleanValidator)());
