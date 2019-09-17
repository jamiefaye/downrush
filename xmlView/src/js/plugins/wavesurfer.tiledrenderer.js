/*!
 * wavesurfer.js 2.0.4 (Fri Mar 02 2018 18:29:26 GMT-0800 (PST))
 * https://github.com/katspaugh/wavesurfer.js
 * @license BSD-3-Clause
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("tiledrenderer", [], factory);
	else if(typeof exports === 'object')
		exports["tiledrenderer"] = factory();
	else
		root["WaveSurfer"] = root["WaveSurfer"] || {}, root["WaveSurfer"]["tiledrenderer"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "localhost:8080/dist/plugin/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ajax = __webpack_require__(12);

Object.defineProperty(exports, 'ajax', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_ajax).default;
  }
});

var _getId = __webpack_require__(13);

Object.defineProperty(exports, 'getId', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getId).default;
  }
});

var _max = __webpack_require__(14);

Object.defineProperty(exports, 'max', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_max).default;
  }
});

var _min = __webpack_require__(15);

Object.defineProperty(exports, 'min', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_min).default;
  }
});

var _observer = __webpack_require__(1);

Object.defineProperty(exports, 'Observer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_observer).default;
  }
});

var _extend = __webpack_require__(16);

Object.defineProperty(exports, 'extend', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_extend).default;
  }
});

var _style = __webpack_require__(17);

Object.defineProperty(exports, 'style', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_style).default;
  }
});

var _requestAnimationFrame = __webpack_require__(2);

Object.defineProperty(exports, 'requestAnimationFrame', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_requestAnimationFrame).default;
  }
});

var _frame = __webpack_require__(18);

Object.defineProperty(exports, 'frame', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_frame).default;
  }
});

var _debounce = __webpack_require__(19);

Object.defineProperty(exports, 'debounce', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_debounce).default;
  }
});

var _preventClick = __webpack_require__(20);

Object.defineProperty(exports, 'preventClick', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_preventClick).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @typedef {Object} ListenerDescriptor
 * @property {string} name The name of the event
 * @property {function} callback The callback
 * @property {function} un The function to call to remove the listener
 */

/**
 * Observer class
 */
var Observer = function () {
    /**
     * Instantiate Observer
     */
    function Observer() {
        _classCallCheck(this, Observer);

        /**
         * @private
         * @todo Initialise the handlers here already and remove the conditional
         * assignment in `on()`
         */
        this.handlers = null;
    }
    /**
     * Attach a handler function for an event.
     *
     * @param {string} event Name of the event to listen to
     * @param {function} fn The callback to trigger when the event is fired
     * @return {ListenerDescriptor}
     */


    _createClass(Observer, [{
        key: "on",
        value: function on(event, fn) {
            var _this = this;

            if (!this.handlers) {
                this.handlers = {};
            }

            var handlers = this.handlers[event];
            if (!handlers) {
                handlers = this.handlers[event] = [];
            }
            handlers.push(fn);

            // Return an event descriptor
            return {
                name: event,
                callback: fn,
                un: function un(e, fn) {
                    return _this.un(e, fn);
                }
            };
        }

        /**
         * Remove an event handler.
         *
         * @param {string} event Name of the event the listener that should be
         * removed listens to
         * @param {function} fn The callback that should be removed
         */

    }, {
        key: "un",
        value: function un(event, fn) {
            if (!this.handlers) {
                return;
            }

            var handlers = this.handlers[event];
            var i = void 0;
            if (handlers) {
                if (fn) {
                    for (i = handlers.length - 1; i >= 0; i--) {
                        if (handlers[i] == fn) {
                            handlers.splice(i, 1);
                        }
                    }
                } else {
                    handlers.length = 0;
                }
            }
        }

        /**
         * Remove all event handlers.
         */

    }, {
        key: "unAll",
        value: function unAll() {
            this.handlers = null;
        }

        /**
         * Attach a handler to an event. The handler is executed at most once per
         * event type.
         *
         * @param {string} event The event to listen to
         * @param {function} handler The callback that is only to be called once
         * @return {ListenerDescriptor}
         */

    }, {
        key: "once",
        value: function once(event, handler) {
            var _this2 = this;

            var fn = function fn() {
                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                /*  eslint-disable no-invalid-this */
                handler.apply(_this2, args);
                /*  eslint-enable no-invalid-this */
                setTimeout(function () {
                    _this2.un(event, fn);
                }, 0);
            };
            return this.on(event, fn);
        }

        /**
         * Manually fire an event
         *
         * @param {string} event The event to fire manually
         * @param {...any} args The arguments with which to call the listeners
         */

    }, {
        key: "fireEvent",
        value: function fireEvent(event) {
            for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
            }

            if (!this.handlers) {
                return;
            }
            var handlers = this.handlers[event];
            handlers && handlers.forEach(function (fn) {
                fn.apply(undefined, args);
            });
        }
    }]);

    return Observer;
}();

exports.default = Observer;
module.exports = exports["default"];

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

/**
 * Returns the requestAnimationFrame function for the browser, or a shim with
 * setTimeout if none is found
 *
 * @return {function}
 */
exports.default = (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback, element) {
    return setTimeout(callback, 1000 / 60);
}).bind(window);

module.exports = exports["default"];

/***/ }),
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.tiledDrawBuffer = exports.TiledRenderer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _drawer = __webpack_require__(11);

var _drawer2 = _interopRequireDefault(_drawer);

var _util = __webpack_require__(0);

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @typedef {Object} CanvasEntry
 * @private
 * @property {HTMLElement} wave The wave node
 * @property {CanvasRenderingContext2D} waveCtx The canvas rendering context
 * @property {?HTMLElement} progress The progress wave node
 * @property {?CanvasRenderingContext2D} progressCtx The progress wave canvas
 * rendering context
 * @property {?number} start Start of the area the canvas should render, between 0 and 1
 * @property {?number} end End of the area the canvas should render, between 0 and 1
 */

/**
 * TiledRenderer for wavesurfer. Based on the MultiCanvas renderer bundled with WaveSurfer.
 * TiledRenderer works with a pool of Canvas objects, automatically drawing and positioning them
 * as needed.
 */

