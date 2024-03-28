import { Util } from '../Util';
import { Context } from '../Context';
import { Factory } from '../Factory';
import { Shape, ShapeConfig } from '../Shape';
import { Konva } from '../Global';
import {
  getNumberValidator,
  getStringValidator,
  getNumberOrAutoValidator,
  getBooleanValidator,
} from '../Validators';
import { _registerNode } from '../Global';

import { GetSet } from '../types';

export function stringToArray(string: string) {
  // we need to use `Array.from` because it can split unicode string correctly
  // we also can use some regexp magic from lodash:
  // https://github.com/lodash/lodash/blob/fb1f99d9d90ad177560d771bc5953a435b2dc119/lodash.toarray/index.js#L256
  // but I decided it is too much code for that small fix
  return Array.from(string);
}

export interface TextConfig extends ShapeConfig {
  direction?: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: string;
  fontVariant?: string;
  textDecoration?: string;
  align?: string;
  verticalAlign?: string;
  padding?: number;
  lineHeight?: number;
  letterSpacing?: number;
  wrap?: string;
  ellipsis?: boolean;
  vertical?: boolean;
}

// constants
var AUTO = 'auto',
  //CANVAS = 'canvas',
  CENTER = 'center',
  INHERIT = 'inherit',
  JUSTIFY = 'justify',
  CHANGE_KONVA = 'Change.konva',
  CONTEXT_2D = '2d',
  DASH = '-',
  LEFT = 'left',
  LTR = 'ltr',
  TEXT = 'text',
  TEXT_UPPER = 'Text',
  TOP = 'top',
  BOTTOM = 'bottom',
  MIDDLE = 'middle',
  NORMAL = 'normal',
  PX_SPACE = 'px ',
  SPACE = ' ',
  RIGHT = 'right',
  RTL = 'rtl',
  WORD = 'word',
  CHAR = 'char',
  NONE = 'none',
  ELLIPSIS = '…',
  ATTR_CHANGE_LIST = [
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
  ],
  // cached variables
  attrChangeListLen = ATTR_CHANGE_LIST.length,
  /** （縦書き）行間 */
  VERTICAL_SPACING = 8,
  /** （縦書き）下線と文字の距離 */
  VERTICAL_UNDERLINE_SPACING = 1,
  /** （縦書き）下線の太さ */
  UNDERLINE_WIDTH = 2;

