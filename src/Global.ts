import { Util } from "./Util";

/*
 * Konva JavaScript Framework v@@version
 * http://konvajs.org/
 * Licensed under the MIT
 * Date: @@date
 *
 * Original work Copyright (C) 2011 - 2013 by Eric Rowell (KineticJS)
 * Modified work Copyright (C) 2014 - present by Anton Lavrenov (Konva)
 *
 * @license
 */
const PI_OVER_180 = Math.PI / 180;
/** 縦書きで少し上に移動する文字（下が伸びている文字に対応する） */
const VERTICAL_MOVE_UP = [
  'g', 'j', 'p', 'q', 'y', 'ｇ', 'ｊ', 'ｐ', 'ｑ', 'ｙ'
]
/** 縦書きで右上に移動する文字（捨て仮名） */
const VERTICAL_TOP_RIGHT = [
 'っ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゃ', 'ゅ', 'ょ', 'ゎ', 'ゕ', 'ゖ', 'ァ', 'ィ', 'ゥ',
 'ェ', 'ォ', 'ヵ', 'ㇰ', 'ヶ', 'ㇱ', 'ㇲ', 'ッ', 'ㇳ', 'ㇴ', 'ㇵ', 'ㇶ', 'ㇷ', 'ㇷ゚', 'ㇸ', 
 'ㇹ', 'ㇺ', 'ャ', 'ュ', 'ョ', 'ㇻ', 'ㇼ', 'ㇽ', 'ㇾ', 'ㇿ', 'ヮ'
];
/** 
 * 日本語の読点、句点
 * 縦書きで右上よりさらに奥に移動する
 */
const VERTICAL_JPN_PERIOD = [
  '。', '、', '｡', '､'
];

/** 単純に90度回転する文字 */
const VERTICAL_JPN_ROTATE = [
  'ー', '〝',  '〟', '〰', '〜', '～', '：', '；', '＜', '＞', '∿', '∾', '∿'
]
/** 縦書きで90回転する約物（おそらく半角の場合にちょうど良い） */
const VERTICAL_ROTATE_90_HALF = [
  ' ', '　', '[', ']', '(', ')', '{', '}', '｢', '｣', '-', '･', '·', '·', 'ｰ',
  '∼'
];
/** 
 * 日本語の約物
 * 縦書きで90回転する（回転した後に少し上に移動する） 
 */
const VERTICAL_JPN_BRACKET_START_FULL = [
  '「', '『', '【', '《', '〔', '〚', '〘', '〖', '［',
  '（', '『', '｛', '〈'
];
/** 
 * 日本語の約物
 * 縦書きで90回転する（回転した後に少し下に移動する）
 */
const VERTICAL_JPN_BRACKET_END_FULL = [
  '」', '』', '】', '》', '〕', '〛', '〙', '〗', '〞', '］',
  '）', '』', '｝', '〉'
];
/** 縦書きで回転するクォーテーション */
const VERTICAL_ROTATE_90_QUOT_HALF = [
  '‘', '’', '‵', '′', '‶', '"'
]
/** 
 * 縦書きで回転するクォーテーション
 * そのまま回転すると文字に重なるため上に移動する
 */
const VERTICAL_ROTATE_90_HALF_UP = [
  '\''
]
/** 
 * 縦書きで回転するクォーテーション
 * そのまま回転すると文字に重なるため下に移動する
 */
const VERTICAL_ROTATE_90_HALF_DOWN = [
  '<', '>', '~'
]
/** 
 * 縦書きで回転するクォーテーション
 * そのまま回転すると文字に重なるため右上に移動する
 */
const VERTICAL_ROTATE_90_HALF_UP_RIGHT = [
  ':', ';'
]
/**
 * 縦横でコンバートする文字
 * [横], [縦]
 */
const VERTICAL_TRANSLATE = [
  ['“', '”', '…', '︙', '‥', '︰'],
  ['〝',  '〟', '︙', '…', '︰', '‥']
]