var TiledRenderer = function (_Drawer) {
    _inherits(TiledRenderer, _Drawer);

    /**
     * @param {HTMLElement} container The container node of the wavesurfer instance
     * @param {WavesurferParams} params The wavesurfer initialisation options
     */
    function TiledRenderer(container, params) {
        _classCallCheck(this, TiledRenderer);

        /**
         * @type {number}
         * @private
         */
        var _this = _possibleConstructorReturn(this, (TiledRenderer.__proto__ || Object.getPrototypeOf(TiledRenderer)).call(this, container, params));

        _this.maxCanvasWidth = params.maxCanvasWidth;
        /**
         * @private
         * @type {number}
         */
        _this.maxCanvasElementWidth = Math.round(params.maxCanvasWidth / params.pixelRatio);

        /**
         * Whether or not the progress wave is renderered. If the `waveColor`
         * and `progressColor` are the same colour it is not.
         * @type {boolean}
         */
        _this.hasProgressCanvas = params.waveColor != params.progressColor;
        /**
         * @private
         * @type {number}
         */
        _this.halfPixel = 0.5 / params.pixelRatio;
        // Use tiled rendering if you need more than canvasLimit canvases
        _this.canvasLimit = params.canvasLimit || 6;
        // Use the sample-drawer if the minPxPerSec is >= sampleSpeed, otherwise use peaks/bars.
        _this.sampleSpeed = params.sampleSpeed || 2560;
        /**
         * @private
         * @type {Array}
         */
        _this.canvases = [];
        /** @private */
        _this.progressWave = null;
        _this.tiledRendering = false;
        return _this;
    }

    /**
     * Initialise the drawer
     */


    _createClass(TiledRenderer, [{
        key: 'init',
        value: function init() {
            this.createWrapper();
            this.createElements();
        }

        /**
         * Create the canvas elements and style them
         *
         * @private
         */

    }, {
        key: 'createElements',
        value: function createElements() {
            this.progressWave = this.wrapper.appendChild(this.style(document.createElement('wave'), {
                position: 'absolute',
                zIndex: 3,
                left: 0,
                top: 0,
                bottom: 0,
                overflow: 'hidden',
                width: '0',
                display: 'none',
                boxSizing: 'border-box',
                borderRightStyle: 'solid',
                pointerEvents: 'none'
            }));

            this.addCanvas();
            this.updateCursor();
        }

        /**
         * Update cursor style from params.
         */

    }, {
        key: 'updateCursor',
        value: function updateCursor() {
            this.style(this.progressWave, {
                borderRightWidth: this.params.cursorWidth + 'px',
                borderRightColor: this.params.cursorColor
            });
        }

        /**
         * Recenter the viewport on a position, either scroll there immediately or
         * in steps of 5 pixels
         *
         * @param {number} position X-offset in pixels
         * @param {boolean} immediate Set to true to immediately scroll somewhere
         */

    }, {
        key: 'recenterOnPosition',
        value: function recenterOnPosition(position, immediate) {
            var scrollLeft = this.wrapper.scrollLeft;
            var half = ~~(this.wrapper.clientWidth / 2);
            var maxScroll = this.wrapper.scrollWidth - this.wrapper.clientWidth;
            var target = position - half;
            var offset = target - scrollLeft;

            if (maxScroll == 0) {
                // no need to continue if scrollbar is not there
                return;
            }

            // if the cursor is currently visible
            // and the scroll velocity is not too high.
            if (!immediate && -half <= offset && offset < half && this.params.minPxPerSec < 400) {
                // we'll limit the "re-center" rate.
                var rate = 5;
                offset = Math.max(-rate, Math.min(rate, offset));
                target = scrollLeft + offset;
            }

            // limit target to valid range (0 to maxScroll)
            target = Math.max(0, Math.min(maxScroll, target));
            // no use attempting to scroll if we're not moving
            if (target != scrollLeft) {
                this.wrapper.scrollLeft = target;
            }
        }

        /**
         * Adjust to the updated size by adding or removing canvases
         */

    }, {
        key: 'updateSize',
        value: function updateSize() {
            var _this2 = this;

            var totalWidth = Math.round(this.width / this.params.pixelRatio);
            var requiredCanvases = Math.ceil(totalWidth / this.maxCanvasElementWidth);
            var canvasCount = this.tiledRendering && this.canvasLimit < requiredCanvases ? this.canvasLimit : requiredCanvases;

            while (this.canvases.length < canvasCount) {
                this.addCanvas();
            }

            while (this.canvases.length > canvasCount) {
                this.removeCanvas();
            }

            this.canvases.forEach(function (entry, i) {
                //  reflow canvases in order
                var leftOffset = _this2.maxCanvasElementWidth * i;
                // Add some overlap to prevent vertical white stripes, keep the width even for simplicity.
                var canvasWidth = _this2.maxCanvasWidth + 2 * Math.ceil(_this2.params.pixelRatio / 2);

                if (!_this2.tiledRendering && i === _this2.canvases.length - 1) {
                    if (i === _this2.canvases.length - 1) {
                        canvasWidth = _this2.width - _this2.maxCanvasWidth * (_this2.canvases.length - 1);
                    }
                }

                _this2.updateDimensions(entry, canvasWidth, _this2.height, leftOffset, _this2.maxCanvasWidth * i);
                _this2.clearWaveForEntry(entry);
            });
        }

        /**
         * Add a canvas to the canvas list
         *
         * @private
         */

    }, {
        key: 'addCanvas',
        value: function addCanvas() {
            var entry = {};
            var leftOffset = this.maxCanvasElementWidth * this.canvases.length;

            entry.wave = this.wrapper.appendChild(this.style(document.createElement('canvas'), {
                position: 'absolute',
                zIndex: 2,
                left: leftOffset + 'px',
                top: 0,
                bottom: 0,
                height: '100%',
                pointerEvents: 'none'
            }));
            entry.waveCtx = entry.wave.getContext('2d');

            if (this.hasProgressCanvas) {
                entry.progress = this.progressWave.appendChild(this.style(document.createElement('canvas'), {
                    position: 'absolute',
                    left: leftOffset + 'px',
                    top: 0,
                    bottom: 0,
                    height: '100%'
                }));
                entry.progressCtx = entry.progress.getContext('2d');
            }

            this.canvases.push(entry);
        }

        /**
         * Pop one canvas from the list
         *
         * @private
         */

    }, {
        key: 'removeCanvas',
        value: function removeCanvas() {
            var lastEntry = this.canvases.pop();
            lastEntry.wave.parentElement.removeChild(lastEntry.wave);
            if (this.hasProgressCanvas) {
                lastEntry.progress.parentElement.removeChild(lastEntry.progress);
            }
        }

        /**
         * Update the dimensions of a canvas element
         *
         * @private
         * @param {CanvasEntry} entry
         * @param {number} width The new width of the element in canvas coordinates
         * @param {number} height The new height of the element
         * @param {number} offset Offset of the element in css coordinates
         * @param {number} leftCanX Offset of the element in canvas coordinates.
         */

    }, {
        key: 'updateDimensions',
        value: function updateDimensions(entry, width, height, offset, leftCanX) {
            var totalWidth = Math.round(this.width / this.params.pixelRatio);
            var elementWidth = Math.round(width / this.params.pixelRatio);
            // Where the canvas starts and ends in the waveform, represented as a decimal between 0 and 1.
            entry.start = offset / totalWidth || 0;
            // entry.start = entry.waveCtx.canvas.offsetLeft / totalWidth || 0;
            entry.end = entry.start + elementWidth / totalWidth;
            entry.leftX = leftCanX;
            entry.waveCtx.canvas.width = width;
            entry.waveCtx.canvas.height = height;
            this.style(entry.waveCtx.canvas, {
                width: elementWidth + 'px',
                left: offset + 'px'
            });

            this.style(this.progressWave, { display: 'block' });

            if (this.hasProgressCanvas) {
                entry.progressCtx.canvas.width = width;
                entry.progressCtx.canvas.height = height;
                this.style(entry.progressCtx.canvas, {
                    width: elementWidth + 'px',
                    left: offset + 'px'
                });
            }

            // Create an empty <div> to hold open
            if (this.tiledRendering && !this.spacer) {
                this.spacer = this.wrapper.appendChild(this.style(document.createElement('div'), {
                    id: 'spacerdiv',
                    position: 'absolute',
                    zIndex: 2,
                    top: 0,
                    bottom: '1px',
                    width: '1px',
                    left: totalWidth + 'px',
                    height: '100%',
                    pointerEvents: 'none'
                }));
            }
            if (this.spacer) {
                this.style(this.spacer, { left: totalWidth + 'px' });
            }
        }
        /**
         * Clear the whole waveform
         */

    }, {
        key: 'clearWave',
        value: function clearWave() {
            var _this3 = this;

            this.canvases.forEach(function (entry) {
                return _this3.clearWaveForEntry(entry);
            });
        }

        /**
         * Clear one canvas
         *
         * @private
         * @param {CanvasEntry} entry
         */

    }, {
        key: 'clearWaveForEntry',
        value: function clearWaveForEntry(entry) {
            entry.waveCtx.clearRect(0, 0, entry.waveCtx.canvas.width, entry.waveCtx.canvas.height);
            if (this.hasProgressCanvas) {
                entry.progressCtx.clearRect(0, 0, entry.progressCtx.canvas.width, entry.progressCtx.canvas.height);
            }
        }

        /**
         * Draw peaks on the (first) canvas
         * (control comes thru here via the minimap plugin or when clearing the waveform).
         *
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} length The width of the area that should be drawn
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that should be
         * rendered
         */

    }, {
        key: 'drawPeaks',
        value: function drawPeaks(peaks, length, start, end) {
            if (!this.setWidth(length)) {
                this.clearWave();
            }
            this.params.barWidth ? this.drawBars(peaks, 0, start, end, this.canvases[0]) : this.drawWave(peaks, 0, start, end, this.canvases[0]);
        }

        /**
         * Draw a waveform with bars
         *
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} channelIndex The index of the current channel. Normally
         * should be 0. Must be an integer.
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that should be
         * rendered
         * @param (canvas) the canvas to draw the wave on,
         */

    }, {
        key: 'drawBars',
        value: function drawBars(peaks, channelIndex, start, end, canvas) {
            var _this4 = this;

            this.prepareDraw(peaks, channelIndex, start, end, function (_ref) {
                var absmax = _ref.absmax,
                    hasMinVals = _ref.hasMinVals,
                    height = _ref.height,
                    offsetY = _ref.offsetY,
                    halfH = _ref.halfH,
                    peaks = _ref.peaks;

                // if drawBars was called within ws.empty we don't pass a start and
                // don't want anything to happen
                if (start === undefined) {
                    return;
                }
                // Skip every other value if there are negatives.
                var peakIndexScale = hasMinVals ? 2 : 1;
                var length = peaks.length / peakIndexScale;
                var bar = _this4.params.barWidth * _this4.params.pixelRatio;
                var gap = _this4.params.barGap === null ? Math.max(_this4.params.pixelRatio, ~~(bar / 2)) : Math.max(_this4.params.pixelRatio, _this4.params.barGap * _this4.params.pixelRatio);
                var step = bar + gap;

                var scale = length / _this4.width;
                var first = start;
                var last = end;
                var i = void 0;

                for (i = first; i < last; i += step) {
                    var peak = peaks[Math.floor(i * scale * peakIndexScale)] || 0;
                    var h = Math.round(peak / absmax * halfH);
                    _this4.fillRect(i - first + _this4.halfPixel, halfH - h + offsetY, bar + _this4.halfPixel, h * 2, canvas);
                }
            }, canvas);
        }

        /**
         * Draw a waveform
         *
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} channelIndex The index of the current channel. Normally
         * should be 0
         * @param {number?} start The x-offset of the beginning of the area that
         * should be rendered (If this isn't set only a flat line is rendered)
         * @param {number?} end The x-offset of the end of the area that should be
         * rendered
         * @param (canvas) the canvas to draw the wave on,
         */

    }, {
        key: 'drawWave',
        value: function drawWave(peaks, channelIndex, start, end, canvas) {
            var _this5 = this;

            this.prepareDraw(peaks, channelIndex, start, end, function (_ref2) {
                var absmax = _ref2.absmax,
                    hasMinVals = _ref2.hasMinVals,
                    height = _ref2.height,
                    offsetY = _ref2.offsetY,
                    halfH = _ref2.halfH,
                    peaks = _ref2.peaks;

                if (!hasMinVals) {
                    var reflectedPeaks = [];
                    var len = peaks.length;
                    var i = void 0;
                    for (i = 0; i < len; i++) {
                        reflectedPeaks[2 * i] = peaks[i];
                        reflectedPeaks[2 * i + 1] = -peaks[i];
                    }
                    peaks = reflectedPeaks;
                }

                // if drawWave was called within ws.empty we don't pass a start and
                // end and simply want a flat line
                if (start !== undefined) {
                    _this5.drawLine(peaks, absmax, halfH, offsetY, start, end, canvas);
                }

                // Always draw a median line
                _this5.fillRect(0, halfH + offsetY - _this5.halfPixel, _this5.width, _this5.halfPixel, canvas);
            }, canvas);
        }

        /**
         * Draw part of the waveform on a particular canvas
         *
         * @private
         * @param {number[]} peaks Peak data
         * @param {number} absmax Maximum peak value (absolute)
         * @param {number} halfH Half the height of the waveform
         * @param {number} offsetY Offset to the top
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that
         * should be rendered
         */

    }, {
        key: 'drawLine',
        value: function drawLine(peaks, absmax, halfH, offsetY, start, end, entry) {
            // let t0 = performance.now();
            this.setFillStyles(entry);
            this.drawLineToContext(entry, entry.waveCtx, peaks, absmax, halfH, offsetY, start, end);
            this.drawLineToContext(entry, entry.progressCtx, peaks, absmax, halfH, offsetY, start, end);
        }

        /**
         * Render the actual waveform line on a canvas
         *
         * @private
         * @param {CanvasEntry} entry
         * @param {Canvas2DContextAttributes} ctx Essentially `entry.[wave|progress]Ctx`
         * @param {number[]} peaks
         * @param {number} absmax Maximum peak value (absolute)
         * @param {number} halfH Half the height of the waveform
         * @param {number} offsetY Offset to the top
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that
         * should be rendered
         */

    }, {
        key: 'drawLineToContext',
        value: function drawLineToContext(entry, ctx, peaks, absmax, halfH, offsetY, start, end) {
            if (!ctx) {
                return;
            }

            var length = peaks.length / 2;
            //  const scale = this.width != length ? this.width / length : 1;

            var scale = this.params.fillParent && this.width != length ? this.width / length : 1;

            var first = Math.round(length * entry.start);
            // Use one more peak value to make sure we join peaks at ends -- unless,
            // of course, this is the last canvas.
            var last = Math.round(length * entry.end) + 1;
            if (first > end || last < start) {
                return;
            }
            var canvasStart = Math.min(first, start);
            var canvasEnd = Math.max(last, end);
            var i = void 0;
            var j = void 0;

            ctx.beginPath();
            ctx.moveTo((canvasStart - first) * scale + this.halfPixel, halfH + offsetY);

            for (i = canvasStart; i < canvasEnd; i++) {
                var peak = peaks[2 * i] || 0;
                var h = Math.round(peak / absmax * halfH);
                ctx.lineTo((i - first) * scale + this.halfPixel, halfH - h + offsetY);
            }

            // Draw the bottom edge going backwards, to make a single
            // closed hull to fill.
            for (j = canvasEnd - 1; j >= canvasStart; j--) {
                var _peak = peaks[2 * j + 1] || 0;
                var _h = Math.round(_peak / absmax * halfH);
                ctx.lineTo((j - first) * scale + this.halfPixel, halfH - _h + offsetY);
            }

            ctx.closePath();
            ctx.fill();
        }

        /**
         * Draw a rectangle on the waveform
         *
         * @param {number} x
         * @param {number} y
         * @param {number} width
         * @param {number} height
           @param {canvas} entry
         */

    }, {
        key: 'fillRect',
        value: function fillRect(x, y, width, height, entry) {
            this.setFillStyles(entry);

            this.fillRectToContext(entry.waveCtx, x, y, width, height);

            this.fillRectToContext(entry.progressCtx, x, y, width, height);
        }

        /**
         * Performs preparation tasks and calculations which are shared by drawBars and drawWave
         *
         * @private
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} channelIndex The index of the current channel. Normally
         * should be 0
         * @param {number?} start The x-offset of the beginning of the area that
         * should be rendered (If this isn't set only a flat line is rendered)
         * @param {number?} end The x-offset of the end of the area that should be
         * rendered
         * @param {function} fn The render function to call
         * @param {canvas} The canvas to draw upon.
         */

    }, {
        key: 'prepareDraw',
        value: function prepareDraw(peaks, channelIndex, start, end, fn, canvas) {
            var _this6 = this;
            // Split channels and call this function with the channelIndex set
            if (!peaks) {
                var cat = 3;
            }
            if (peaks[0] instanceof Array) {
                var channels = peaks;
                if (this.params.splitChannels) {
                    this.setHeight(channels.length * this.params.height * this.params.pixelRatio);
                    return channels.forEach(function (channelPeaks, i) {
                        return _this6.prepareDraw(channelPeaks, i, start, end, fn, canvas);
                    });
                }
                peaks = channels[0];
            }
            // calculate maximum modulation value, either from the barHeight
            // parameter or if normalize=true from the largest value in the peak
            // set
            var absmax = 1 / this.params.barHeight;
            if (this.params.normalize) {
                var max = util.max(peaks);
                var min = util.min(peaks);
                absmax = -min > max ? -min : max;
            }

            // Bar wave draws the bottom only as a reflection of the top,
            // so we don't need negative values
            var hasMinVals = [].some.call(peaks, function (val) {
                return val < 0;
            });
            var height = this.params.height * this.params.pixelRatio;
            var offsetY = height * channelIndex || 0;
            var halfH = height / 2;

            return fn({
                absmax: absmax,
                hasMinVals: hasMinVals,
                height: height,
                offsetY: offsetY,
                halfH: halfH,
                peaks: peaks,
                entry: canvas
            });
        }

        /**
         * Draw the actual rectangle on a canvas
         *
         * @private
         * @param {Canvas2DContextAttributes} ctx
         * @param {number} x
         * @param {number} y
         * @param {number} width
         * @param {number} height
         */

    }, {
        key: 'fillRectToContext',
        value: function fillRectToContext(ctx, x, y, width, height) {
            if (!ctx) {
                return;
            }
            ctx.fillRect(x, y, width, height);
        }

        /**
         * Set the fill styles for a certain entry (wave and progress)
         *
         * @private
         * @param {CanvasEntry} entry
         */

    }, {
        key: 'setFillStyles',
        value: function setFillStyles(entry) {
            entry.waveCtx.fillStyle = this.params.waveColor;
            if (this.hasProgressCanvas) {
                entry.progressCtx.fillStyle = this.params.progressColor;
            }
        }

        /**
         * Return image data of the waveform
         *
         * @param {string} type='image/png' An optional value of a format type.
         * @param {number} quality=0.92 An optional value between 0 and 1.
         * @return {string|string[]} images A data URL or an array of data URLs
         */

    }, {
        key: 'getImage',
        value: function getImage(type, quality) {
            var images = this.canvases.map(function (entry) {
                return entry.wave.toDataURL(type, quality);
            });
            return images.length > 1 ? images : images[0];
        }

        /**
         * Render the new progress
         *
         * @param {number} position X-Offset of progress position in pixels
         */

    }, {
        key: 'updateProgress',
        value: function updateProgress(position) {
            this.style(this.progressWave, { width: position + 'px' });
        }

        /**
         * Calculate position and width of the canvas corresponding to the normalized
         * X position supplied.
         *
         * @param surfer {Wavesurfer} wavesurfer instance that has channel data
         * @param xNorm {number} Normalized X position to use to determine canvas info.
         * @returns: lhs (number) left hand side coordianate of canvas in css coordinates.
         * canvaWidth (number) width of canvas (in canvas coordinates), adjusted if need be for last.
         * leftOff (number) left coordinate of canvas (in canvas coordinates).
         */

    }, {
        key: 'calcCanvasInfo',
        value: function calcCanvasInfo(surfer, xNorm) {
            var durScale = surfer.getDuration() * this.params.minPxPerSec;
            var xc = xNorm * durScale / this.params.pixelRatio;
            var canNum = Math.floor(xc / this.maxCanvasElementWidth);

            var lhs = canNum * this.maxCanvasElementWidth; // lhs in css coordinates
            var leftOff = canNum * this.maxCanvasWidth;
            var canvasWidth = this.maxCanvasWidth + 2 * Math.ceil(this.params.pixelRatio / 2);

            // If this is the last canvas position, trim its size back so as to not overhang
            if ((canNum + 1) * this.maxCanvasWidth > this.width) {
                canvasWidth = this.width - this.maxCanvasWidth * canNum;
            }
            return {
                left: lhs,
                canvasWidth: canvasWidth,
                leftOff: leftOff
            };
        }

        /**
         * fill the given canvas entry with data from the peaks array or the channel buffers
         *
         * @private
         * @param surfer {Wavesurfer} wavesurfer instance that has channel data
         * @param entry {Canvas} canvas to draw onto.
         * @param peaks (Peaks array) peak data to draw with if not using channel data.
         */

    }, {
        key: 'imageSingleCanvas',
        value: function imageSingleCanvas(surfer, entry, peaks) {
            var buffer = surfer.backend.buffer;
            var numberOfChannels = buffer.numberOfChannels,
                sampleRate = buffer.sampleRate;

            var spDx = sampleRate / this.params.minPxPerSec;
            var height = Math.round(this.params.height * this.params.pixelRatio); // ?
            var halfH = Math.round(height / 2);
            var pixH = 2;
            var pixW = Math.ceil(1 / spDx) + 1;
            var ySc = -halfH;
            var duration = surfer.getDuration();
            var durScale = duration * this.params.minPxPerSec;

            var lhs = Math.round(entry.start * durScale);
            var rhs = Math.round(entry.end * durScale);
            if (!entry) {
                var cat = 3;
            }
            if (this.params.minPxPerSec < this.sampleSpeed) {
                this.params.barWidth ? this.drawBars(peaks, 0, lhs, rhs, entry) : this.drawWave(peaks, 0, lhs, rhs, entry);
                return;
            }

            for (var c = 0; c < numberOfChannels; ++c) {
                var chan = buffer.getChannelData(c);
                var yoff = halfH + c * height;
                var progressCtx = entry.progressCtx,
                    waveCtx = entry.waveCtx;

                this.setFillStyles(entry);
                var sx = entry.start * duration * sampleRate;
                var w = rhs - lhs;
                for (var x = 0; x < w; ++x) {
                    var y = yoff + Math.round(chan[Math.round(sx)] * ySc);
                    sx += spDx;
                    waveCtx.fillRect(x, y, pixW, pixH);
                    if (progressCtx) progressCtx.fillRect(x, y, pixW, pixH);
                }
            }
        }

        /**
         * periodic function called in order to maintain the tile strip.
         * returns true if a canvas to reimage was found.
         * @private
         * @param surfer {Wavesurfer} wavesurfer instance that has channel data
         * @param peaks (Peaks array) peak data to draw with if not using channel data.
         * @returns: (boolean) true if a reimage was accomplished, false if not.
         */

    }, {
        key: 'scrollCheck',
        value: function scrollCheck(surfer, peaks) {
            var scrX = surfer.drawer.getScrollX(); // scrX should be in canvas coordinates.

            var duration = surfer.getDuration();
            var durScale = duration * this.params.minPxPerSec;
            var normX = scrX / durScale;

            var playState = surfer.isPlaying();

            if (normX > 1.0) {
                normX = 1.0;
            }

            var foundCan = void 0;
            var canvToFill = void 0;

            var maxDist = 0;
            // Find the canvas which is visable. Also determine the canvas that is farthest away or hidden
            // that we can recycle if need be.
            this.canvases.forEach(function (entry) {
                if (normX >= entry.start && normX < entry.end && !entry.hidden) {
                    foundCan = entry;
                } else {
                    if (entry.hidden) {
                        // hidden entries always win.
                        canvToFill = entry;
                        maxDist = -1; // use -1 as a flag to stop compares.
                    } else if (maxDist >= 0) {
                        var midPt = (entry.start + entry.end) / 2;
                        var dist = Math.abs(normX - midPt);
                        if (dist >= maxDist) {
                            maxDist = dist;
                            canvToFill = entry;
                        }
                    }
                }
            });

            var that = this;
            var whereX = -1;
            // If it isn't there, make that one.
            // If it is already there, find the next one

            if (!foundCan) {
                whereX = normX;
            } else {
                var ourWid = foundCan.end - foundCan.start;
                var ourMid = foundCan.start + ourWid / 2;
                var seekX = ourMid + ourWid;
                var foundUp = void 0;
                if (seekX < 1.0) {
                    foundUp = that.canvases.find(function (can) {
                        return seekX >= can.start && seekX < can.end && !can.hidden;
                    });
                }
                if (!foundUp && seekX < 1.0) {
                    whereX = seekX;
                } else {
                    seekX = ourMid - ourWid;
                    if (seekX < 0) seekX == 0;
                    var foundDn = that.canvases.find(function (can) {
                        return seekX >= can.start && seekX < can.end && !can.hidden;
                    });
                    if (!foundDn) {
                        whereX = seekX;
                    }
                }
            }

            if (whereX >= 0 && canvToFill) {
                var can = this.calcCanvasInfo(surfer, whereX);
                var canvasWidth = can.canvasWidth,
                    left = can.left,
                    leftOff = can.leftOff;

                this.updateDimensions(canvToFill, canvasWidth, this.height, left, leftOff);
                this.clearWaveForEntry(canvToFill);
                this.imageSingleCanvas(surfer, canvToFill, peaks);
                canvToFill.hidden = false;
                return true;
            }

            return false;
        }

        /**
         * called from tiledDrawBuffer to reimage the tiles. If we are using tiled rendering,
         * arrange to repaint the visible area and set up an event listener for scrolling.
         * If we aren't using tiled rendering, then fill up all the canvases.
         *
         * @private
         * @param surfer {Wavesurfer} wavesurfer instance that has channel data
         * @param entry {Canvas} canvas to draw onto.
         * @param peaks (Peaks array) peak data to draw with if not using channel data.
         */

    }, {
        key: 'drawTiles',
        value: function drawTiles(surfer, width, peaks) {
            this.setWidth(width);
            this.clearWave();
            var that = this;

            // Csncel any existing scroll watcher.
            if (this.scrollWatcher) {
                surfer.un('scroll', this.scrollWatcher);
                this.scrollWatcher = undefined;
            }
            if (this.tiledRendering) {
                // Mark all canvases as hidden.
                this.canvases.forEach(function (entry) {
                    entry.hidden = true;
                });
                var repaint = function repaint() {
                    var ctr = 0;
                    while (that.scrollCheck(surfer, peaks)) {
                        if (ctr++ > that.canvasLimit) {
                            return;
                        }
                    }
                };
                setTimeout(repaint);
            } else {
                this.canvases.forEach(function (entry) {
                    that.imageSingleCanvas(surfer, entry, peaks);
                });
            }

            // Make a new scroll watcher if we need it.
            if (this.tiledRendering) {
                var watchFun = function watchFun(screvt) {
                    if (that.tiledRendering) {
                        if (that.params.minPxPerSec < that.sampleSpeed && !peaks) {
                            return;
                        }
                        if (that.scrollCheck(surfer, peaks)) {
                            that.scrollCheck(surfer, peaks);
                        }
                    }
                };
                surfer.on('scroll', watchFun);
                this.scrollWatcher = watchFun;
            }
        }
    }]);

    return TiledRenderer;
}(_drawer2.default); // End of class.