function normalizeFontFamily(fontFamily: string) {
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

function _fillFunc(this: Text, context: Context) {
  context.fillText(this._partialText, this._partialTextX, this._partialTextY);
}
function _strokeFunc(this: Text, context: Context) {
  context.setAttr('miterLimit', 2);
  context.strokeText(this._partialText, this._partialTextX, this._partialTextY);
}

function checkDefaultFill(config?: TextConfig) {
  config = config || {};

  // set default color to black
  if (
    !config.fillLinearGradientColorStops &&
    !config.fillRadialGradientColorStops &&
    !config.fillPatternImage
  ) {
    config.fill = config.fill || 'black';
  }
  return config;
}

/**
 * Text constructor
 * @constructor
 * @memberof Konva
 * @augments Konva.Shape
 * @param {Object} config
 * @param {String} [config.direction] default is inherit
 * @param {String} [config.fontFamily] default is Arial
 * @param {Number} [config.fontSize] in pixels.  Default is 12
 * @param {String} [config.fontStyle] can be 'normal', 'italic', or 'bold', '500' or even 'italic bold'.  'normal' is the default.
 * @param {String} [config.fontVariant] can be normal or small-caps.  Default is normal
 * @param {String} [config.textDecoration] can be line-through, underline or empty string. Default is empty string.
 * @param {String} config.text
 * @param {String} [config.align] can be left, center, or right
 * @param {String} [config.verticalAlign] can be top, middle or bottom
 * @param {Number} [config.padding]
 * @param {Number} [config.lineHeight] default is 1
 * @param {String} [config.wrap] can be "word", "char", or "none". Default is word
 * @param {Boolean} [config.ellipsis] can be true or false. Default is false. if Konva.Text config is set to wrap="none" and ellipsis=true, then it will add "..." to the end
 * @@shapeParams
 * @@nodeParams
 * @example
 * var text = new Konva.Text({
 *   x: 10,
 *   y: 15,
 *   text: 'Simple Text',
 *   fontSize: 30,
 *   fontFamily: 'Calibri',
 *   fill: 'green'
 * });
 */
export class Text extends Shape<TextConfig> {
  textArr: Array<{ text: string; width: number; height: number, lastInParagraph: boolean }>;
  _partialText: string;
  _partialTextX = 0;
  _partialTextY = 0;

  textWidth: number;
  textHeight: number;
  constructor(config?: TextConfig) {
    super(checkDefaultFill(config));
    // update text data for certain attr changes
    for (var n = 0; n < attrChangeListLen; n++) {
      this.on(ATTR_CHANGE_LIST[n] + CHANGE_KONVA, this._setTextData);
    }
    this._setTextData();
  }

  _sceneFunc(context: Context) {
    var textArr = this.textArr,
      textArrLen = textArr.length;

    if (!this.text()) {
      return;
    }

    var padding = this.padding(),
      fontSize = this.fontSize(),
      fontFamily = this._getContextFont(),
      lineHeightPx = this.lineHeight() * fontSize,
      verticalAlign = this.verticalAlign(),
      direction = this.direction(),
      alignY = 0,
      align = this.align(),
      totalWidth = this.getWidth(),
      letterSpacing = this.letterSpacing(),
      fill = this.fill(),
      textDecoration = this.textDecoration(),
      vertical = this.vertical(),
      shouldUnderline = textDecoration.indexOf('underline') !== -1,
      shouldLineThrough = textDecoration.indexOf('line-through') !== -1,
      n;
    
    direction = direction === INHERIT ? context.direction : direction;

    var translateY = lineHeightPx / 2;

    var lineTranslateX = 0;

    if (direction === RTL) {
      context.setAttr('direction', direction);
    }

    context.setAttr('font', this._getContextFont());

    context.setAttr('textBaseline', MIDDLE);

    context.setAttr('textAlign', LEFT);


    // handle vertical alignment
    if (verticalAlign === MIDDLE) {
      alignY = (this.getHeight() - textArrLen * lineHeightPx - padding * 2) / 2;
    } else if (verticalAlign === BOTTOM) {
      alignY = this.getHeight() - textArrLen * lineHeightPx - padding * 2;
    }

    context.translate(padding, alignY + padding);

    // draw text lines
    var lineTranslateX = this.getWidth() - padding * 2
    
    for (n = 0; n < textArrLen; n++) {
      var obj = textArr[n],
        text = obj.text,
        width = Math.max(obj.width, fontSize),
        height = obj.height,
        lastLine = obj.lastInParagraph,
        spacesNumber,
        oneWord,
        lineWidth;

      // horizontal alignment
      context.save();
      if (vertical) {
        translateY = fontSize / 2;
        lineTranslateX -= width;
        if (n !== 0) {
          lineTranslateX -= VERTICAL_SPACING
        }
        for (var char of text) {
          // Note: l などの細い文字を中央寄せにする
          const size = Konva.measureText(char, fontSize, fontFamily, vertical);
          const diffX = (width - size.width) / 2;

          this._partialText = char;
          const isRotate = Konva.VERTICAL_ROTATE_90.includes(char);
          const isRotateUp =  Konva.VERTICAL_ROTATE_90_UP.includes(char);
          const isRotateDown =  Konva.VERTICAL_ROTATE_90_DOWN.includes(char);
          if (isRotate || isRotateUp || isRotateDown) {
            this._partialTextX = 0;
            this._partialTextY = 0;
            let rotateDiffX: number;
            let rotateDiffY: number;
            if (isRotate) {
              // Note: [] などが半角の場合に元々下にずれているが、
              // 回転させることでさらにズレが目立つようになるので 0.65 に調整している
              rotateDiffX = size.width * 0.65
              rotateDiffY = size.height * 0.5
            } else if (isRotateUp) {
              rotateDiffX = size.width * 0.5
              rotateDiffY = size.height * 0.65
            } else {
              rotateDiffX = size.width * 0.5
              rotateDiffY = size.height * 0.35
            }
            context.save();
            context.translate(lineTranslateX + diffX + rotateDiffX, translateY - rotateDiffY)
            context.rotate(Math.PI / 2);
            context.fillStrokeShape(this);

            // 回転した分戻す
            context.restore();
          } else {
            if ( Konva.VERTICAL_TOP_RIGHT.includes(char)) {
              this._partialTextX = lineTranslateX + diffX + size.width / 8;
              this._partialTextY = translateY - size.height / 8;
            } else if ( Konva.VERTICAL_TOP_RIGHT_OVER.includes(char)) {
              this._partialTextX = lineTranslateX + diffX + size.width * 0.65;
              this._partialTextY = translateY - size.height / 2;
            }  else {
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
      } else {
        lineTranslateX = 0;
        if (align === RIGHT) {
          lineTranslateX += totalWidth - width - padding * 2;
        } else if (align === CENTER) {
          lineTranslateX += (totalWidth - width - padding * 2) / 2;
        }

        if (shouldUnderline) {
          context.save();
          context.beginPath();

          context.moveTo(
            lineTranslateX,
            translateY + Math.round(fontSize / 2)
          );
          spacesNumber = text.split(' ').length - 1;
          oneWord = spacesNumber === 0;
          lineWidth =
            align === JUSTIFY && !lastLine ? totalWidth - padding * 2 : width;
          context.lineTo(
            lineTranslateX + Math.round(lineWidth),
            translateY + Math.round(fontSize / 2)
          );

          // I have no idea what is real ratio
          // just /15 looks good enough
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
          context.lineTo(
            lineTranslateX + Math.round(lineWidth),
            translateY
          );
          context.lineWidth = fontSize / 15;
          const gradient = this._getLinearGradient();
          context.strokeStyle = gradient || fill;
          context.stroke();
          context.restore();
        }
        // As `letterSpacing` isn't supported on Safari, we use this polyfill.
        // The exception is for RTL text, which we rely on native as it cannot
        // be supported otherwise.
        if (direction !== RTL && (letterSpacing !== 0 || align === JUSTIFY)) {
          //   var words = text.split(' ');
          spacesNumber = text.split(' ').length - 1;
          var array = stringToArray(text);
          for (var li = 0; li < array.length; li++) {
            var letter = array[li];
            // skip justify for the last line
            if (letter === ' ' && !lastLine && align === JUSTIFY) {
              lineTranslateX += (totalWidth - padding * 2 - width) / spacesNumber;
              // context.translate(
              //   Math.floor((totalWidth - padding * 2 - width) / spacesNumber),
              //   0
              // );
            }
            this._partialTextX = lineTranslateX;
            this._partialTextY = translateY;
            this._partialText = letter;
            context.fillStrokeShape(this);
            lineTranslateX += Konva.measureText(letter, fontSize, fontFamily, vertical).width + letterSpacing;
          }
        } else {
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
  _hitFunc(context: Context) {
    var width = this.getWidth(),
      height = this.getHeight();

    context.beginPath();
    context.rect(0, 0, width, height);
    context.closePath();
    context.fillStrokeShape(this);
  }
  setText(text: string) {
    var str = Util._isString(text)
      ? text
      : text === null || text === undefined
      ? ''
      : text + '';
    this._setAttr(TEXT, str);
    return this;
  }
  getWidth(): number {
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
  /**
   * get pure text width without padding
   * @method
   * @name Konva.Text#getTextWidth
   * @returns {Number}
   */
  getTextWidth() {
    return this.textWidth;
  }
  getTextHeight() {
    Util.warn(
      'text.getTextHeight() method is deprecated. Use text.height() - for full height and text.fontSize() - for one line height.'
    );
    return this.textHeight;
  }

  _getContextFont() {
    return (
      this.fontStyle() +
      SPACE +
      this.fontVariant() +
      SPACE +
      (this.fontSize() + PX_SPACE) +
      // wrap font family into " so font families with spaces works ok
      normalizeFontFamily(this.fontFamily())
    );
  }
  _addTextLine(line: string) {
    const align = this.align();
    if (align === JUSTIFY) {
      line = line.trim();
    }
    const size = Konva.measureText(line, this.fontSize(), this._getContextFont(), this.vertical());
    return this.textArr.push({
      text: line,
      width: size.width,
      height: size.height,
      lastInParagraph: false,
    });
  }

  _setTextData() {
    var lines = this.text().split('\n'),
      fontSize = +this.fontSize(),
      fontFamily = this._getContextFont(),
      textWidth = 0,
      lineHeightPx = this.lineHeight() * fontSize,
      width = this.attrs.width as number | 'auto' | undefined,
      height = this.attrs.height as number | 'auto' | undefined,
      vertical = this.vertical(),
      fixedWidth = width !== AUTO && width !== undefined,
      fixedHeight = height !== AUTO && height !== undefined,
      padding = this.padding(),
      maxWidth = typeof width === 'number' ? width - padding * 2 : undefined,
      maxHeightPx = typeof height === 'number' ?  height - padding * 2 : undefined,
      currentHeightPx = 0,
      wrap = this.wrap(),
      // align = this.align(),
      shouldWrap = wrap !== NONE,
      wrapAtWord = wrap !== CHAR && shouldWrap,
      shouldAddEllipsis = this.ellipsis();

    this.textArr = [];
    var additionalWidth = shouldAddEllipsis 
      ? Konva.measureText(ELLIPSIS, fontSize, fontFamily, vertical).width 
      : 0;

    if (vertical) {
      // 縦書きで高さが設定されていない場合は文字を表示しない
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
            const size = Konva.measureText(char, fontSize, fontFamily, true);
            if (Konva.VERTICAL_ROTATE_90.includes(char)
              || Konva.VERTICAL_ROTATE_90_DOWN.includes(char) 
              || Konva.VERTICAL_ROTATE_90_UP.includes(char)) {
              w = Math.max(w, size.height);
              h += size.width;
            } else {
              w = Math.max(w, size.width);
              h += size.height;
            }
            if (h > maxHeightPx) {
              this._addTextLine(lineText);
              lineText = char;
              h = size.height;
              textWidth += Math.max(w, fontSize);
            } else {
              lineText += char;
            }
          }
          textWidth += w;
          this._addTextLine(lineText);
        }
        // 幅に行間を追加する
        textWidth += (this.textArr.length - 1) * VERTICAL_SPACING;

        this.textHeight = maxHeightPx;
        this.textWidth = textWidth;
      } else {
        const sizes = lines.map((line) => Konva.measureText(line, fontSize, fontFamily, true));
        this.textHeight = Math.max(...sizes.map((size) => size.height));
        this.textWidth = sizes.reduce((prev, curr) => prev + curr.width, 0) + (lines.length - 1) * VERTICAL_SPACING;
      }
    } else {
      for (var i = 0, max = lines.length; i < max; ++i) {
        var line = lines[i];
        var lineWidth = Konva.measureText(line, fontSize, fontFamily, false).width;
        if (fixedWidth && maxWidth && lineWidth > maxWidth) {
          /*
          * if width is fixed and line does not fit entirely
          * break the line into multiple fitting lines
          */
          while (line.length > 0) {
            /*
            * use binary search to find the longest substring that
            * that would fit in the specified width
            */
            var low = 0,
              high = line.length,
              match = '',
              matchWidth = 0;
            while (low < high) {
              var mid = (low + high) >>> 1,
                substr = line.slice(0, mid + 1),
                substrWidth = Konva.measureText(substr, fontSize, fontFamily, false).width + additionalWidth;
              if (substrWidth <= maxWidth) {
                low = mid + 1;
                match = substr;
                matchWidth = substrWidth;
              } else {
                high = mid;
              }
            }
            /*
            * 'low' is now the index of the substring end
            * 'match' is the substring
            * 'matchWidth' is the substring width in px
            */
            if (match) {
              // a fitting substring was found
              if (wrapAtWord) {
                // try to find a space or dash where wrapping could be done
                var wrapIndex;
                var nextChar = line[match.length];
                var nextIsSpaceOrDash = nextChar === SPACE || nextChar === DASH;
                if (nextIsSpaceOrDash && matchWidth <= maxWidth) {
                  wrapIndex = match.length;
                } else {
                  wrapIndex =
                    Math.max(match.lastIndexOf(SPACE), match.lastIndexOf(DASH)) +
                    1;
                }
                if (wrapIndex > 0) {
                  // re-cut the substring found at the space/dash position
                  low = wrapIndex;
                  match = match.slice(0, low);
                  matchWidth = Konva.measureText(match, fontSize, fontFamily, false).width;
                }
              }
              // if (align === 'right') {
              match = match.trimRight();
              // }
              this._addTextLine(match);
              textWidth = Math.max(textWidth, matchWidth);
              currentHeightPx += lineHeightPx;

              var shouldHandleEllipsis =
                this._shouldHandleEllipsis(currentHeightPx);
              if (shouldHandleEllipsis) {
                this._tryToAddEllipsisToLastLine();
                /*
                * stop wrapping if wrapping is disabled or if adding
                * one more line would overflow the fixed height
                */
                break;
              }
              line = line.slice(low);
              line = line.trimLeft();
              if (line.length > 0) {
                // Check if the remaining text would fit on one line
                lineWidth = Konva.measureText(line, fontSize, fontFamily, false).width;
                if (lineWidth <= maxWidth) {
                  // if it does, add the line and break out of the loop
                  this._addTextLine(line);
                  currentHeightPx += lineHeightPx;
                  textWidth = Math.max(textWidth, lineWidth);
                  break;
                }
              }
            } else {
              // not even one character could fit in the element, abort
              break;
            }
          }
        } else {
          // element width is automatically adjusted to max line width
          this._addTextLine(line);
          currentHeightPx += lineHeightPx;
          textWidth = Math.max(textWidth, lineWidth);
          if (this._shouldHandleEllipsis(currentHeightPx) && i < max - 1) {
            this._tryToAddEllipsisToLastLine();
          }
        }
        // if element height is fixed, abort if adding one more line would overflow
        if (this.textArr[this.textArr.length - 1]) {
          this.textArr[this.textArr.length - 1].lastInParagraph = true;
        }
        if (fixedHeight && maxHeightPx && currentHeightPx + lineHeightPx > maxHeightPx) {
          break;
        }
      }
      this.textHeight = fontSize;
      // var maxTextWidth = 0;
      // for(var j = 0; j < this.textArr.length; j++) {
      //     maxTextWidth = Math.max(maxTextWidth, this.textArr[j].width);
      // }
      this.textWidth = textWidth;
    }
  }

  /**
   * whether to handle ellipsis, there are two cases:
   * 1. the current line is the last line
   * 2. wrap is NONE
   * @param {Number} currentHeightPx
   * @returns
   */
  _shouldHandleEllipsis(currentHeightPx: number): boolean {
    var fontSize = +this.fontSize(),
      lineHeightPx = this.lineHeight() * fontSize,
      height = this.attrs.height,
      fixedHeight = height !== AUTO && height !== undefined,
      padding = this.padding(),
      maxHeightPx = height - padding * 2,
      wrap = this.wrap(),
      shouldWrap = wrap !== NONE;

    return (
      !shouldWrap ||
      (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx)
    );
  }

  _tryToAddEllipsisToLastLine(): void {
    var width = this.attrs.width,
      fixedWidth = width !== AUTO && width !== undefined,
      padding = this.padding(),
      maxWidth = width - padding * 2,
      shouldAddEllipsis = this.ellipsis();

    var lastLine = this.textArr[this.textArr.length - 1];
    if (!lastLine || !shouldAddEllipsis) {
      return;
    }

    if (fixedWidth) {
      var haveSpace = Konva.measureText(lastLine.text + ELLIPSIS, this.fontSize(), this._getContextFont(), this.vertical()).width < maxWidth;
      if (!haveSpace) {
        lastLine.text = lastLine.text.slice(0, lastLine.text.length - 3);
      }
    }

    this.textArr.splice(this.textArr.length - 1, 1);
    this._addTextLine(lastLine.text + ELLIPSIS);
  }

  // for text we can't disable stroke scaling
  // if we do, the result will be unexpected
  getStrokeScaleEnabled() {
    return true;
  }

  _useBufferCanvas() {
    const hasLine =
      this.textDecoration().indexOf('underline') !== -1 ||
      this.textDecoration().indexOf('line-through') !== -1;
    const hasShadow = this.hasShadow();
    if (hasLine && hasShadow) {
      return true;
    }
    return super._useBufferCanvas();
  }

  direction: GetSet<string, this>;
  fontFamily: GetSet<string, this>;
  fontSize: GetSet<number, this>;
  fontStyle: GetSet<string, this>;
  fontVariant: GetSet<string, this>;
  align: GetSet<string, this>;
  letterSpacing: GetSet<number, this>;
  verticalAlign: GetSet<string, this>;
  padding: GetSet<number, this>;
  lineHeight: GetSet<number, this>;
  textDecoration: GetSet<string, this>;
  text: GetSet<string, this>;
  wrap: GetSet<string, this>;
  ellipsis: GetSet<boolean, this>;
  vertical: GetSet<boolean, this>;
}

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
_registerNode(Text);

/**
 * get/set width of text area, which includes padding.
 * @name Konva.Text#width
 * @method
 * @param {Number} width
 * @returns {Number}
 * @example
 * // get width
 * var width = text.width();
 *
 * // set width
 * text.width(20);
 *
 * // set to auto
 * text.width('auto');
 * text.width() // will return calculated width, and not "auto"
 */
Factory.overWriteSetter(Text, 'width', getNumberOrAutoValidator());

/**
 * get/set the height of the text area, which takes into account multi-line text, line heights, and padding.
 * @name Konva.Text#height
 * @method
 * @param {Number} height
 * @returns {Number}
 * @example
 * // get height
 * var height = text.height();
 *
 * // set height
 * text.height(20);
 *
 * // set to auto
 * text.height('auto');
 * text.height() // will return calculated height, and not "auto"
 */

Factory.overWriteSetter(Text, 'height', getNumberOrAutoValidator());


/**
 * get/set direction
 * @name Konva.Text#direction
 * @method
 * @param {String} direction
 * @returns {String}
 * @example
 * // get direction
 * var direction = text.direction();
 *
 * // set direction
 * text.direction('rtl');
 */
Factory.addGetterSetter(Text, 'direction', INHERIT);

/**
 * get/set font family
 * @name Konva.Text#fontFamily
 * @method
 * @param {String} fontFamily
 * @returns {String}
 * @example
 * // get font family
 * var fontFamily = text.fontFamily();
 *
 * // set font family
 * text.fontFamily('Arial');
 */
Factory.addGetterSetter(Text, 'fontFamily', 'Arial');

/**
 * get/set font size in pixels
 * @name Konva.Text#fontSize
 * @method
 * @param {Number} fontSize
 * @returns {Number}
 * @example
 * // get font size
 * var fontSize = text.fontSize();
 *
 * // set font size to 22px
 * text.fontSize(22);
 */
Factory.addGetterSetter(Text, 'fontSize', 12, getNumberValidator());

/**
 * get/set font style.  Can be 'normal', 'italic', or 'bold', '500' or even 'italic bold'.  'normal' is the default.
 * @name Konva.Text#fontStyle
 * @method
 * @param {String} fontStyle
 * @returns {String}
 * @example
 * // get font style
 * var fontStyle = text.fontStyle();
 *
 * // set font style
 * text.fontStyle('bold');
 */

Factory.addGetterSetter(Text, 'fontStyle', NORMAL);

/**
 * get/set font variant.  Can be 'normal' or 'small-caps'.  'normal' is the default.
 * @name Konva.Text#fontVariant
 * @method
 * @param {String} fontVariant
 * @returns {String}
 * @example
 * // get font variant
 * var fontVariant = text.fontVariant();
 *
 * // set font variant
 * text.fontVariant('small-caps');
 */

Factory.addGetterSetter(Text, 'fontVariant', NORMAL);

/**
 * get/set padding
 * @name Konva.Text#padding
 * @method
 * @param {Number} padding
 * @returns {Number}
 * @example
 * // get padding
 * var padding = text.padding();
 *
 * // set padding to 10 pixels
 * text.padding(10);
 */

Factory.addGetterSetter(Text, 'padding', 0, getNumberValidator());

/**
 * get/set horizontal align of text.  Can be 'left', 'center', 'right' or 'justify'
 * @name Konva.Text#align
 * @method
 * @param {String} align
 * @returns {String}
 * @example
 * // get text align
 * var align = text.align();
 *
 * // center text
 * text.align('center');
 *
 * // align text to right
 * text.align('right');
 */

Factory.addGetterSetter(Text, 'align', LEFT);

/**
 * get/set vertical align of text.  Can be 'top', 'middle', 'bottom'.
 * @name Konva.Text#verticalAlign
 * @method
 * @param {String} verticalAlign
 * @returns {String}
 * @example
 * // get text vertical align
 * var verticalAlign = text.verticalAlign();
 *
 * // center text
 * text.verticalAlign('middle');
 */

Factory.addGetterSetter(Text, 'verticalAlign', TOP);

/**
 * get/set line height.  The default is 1.
 * @name Konva.Text#lineHeight
 * @method
 * @param {Number} lineHeight
 * @returns {Number}
 * @example
 * // get line height
 * var lineHeight = text.lineHeight();
 *
 * // set the line height
 * text.lineHeight(2);
 */

Factory.addGetterSetter(Text, 'lineHeight', 1, getNumberValidator());

/**
 * get/set wrap.  Can be "word", "char", or "none". Default is "word".
 * In "word" wrapping any word still can be wrapped if it can't be placed in the required width
 * without breaks.
 * @name Konva.Text#wrap
 * @method
 * @param {String} wrap
 * @returns {String}
 * @example
 * // get wrap
 * var wrap = text.wrap();
 *
 * // set wrap
 * text.wrap('word');
 */

Factory.addGetterSetter(Text, 'wrap', WORD);

/**
 * get/set ellipsis. Can be true or false. Default is false. If ellipses is true,
 * Konva will add "..." at the end of the text if it doesn't have enough space to write characters.
 * That is possible only when you limit both width and height of the text
 * @name Konva.Text#ellipsis
 * @method
 * @param {Boolean} ellipsis
 * @returns {Boolean}
 * @example
 * // get ellipsis param, returns true or false
 * var ellipsis = text.ellipsis();
 *
 * // set ellipsis
 * text.ellipsis(true);
 */

Factory.addGetterSetter(Text, 'ellipsis', false, getBooleanValidator());

/**
 * set letter spacing property. Default value is 0.
 * @name Konva.Text#letterSpacing
 * @method
 * @param {Number} letterSpacing
 */

Factory.addGetterSetter(Text, 'letterSpacing', 0, getNumberValidator());

/**
 * get/set text
 * @name Konva.Text#text
 * @method
 * @param {String} text
 * @returns {String}
 * @example
 * // get text
 * var text = text.text();
 *
 * // set text
 * text.text('Hello world!');
 */

Factory.addGetterSetter(Text, 'text', '', getStringValidator());

/**
 * get/set text decoration of a text.  Possible values are 'underline', 'line-through' or combination of these values separated by space
 * @name Konva.Text#textDecoration
 * @method
 * @param {String} textDecoration
 * @returns {String}
 * @example
 * // get text decoration
 * var textDecoration = text.textDecoration();
 *
 * // underline text
 * text.textDecoration('underline');
 *
 * // strike text
 * text.textDecoration('line-through');
 *
 * // underline and strike text
 * text.textDecoration('underline line-through');
 */

Factory.addGetterSetter(Text, 'textDecoration', '');


Factory.addGetterSetter(Text, 'vertical', false, getBooleanValidator());