/** 90度回転する文字を統合した配列 */
const VERTICAL_ROTATE_90 = 
  VERTICAL_JPN_ROTATE
  .concat(VERTICAL_ROTATE_90_HALF)
  .concat(VERTICAL_JPN_BRACKET_START_FULL)
  .concat(VERTICAL_JPN_BRACKET_END_FULL)
  .concat(VERTICAL_ROTATE_90_QUOT_HALF)
  .concat(VERTICAL_ROTATE_90_HALF_UP)
  .concat(VERTICAL_ROTATE_90_HALF_UP_RIGHT)
  .concat(VERTICAL_ROTATE_90_HALF_DOWN)

/**
 * @namespace Konva
 */

function detectBrowser() {
  return (
    typeof window !== 'undefined' &&
    // browser case
    ({}.toString.call(window) === '[object Window]' ||
      // electron case
      {}.toString.call(window) === '[object global]')
  );
}

var dummyContext: CanvasRenderingContext2D,
  CONTEXT_2D = '2d';
  
function getDummyContext() {
  if (dummyContext) {
    return dummyContext;
  }
  dummyContext = Util.createCanvasElement().getContext(
    CONTEXT_2D
  ) as CanvasRenderingContext2D;
  return dummyContext;
}

const textHorizontalSizes: { [fontSize: number]: { [char: string]: { width: number, height: number } } } = {};
const textVerticalSizes: { [fontSize: number]: { [char: string]: { width: number, height: number } } } = {};

/**
 * 文字の大きさを取得する
 * @param text 計測する文字
 * @param fontSize フォントサイズ
 * @param font this._getContextFont()で取得したもの
 * @param vertical 縦書きの場合はtrue
 */