/**
 * A hacked-up version of the drawBuffer routine defined in wavesurfer.js,
 * Since we don't want to use peak data at high magnification levels, we
 * avoid generating and using peak data in the situation. We also
 * turn on the tiled rendering feature if it is needed.
 */


exports.default = TiledRenderer;
var tiledDrawBuffer = function tiledDrawBuffer() {
    var nominalWidth = Math.round(this.getDuration() * this.params.minPxPerSec);
    var parentWidth = this.drawer.getWidth();
    var width = nominalWidth;

    // If we need more than a certain number of canvases, then we will render them dynamically
    var requiredCanvases = Math.ceil(width / this.params.maxCanvasWidth);
    this.drawer.tiledRendering = requiredCanvases > this.drawer.canvasLimit;
    var needPeaks = this.params.minPxPerSec < this.drawer.sampleSpeed;
    var end = Math.max(parentWidth, width);

    this.peaks = undefined;
    var peaks = void 0;
    if (needPeaks) {
        this.backend.peaks = undefined;
        this.backend.mergedPeaks = undefined;
        peaks = this.backend.getPeaks(width, 0, end);
    }
    this.drawer.drawTiles(this, width, peaks);
    this.fireEvent('redraw', peaks, width);
};

exports.TiledRenderer = TiledRenderer;
exports.tiledDrawBuffer = tiledDrawBuffer;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = __webpack_require__(0);

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Parent class for renderers
 *
 * @extends {Observer}
 */
var Drawer = function (_util$Observer) {
    _inherits(Drawer, _util$Observer);

    /**
     * @param {HTMLElement} container The container node of the wavesurfer instance
     * @param {WavesurferParams} params The wavesurfer initialisation options
     */
    function Drawer(container, params) {
        _classCallCheck(this, Drawer);

        /** @private */
        var _this = _possibleConstructorReturn(this, (Drawer.__proto__ || Object.getPrototypeOf(Drawer)).call(this));

        _this.container = container;
        /**
         * @type {WavesurferParams}
         * @private
         */
        _this.params = params;
        /**
         * The width of the renderer
         * @type {number}
         */
        _this.width = 0;
        /**
         * The height of the renderer
         * @type {number}
         */
        _this.height = params.height * _this.params.pixelRatio;
        /** @private */
        _this.lastPos = 0;
        /**
         * The `<wave>` element which is added to the container
         * @type {HTMLElement}
         */
        _this.wrapper = null;
        return _this;
    }

    /**
     * Alias of `util.style`
     *
     * @param {HTMLElement} el The element that the styles will be applied to
     * @param {Object} styles The map of propName: attribute, both are used as-is
     * @return {HTMLElement} el
     */


    _createClass(Drawer, [{
        key: 'style',
        value: function style(el, styles) {
            return util.style(el, styles);
        }

        /**
         * Create the wrapper `<wave>` element, style it and set up the events for
         * interaction
         */

    }, {
        key: 'createWrapper',
        value: function createWrapper() {
            this.wrapper = this.container.appendChild(document.createElement('wave'));

            this.style(this.wrapper, {
                display: 'block',
                position: 'relative',
                userSelect: 'none',
                webkitUserSelect: 'none',
                height: this.params.height + 'px'
            });

            if (this.params.fillParent || this.params.scrollParent) {
                this.style(this.wrapper, {
                    width: '100%',
                    overflowX: this.params.hideScrollbar ? 'hidden' : 'auto',
                    overflowY: 'hidden'
                });
            }

            this.setupWrapperEvents();
        }

        /**
         * Handle click event
         *
         * @param {Event} e Click event
         * @param {?boolean} noPrevent Set to true to not call `e.preventDefault()`
         * @return {number} Playback position from 0 to 1
         */

    }, {
        key: 'handleEvent',
        value: function handleEvent(e, noPrevent) {
            !noPrevent && e.preventDefault();

            var clientX = e.targetTouches ? e.targetTouches[0].clientX : e.clientX;
            var bbox = this.wrapper.getBoundingClientRect();

            var nominalWidth = this.width;
            var parentWidth = this.getWidth();

            var progress = void 0;

            if (!this.params.fillParent && nominalWidth < parentWidth) {
                progress = (clientX - bbox.left) * this.params.pixelRatio / nominalWidth || 0;

                if (progress > 1) {
                    progress = 1;
                }
            } else {
                progress = (clientX - bbox.left + this.wrapper.scrollLeft) / this.wrapper.scrollWidth || 0;
            }

            return progress;
        }

        /**
         * @private
         */

    }, {
        key: 'setupWrapperEvents',
        value: function setupWrapperEvents() {
            var _this2 = this;

            this.wrapper.addEventListener('click', function (e) {
                var scrollbarHeight = _this2.wrapper.offsetHeight - _this2.wrapper.clientHeight;
                if (scrollbarHeight != 0) {
                    // scrollbar is visible.  Check if click was on it
                    var bbox = _this2.wrapper.getBoundingClientRect();
                    if (e.clientY >= bbox.bottom - scrollbarHeight) {
                        // ignore mousedown as it was on the scrollbar
                        return;
                    }
                }

                if (_this2.params.interact) {
                    _this2.fireEvent('click', e, _this2.handleEvent(e));
                }
            });

            this.wrapper.addEventListener('scroll', function (e) {
                return _this2.fireEvent('scroll', e);
            });
        }

        /**
         * Draw peaks on the canvas
         *
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} length The width of the area that should be drawn
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that should be
         * rendered
         */

    }, {
        key: 'drawPeaks',
        value: function drawPeaks(peaks, length, start, end) {
            if (!this.setWidth(length)) {
                this.clearWave();
            }

            this.params.barWidth ? this.drawBars(peaks, 0, start, end) : this.drawWave(peaks, 0, start, end);
        }

        /**
         * Scroll to the beginning
         */

    }, {
        key: 'resetScroll',
        value: function resetScroll() {
            if (this.wrapper !== null) {
                this.wrapper.scrollLeft = 0;
            }
        }

        /**
         * Recenter the viewport at a certain percent of the waveform
         *
         * @param {number} percent Value from 0 to 1 on the waveform
         */

    }, {
        key: 'recenter',
        value: function recenter(percent) {
            var position = this.wrapper.scrollWidth * percent;
            this.recenterOnPosition(position, true);
        }

        /**
         * Recenter the viewport on a position, either scroll there immediately or
         * in steps of 5 pixels
         *
         * @param {number} position X-offset in pixels
         * @param {boolean} immediate Set to true to immediately scroll somewhere
         */

    }, {
        key: 'recenterOnPosition',
        value: function recenterOnPosition(position, immediate) {
            var scrollLeft = this.wrapper.scrollLeft;
            var half = ~~(this.wrapper.clientWidth / 2);
            var maxScroll = this.wrapper.scrollWidth - this.wrapper.clientWidth;
            var target = position - half;
            var offset = target - scrollLeft;

            if (maxScroll == 0) {
                // no need to continue if scrollbar is not there
                return;
            }

            // if the cursor is currently visible...
            if (!immediate && -half <= offset && offset < half) {
                // we'll limit the "re-center" rate.
                var rate = 5;
                offset = Math.max(-rate, Math.min(rate, offset));
                target = scrollLeft + offset;
            }

            // limit target to valid range (0 to maxScroll)
            target = Math.max(0, Math.min(maxScroll, target));
            // no use attempting to scroll if we're not moving
            if (target != scrollLeft) {
                this.wrapper.scrollLeft = target;
            }
        }

        /**
         * Get the current scroll position in pixels
         *
         * @return {number}
         */

    }, {
        key: 'getScrollX',
        value: function getScrollX() {
            var pixelRatio = this.params.pixelRatio;
            var x = Math.round(this.wrapper.scrollLeft * pixelRatio);

            // In cases of elastic scroll (safari with mouse wheel) you can
            // scroll beyond the limits of the container
            // Calculate and floor the scrollable extent to make sure an out
            // of bounds value is not returned
            // Ticket #1312
            if (this.params.scrollParent) {
                var maxScroll = ~~(this.wrapper.scrollWidth * pixelRatio - this.getWidth());
                x = Math.min(maxScroll, Math.max(0, x));
            }

            return x;
        }

        /**
         * Get the width of the container
         *
         * @return {number}
         */

    }, {
        key: 'getWidth',
        value: function getWidth() {
            return Math.round(this.container.clientWidth * this.params.pixelRatio);
        }

        /**
         * Set the width of the container
         *
         * @param {number} width
         */

    }, {
        key: 'setWidth',
        value: function setWidth(width) {
            if (this.width == width) {
                return false;
            }

            this.width = width;

            if (this.params.fillParent || this.params.scrollParent) {
                this.style(this.wrapper, {
                    width: ''
                });
            } else {
                this.style(this.wrapper, {
                    width: ~~(this.width / this.params.pixelRatio) + 'px'
                });
            }

            this.updateSize();
            return true;
        }

        /**
         * Set the height of the container
         *
         * @param {number} height
         */

    }, {
        key: 'setHeight',
        value: function setHeight(height) {
            if (height == this.height) {
                return false;
            }
            this.height = height;

            this.style(this.wrapper, {
                height: ~~(this.height / this.params.pixelRatio) + 'px'
            });

            this.updateSize();
            return true;
        }

        /**
         * Called by wavesurfer when progress should be renderered
         *
         * @param {number} progress From 0 to 1
         */

    }, {
        key: 'progress',
        value: function progress(_progress) {
            var minPxDelta = 1 / this.params.pixelRatio;
            var pos = Math.round(_progress * this.width) * minPxDelta;

            if (pos < this.lastPos || pos - this.lastPos >= minPxDelta) {
                this.lastPos = pos;

                if (this.params.scrollParent && this.params.autoCenter) {
                    var newPos = ~~(this.wrapper.scrollWidth * _progress);
                    this.recenterOnPosition(newPos);
                }

                this.updateProgress(pos);
            }
        }

        /**
         * This is called when wavesurfer is destroyed
         */

    }, {
        key: 'destroy',
        value: function destroy() {
            this.unAll();
            if (this.wrapper) {
                if (this.wrapper.parentNode == this.container) {
                    this.container.removeChild(this.wrapper);
                }
                this.wrapper = null;
            }
        }

        /* Renderer-specific methods */

        /**
         * Called after cursor related params have changed.
         *
         * @abstract
         */

    }, {
        key: 'updateCursor',
        value: function updateCursor() {}

        /**
         * Called when the size of the container changes so the renderer can adjust
         *
         * @abstract
         */

    }, {
        key: 'updateSize',
        value: function updateSize() {}

        /**
         * Draw a waveform with bars
         *
         * @abstract
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} channelIndex The index of the current channel. Normally
         * should be 0
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that should be
         * rendered
         */

    }, {
        key: 'drawBars',
        value: function drawBars(peaks, channelIndex, start, end) {}

        /**
         * Draw a waveform
         *
         * @abstract
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} channelIndex The index of the current channel. Normally
         * should be 0
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that should be
         * rendered
         */

    }, {
        key: 'drawWave',
        value: function drawWave(peaks, channelIndex, start, end) {}

        /**
         * Clear the waveform
         *
         * @abstract
         */

    }, {
        key: 'clearWave',
        value: function clearWave() {}

        /**
         * Render the new progress
         *
         * @abstract
         * @param {number} position X-Offset of progress position in pixels
         */

    }, {
        key: 'updateProgress',
        value: function updateProgress(position) {}
    }]);

    return Drawer;
}(util.Observer);