function measureText(text: string, fontSize: number, font: string, vertical: boolean) {
  // 空文字の場合はフォントサイズで決め打ちする
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
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      // 変換文字対象の文字かチェックする
      const index = VERTICAL_TRANSLATE[0].indexOf(char);
      const c = index >= 0 ? VERTICAL_TRANSLATE[1][index] : char;
      const metrics = _context.measureText(c);
      if (VERTICAL_ROTATE_90.includes(c)) {
        size = { width: fontSize, height: metrics.width };
      } else {
        size = { width: metrics.width, height: fontSize };
      }
      // 読点で次の文字が全角の括弧閉じの場合は高さを半分にする
      if (VERTICAL_JPN_PERIOD.includes(c)
        && VERTICAL_JPN_BRACKET_END_FULL.includes(text[i + 1])) {
        h += size.height / 2;
      } else if (i === text.length - 1
        && (VERTICAL_JPN_PERIOD.includes(c) || VERTICAL_JPN_BRACKET_END_FULL.includes(char))) {
        // 最後の文字が読点か括弧閉じの場合は高さを半分にする
        h += size.height / 2;
      } else {
        h += size.height;
      }
      maxWidth = Math.max(maxWidth, size.width);
      textVerticalSizes[fontSize][c] = size;
    }
    size = { width: maxWidth, height: h };
    textVerticalSizes[fontSize][text] = size;
  } else {
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

declare const WorkerGlobalScope: any;

export const glob: any =
  typeof global !== 'undefined'
    ? global
    : typeof window !== 'undefined'
    ? window
    : typeof WorkerGlobalScope !== 'undefined'
    ? self
    : {};

export const Konva = {
  _global: glob,
  version: '@@version',
  isBrowser: detectBrowser(),
  isUnminified: /param/.test(function (param: any) {}.toString()),
  dblClickWindow: 400,
  getAngle(angle: number) {
    return Konva.angleDeg ? angle * PI_OVER_180 : angle;
  },
  VERTICAL_MOVE_UP,
  VERTICAL_TOP_RIGHT,
  VERTICAL_JPN_PERIOD,
  VERTICAL_JPN_ROTATE,
  VERTICAL_ROTATE_90_HALF,
  VERTICAL_JPN_BRACKET_START_FULL,
  VERTICAL_JPN_BRACKET_END_FULL,
  VERTICAL_ROTATE_90_QUOT_HALF,
  VERTICAL_ROTATE_90_HALF_UP,
  VERTICAL_ROTATE_90_HALF_UP_RIGHT,
  VERTICAL_ROTATE_90_HALF_DOWN,
  VERTICAL_TRANSLATE,
  measureText,
  getDummyContext,
  enableTrace: false,
  pointerEventsEnabled: true,
  /**
   * Should Konva automatically update canvas on any changes. Default is true.
   * @property autoDrawEnabled
   * @default true
   * @name autoDrawEnabled
   * @memberof Konva
   * @example
   * Konva.autoDrawEnabled = true;
   */
  autoDrawEnabled: true,
  /**
   * Should we enable hit detection while dragging? For performance reasons, by default it is false.
   * But on some rare cases you want to see hit graph and check intersections. Just set it to true.
   * @property hitOnDragEnabled
   * @default false
   * @name hitOnDragEnabled
   * @memberof Konva
   * @example
   * Konva.hitOnDragEnabled = true;
   */
  hitOnDragEnabled: false,
  /**
   * Should we capture touch events and bind them to the touchstart target? That is how it works on DOM elements.
   * The case: we touchstart on div1, then touchmove out of that element into another element div2.
   * DOM will continue trigger touchmove events on div1 (not div2). Because events are "captured" into initial target.
   * By default Konva do not do that and will trigger touchmove on another element, while pointer is moving.
   * @property capturePointerEventsEnabled
   * @default false
   * @name capturePointerEventsEnabled
   * @memberof Konva
   * @example
   * Konva.capturePointerEventsEnabled = true;
   */
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

  /**
   * Global pixel ratio configuration. KonvaJS automatically detect pixel ratio of current device.
   * But you may override such property, if you want to use your value. Set this value before any components initializations.
   * @property pixelRatio
   * @default undefined
   * @name pixelRatio
   * @memberof Konva
   * @example
   * // before any Konva code:
   * Konva.pixelRatio = 1;
   */
  pixelRatio: (typeof window !== 'undefined' && window.devicePixelRatio) || 1,

  /**
   * Drag distance property. If you start to drag a node you may want to wait until pointer is moved to some distance from start point,
   * only then start dragging. Default is 3px.
   * @property dragDistance
   * @default 0
   * @memberof Konva
   * @example
   * Konva.dragDistance = 10;
   */
  dragDistance: 3,
  /**
   * Use degree values for angle properties. You may set this property to false if you want to use radian values.
   * @property angleDeg
   * @default true
   * @memberof Konva
   * @example
   * node.rotation(45); // 45 degrees
   * Konva.angleDeg = false;
   * node.rotation(Math.PI / 2); // PI/2 radian
   */
  angleDeg: true,
  /**
   * Show different warnings about errors or wrong API usage
   * @property showWarnings
   * @default true
   * @memberof Konva
   * @example
   * Konva.showWarnings = false;
   */
  showWarnings: true,

  /**
   * Configure what mouse buttons can be used for drag and drop.
   * Default value is [0] - only left mouse button.
   * @property dragButtons
   * @default true
   * @memberof Konva
   * @example
   * // enable left and right mouse buttons
   * Konva.dragButtons = [0, 2];
   */
  dragButtons: [0, 1],

  /**
   * returns whether or not drag and drop is currently active
   * @method
   * @memberof Konva
   */
  isDragging() {
    return Konva['DD'].isDragging;
  },
  isTransforming() {
    return Konva['Transformer']?.isTransforming();
  },
  /**
   * returns whether or not a drag and drop operation is ready, but may
   *  not necessarily have started
   * @method
   * @memberof Konva
   */
  isDragReady() {
    return !!Konva['DD'].node;
  },
  /**
   * Should Konva release canvas elements on destroy. Default is true.
   * Useful to avoid memory leak issues in Safari on macOS/iOS.
   * @property releaseCanvasOnDestroy
   * @default true
   * @name releaseCanvasOnDestroy
   * @memberof Konva
   * @example
   * Konva.releaseCanvasOnDestroy = true;
   */
  releaseCanvasOnDestroy: true,
  // user agent
  document: glob.document,
  // insert Konva into global namespace (window)
  // it is required for npm packages
  _injectGlobal(Konva) {
    glob.Konva = Konva;
  },
};

export const _registerNode = (NodeClass: any) => {
  Konva[NodeClass.prototype.getClassName()] = NodeClass;
};

Konva._injectGlobal(Konva);