exports.default = Drawer;
module.exports = exports['default'];

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = ajax;

var _observer = __webpack_require__(1);

var _observer2 = _interopRequireDefault(_observer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Perform an ajax request
 *
 * @param {Options} options Description
 *
 * @returns {Object} Observer instance
 */
function ajax(options) {
    var instance = new _observer2.default();
    var xhr = new XMLHttpRequest();
    var fired100 = false;
    xhr.open(options.method || 'GET', options.url, true);
    xhr.responseType = options.responseType || 'json';

    if (options.xhr) {
        if (options.xhr.requestHeaders) {
            // add custom request headers
            options.xhr.requestHeaders.forEach(function (header) {
                xhr.setRequestHeader(header.key, header.value);
            });
        }
        if (options.xhr.withCredentials) {
            // use credentials
            xhr.withCredentials = true;
        }
    }

    xhr.addEventListener('progress', function (e) {
        instance.fireEvent('progress', e);
        if (e.lengthComputable && e.loaded == e.total) {
            fired100 = true;
        }
    });
    xhr.addEventListener('load', function (e) {
        if (!fired100) {
            instance.fireEvent('progress', e);
        }
        instance.fireEvent('load', e);
        if (200 == xhr.status || 206 == xhr.status) {
            instance.fireEvent('success', xhr.response, e);
        } else {
            instance.fireEvent('error', e);
        }
    });
    xhr.addEventListener('error', function (e) {
        return instance.fireEvent('error', e);
    });
    xhr.send();
    instance.xhr = xhr;
    return instance;
}
module.exports = exports['default'];

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = getId;
/**
 * Get a random prefixed ID
 *
 * @returns {String} Random ID
 */
function getId() {
    return 'wavesurfer_' + Math.random().toString(32).substring(2);
}
module.exports = exports['default'];

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = max;
/**
 * Get the largest value
 *
 * @param   {Array} values Array of numbers
 * @returns {Number} Largest number found
 */
function max(values) {
    var largest = -Infinity;
    Object.keys(values).forEach(function (i) {
        if (values[i] > largest) {
            largest = values[i];
        }
    });
    return largest;
}
module.exports = exports["default"];

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = min;
/**
 * Get the smallest value
 *
 * @param   {Array} values Array of numbers
 * @returns {Number}       Smallest number found
 */
function min(values) {
    var smallest = Number(Infinity);
    Object.keys(values).forEach(function (i) {
        if (values[i] < smallest) {
            smallest = values[i];
        }
    });
    return smallest;
}
module.exports = exports["default"];

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = extend;
/**
 * Extend an object shallowly with others
 *
 * @param {Object} dest The target object
 * @param {Object[]} sources The objects to use for extending
 *
 * @return {Object} Merged object
 */
function extend(dest) {
    for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        sources[_key - 1] = arguments[_key];
    }

    sources.forEach(function (source) {
        Object.keys(source).forEach(function (key) {
            dest[key] = source[key];
        });
    });
    return dest;
}
module.exports = exports["default"];

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = style;
/**
 * Apply a map of styles to an element
 *
 * @param {HTMLElement} el The element that the styles will be applied to
 * @param {Object} styles The map of propName: attribute, both are used as-is
 *
 * @return {HTMLElement} el
 */
function style(el, styles) {
    Object.keys(styles).forEach(function (prop) {
        if (el.style[prop] !== styles[prop]) {
            el.style[prop] = styles[prop];
        }
    });
    return el;
}
module.exports = exports["default"];

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = frame;

var _requestAnimationFrame = __webpack_require__(2);

var _requestAnimationFrame2 = _interopRequireDefault(_requestAnimationFrame);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a function which will be called at the next requestAnimationFrame
 * cycle
 *
 * @param {function} func The function to call
 *
 * @return {func} The function wrapped within a requestAnimationFrame
 */
function frame(func) {
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return (0, _requestAnimationFrame2.default)(function () {
      return func.apply(undefined, args);
    });
  };
}
module.exports = exports['default'];

/***/ }),
/* 19 */
/***/ (function(module, exports) {

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing. The function also has a property 'clear' 
 * that is a function which will clear the timer to prevent previously scheduled executions. 
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */

module.exports = function debounce(func, wait, immediate){
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    var last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        context = args = null;
      }
    }
  };

  var debounced = function(){
    context = this;
    args = arguments;
    timestamp = Date.now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };

  debounced.clear = function() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  debounced.flush = function() {
    if (timeout) {
      result = func.apply(context, args);
      context = args = null;
      
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
};


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = preventClick;
function preventClickHandler(e) {
    e.stopPropagation();
    document.body.removeEventListener('click', preventClickHandler, true);
}

function preventClick(values) {
    document.body.addEventListener('click', preventClickHandler, true);
}
module.exports = exports['default'];

/***/ })
/******/ ]);
});
//# sourceMappingURL=wavesurfer.tiledrenderer.js.map