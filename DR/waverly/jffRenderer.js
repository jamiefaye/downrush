// import * as util from './util';


/**** import hack *****

 Once I finally get around to setting up webpack, we can replace this junk with the commented out import above.

*/
var util = {}
/**
 * Observer class
 */
util.Observer = class Observer {
	/**
	 * Instantiate Observer
	 */
	constructor() {
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
	on(event, fn) {
		if (!this.handlers) {
			this.handlers = {};
		}

		let handlers = this.handlers[event];
		if (!handlers) {
			handlers = this.handlers[event] = [];
		}
		handlers.push(fn);

		// Return an event descriptor
		return {
			name: event,
			callback: fn,
			un: (e, fn) => this.un(e, fn)
		};
	}

	/**
	 * Remove an event handler.
	 *
	 * @param {string} event Name of the event the listener that should be
	 * removed listens to
	 * @param {function} fn The callback that should be removed
	 */
	un(event, fn) {
		if (!this.handlers) {
			return;
		}

		const handlers = this.handlers[event];
		let i;
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
	unAll() {
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
	once(event, handler) {
		const fn = (...args) => {
			/*  eslint-disable no-invalid-this */
			handler.apply(this, args);
			/*  eslint-enable no-invalid-this */
			setTimeout(() => {
				this.un(event, fn);
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
	fireEvent(event, ...args) {
		if (!this.handlers) {
			return;
		}
		const handlers = this.handlers[event];
		handlers &&
			handlers.forEach(fn => {
				fn(...args);
			});
	}
}

util.style = function style(el, styles) {
	Object.keys(styles).forEach(prop => {
		if (el.style[prop] !== styles[prop]) {
			el.style[prop] = styles[prop];
		}
	});
	return el;
}

util,min = function min(values) {
	let smallest = Number(Infinity);
	Object.keys(values).forEach(i => {
		if (values[i] < smallest) {
			smallest = values[i];
		}
	});
	return smallest;
}

util.max = function max(values) {
	let largest = -Infinity;
	Object.keys(values).forEach(i => {
		if (values[i] > largest) {
			largest = values[i];
		}
	});
	return largest;
}

var reqAnimationFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	((callback, element) => setTimeout(callback, 1000 / 60));


util.frame = function (func) {
	return (...args) => reqAnimationFrame(() => func(...args));
}


/*** End of import hack ***/

/**
 * @typedef {Object} ListenerDescriptor
 * @property {string} name The name of the event
 * @property {function} callback The callback
 * @property {function} un The function to call to remove the listener
 */
 
/**
 * Parent class for renderers
 *
 * @extends {Observer}
 */
/* export default */ class JFDrawer extends util.Observer {
	/**
	 * @param {HTMLElement} container The container node of the wavesurfer instance
	 * @param {WavesurferParams} params The wavesurfer initialisation options
	 */
	constructor(container, params) {
		super();
		/** @private */
		this.container = container;
		/**
		 * @type {WavesurferParams}
		 * @private
		 */
		this.params = params;
		/**
		 * The width of the renderer
		 * @type {number}
		 */
		this.width = 0;
		/**
		 * The height of the renderer
		 * @type {number}
		 */
		this.height = params.height * this.params.pixelRatio;
		/** @private */
		this.lastPos = 0;
		/**
		 * The `<wave>` element which is added to the container
		 * @type {HTMLElement}
		 */
		this.wrapper = null;
	}

	/**
	 * Alias of `util.style`
	 *
	 * @param {HTMLElement} el The element that the styles will be applied to
	 * @param {Object} styles The map of propName: attribute, both are used as-is
	 * @return {HTMLElement} el
	 */
	style(el, styles) {
		return util.style(el, styles);
	}

	/**
	 * Create the wrapper `<wave>` element, style it and set up the events for
	 * interaction
	 */
	createWrapper() {
		this.wrapper = this.container.appendChild(
			document.createElement('wave')
		);

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
	handleEvent(e, noPrevent) {
		!noPrevent && e.preventDefault();

		const clientX = e.targetTouches
			? e.targetTouches[0].clientX
			: e.clientX;
		const bbox = this.wrapper.getBoundingClientRect();

		const nominalWidth = this.width;
		const parentWidth = this.getWidth();

		let progress;

		if (!this.params.fillParent && nominalWidth < parentWidth) {
			progress =
				(clientX - bbox.left) * this.params.pixelRatio / nominalWidth ||
				0;

			if (progress > 1) {
				progress = 1;
			}
		} else {
			progress =
				(clientX - bbox.left + this.wrapper.scrollLeft) /
					this.wrapper.scrollWidth || 0;
		}

		return progress;
	}

	/**
	 * @private
	 */
	setupWrapperEvents() {
		this.wrapper.addEventListener('click', e => {
			const scrollbarHeight =
				this.wrapper.offsetHeight - this.wrapper.clientHeight;
			if (scrollbarHeight != 0) {
				// scrollbar is visible.  Check if click was on it
				const bbox = this.wrapper.getBoundingClientRect();
				if (e.clientY >= bbox.bottom - scrollbarHeight) {
					// ignore mousedown as it was on the scrollbar
					return;
				}
			}

			if (this.params.interact) {
				this.fireEvent('click', e, this.handleEvent(e));
			}
		});

		this.wrapper.addEventListener('scroll', e =>
			this.fireEvent('scroll', e)
		);
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
	drawPeaks(peaks, length, start, end) {
		if (!this.setWidth(length)) {
			this.clearWave();
		}

		this.params.barWidth
			? this.drawBars(peaks, 0, start, end)
			: this.drawWave(peaks, 0, start, end);
	}

	/**
	 * Scroll to the beginning
	 */
	resetScroll() {
		if (this.wrapper !== null) {
			this.wrapper.scrollLeft = 0;
		}
	}

	/**
	 * Recenter the viewport at a certain percent of the waveform
	 *
	 * @param {number} percent Value from 0 to 1 on the waveform
	 */
	recenter(percent) {
		const position = this.wrapper.scrollWidth * percent;
		this.recenterOnPosition(position, true);
	}

	/**
	 * Recenter the viewport on a position, either scroll there immediately or
	 * in steps of 5 pixels
	 *
	 * @param {number} position X-offset in pixels
	 * @param {boolean} immediate Set to true to immediately scroll somewhere
	 */
	recenterOnPosition(position, immediate) {
		const scrollLeft = this.wrapper.scrollLeft;
		const half = ~~(this.wrapper.clientWidth / 2);
		const maxScroll = this.wrapper.scrollWidth - this.wrapper.clientWidth;
		let target = position - half;
		let offset = target - scrollLeft;

		if (maxScroll == 0) {
			// no need to continue if scrollbar is not there
			return;
		}

		// if the cursor is currently visible...
		if (!immediate && -half <= offset && offset < half) {
			// we'll limit the "re-center" rate.
			const rate = 5;
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
	getScrollX() {
		const pixelRatio = this.params.pixelRatio;
		let x = Math.round(this.wrapper.scrollLeft * pixelRatio);

		// In cases of elastic scroll (safari with mouse wheel) you can
		// scroll beyond the limits of the container
		// Calculate and floor the scrollable extent to make sure an out
		// of bounds value is not returned
		// Ticket #1312
		if (this.params.scrollParent) {
			const maxScroll = ~~(
				this.wrapper.scrollWidth * pixelRatio -
				this.getWidth()
			);
			x = Math.min(maxScroll, Math.max(0, x));
		}

		return x;
	}

	/**
	 * Get the width of the container
	 *
	 * @return {number}
	 */
	getWidth() {
		return Math.round(this.container.clientWidth * this.params.pixelRatio);
	}

	/**
	 * Set the width of the container
	 *
	 * @param {number} width
	 */
	setWidth(width) {
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
	setHeight(height) {
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
	progress(progress) {
		const minPxDelta = 1 / this.params.pixelRatio;
		const pos = Math.round(progress * this.width) * minPxDelta;

		if (pos < this.lastPos || pos - this.lastPos >= minPxDelta) {
			this.lastPos = pos;

			if (this.params.scrollParent && this.params.autoCenter) {
				const newPos = ~~(this.wrapper.scrollWidth * progress);
				this.recenterOnPosition(newPos);
			}

			this.updateProgress(pos);
		}
	}

	/**
	 * This is called when wavesurfer is destroyed
	 */
	destroy() {
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
	updateCursor() {}

	/**
	 * Called when the size of the container changes so the renderer can adjust
	 *
	 * @abstract
	 */
	updateSize() {}

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
	drawBars(peaks, channelIndex, start, end) {}

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
	drawWave(peaks, channelIndex, start, end) {}

	/**
	 * Clear the waveform
	 *
	 * @abstract
	 */
	clearWave() {}

	/**
	 * Render the new progress
	 *
	 * @abstract
	 * @param {number} position X-Offset of progress position in pixels
	 */
	updateProgress(position) {}
}


// import Drawer from './drawer';
// import * as util from './util';

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
 * MultiCanvas renderer for wavesurfer. Is currently the default and sole built
 * in renderer.
 */

 var canvasLimit = 6;

/* export default */ class JFFCanvas extends JFDrawer {
	/**
	 * @param {HTMLElement} container The container node of the wavesurfer instance
	 * @param {WavesurferParams} params The wavesurfer initialisation options
	 */
	constructor(container, params) {
		super(container, params);
		/**
		 * @type {number}
		 * @private
		 */
		this.maxCanvasWidth = params.maxCanvasWidth;
		/**
		 * @private
		 * @type {number}
		 */
		this.maxCanvasElementWidth = Math.round(
			params.maxCanvasWidth / params.pixelRatio
		);

		/**
		 * Whether or not the progress wave is renderered. If the `waveColor`
		 * and `progressColor` are the same colour it is not.
		 * @type {boolean}
		 */
		this.hasProgressCanvas = params.waveColor != params.progressColor;
		/**
		 * @private
		 * @type {number}
		 */
		this.halfPixel = 0.5 / params.pixelRatio;
		/**
		 * @private
		 * @type {Array}
		 */
		this.canvases = [];
		/** @private */
		this.progressWave = null;
		this.tiledRendering = false;
	}

	/**
	 * Initialise the drawer
	 */
	init() {
		this.createWrapper();
		this.createElements();
	}

	/**
	 * Create the canvas elements and style them
	 *
	 * @private
	 */
	createElements() {
		this.progressWave = this.wrapper.appendChild(
			this.style(document.createElement('wave'), {
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
			})
		);

		this.addCanvas();
		this.updateCursor();
	}

	/**
	 * Update cursor style from params.
	 */
	updateCursor() {
		this.style(this.progressWave, {
			borderRightWidth: this.params.cursorWidth + 'px',
			borderRightColor: this.params.cursorColor
		});
	}

	/**
	 * Adjust to the updated size by adding or removing canvases
	 */
	updateSize() {
		const totalWidth = Math.round(this.width / this.params.pixelRatio);
		const requiredCanvases = Math.ceil(
			totalWidth / this.maxCanvasElementWidth
		);
		console.log("update size");
		let canvasCount = (this.tiledRendering && canvasLimit < requiredCanvases) ? canvasLimit : requiredCanvases;
		console.log(canvasCount);
		while (this.canvases.length < canvasCount) {
			this.addCanvas();
		}

		while (this.canvases.length > canvasCount) {
			this.removeCanvas();
		}

		this.canvases.forEach((entry, i) => {
			// 	reflow canvases in order
			let leftOffset = this.maxCanvasElementWidth * i;
			// Add some overlap to prevent vertical white stripes, keep the width even for simplicity.
			let canvasWidth =
				this.maxCanvasWidth + 2 * Math.ceil(this.params.pixelRatio / 2);

			if (!this.tiledRendering && i === this.canvases.length - 1) {
				if (i === this.canvases.length - 1) {
					canvasWidth =
						this.width -
						this.maxCanvasWidth * (this.canvases.length - 1);
				}
			}

			this.updateDimensions(entry, canvasWidth, this.height, leftOffset);
			this.clearWaveForEntry(entry);
		});
	}

	/**
	 * Add a canvas to the canvas list
	 *
	 * @private
	 */
	addCanvas() {
		const entry = {};
		const leftOffset = this.maxCanvasElementWidth * this.canvases.length;

		entry.wave = this.wrapper.appendChild(
			this.style(document.createElement('canvas'), {
				position: 'absolute',
				zIndex: 2,
				left: leftOffset + 'px',
				top: 0,
				bottom: 0,
				height: '100%',
				pointerEvents: 'none'
			})
		);
		entry.waveCtx = entry.wave.getContext('2d');

		if (this.hasProgressCanvas) {
			entry.progress = this.progressWave.appendChild(
				this.style(document.createElement('canvas'), {
					position: 'absolute',
					left: leftOffset + 'px',
					top: 0,
					bottom: 0,
					height: '100%'
				})
			);
			entry.progressCtx = entry.progress.getContext('2d');
		}

		this.canvases.push(entry);
	}

	/**
	 * Pop one canvas from the list
	 *
	 * @private
	 */
	removeCanvas() {
		const lastEntry = this.canvases.pop();
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
	 * @param {number} width The new width of the element
	 * @param {number} height The new height of the element
	 */
	updateDimensions(entry, width, height, offset) {
		const elementWidth = Math.round(width / this.params.pixelRatio);
		const totalWidth = Math.round(this.width / this.params.pixelRatio);

		// Where the canvas starts and ends in the waveform, represented as a decimal between 0 and 1.
		
		if (!entry) {
			console.log("Null entry!");
		}
		entry.start = offset / totalWidth || 0;
		// entry.start = entry.waveCtx.canvas.offsetLeft / totalWidth || 0;
		entry.end = entry.start + elementWidth / totalWidth;

		entry.waveCtx.canvas.width = width;
		entry.waveCtx.canvas.height = height;
		this.style(entry.waveCtx.canvas, { width: elementWidth + 'px',
			left: offset + 'px'
		});

		this.style(this.progressWave, { display: 'block' });

		if (this.hasProgressCanvas) {
			entry.progressCtx.canvas.width = width;
			entry.progressCtx.canvas.height = height;
			this.style(entry.progressCtx.canvas, {
				width: elementWidth + 'px',
				left:  offset + 'px',
			});
		}

// Create an empty <div> to hold open
	if (this.tiledRendering && !this.spacer) {
	 this.spacer = this.wrapper.appendChild(
	  this.style(document.createElement('div'), {
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
	  	this.style(this.spacer, {left: totalWidth + 'px'});
	  }
	}
	/**
	 * Clear the whole waveform
	 */
	clearWave() {
		this.canvases.forEach(entry => this.clearWaveForEntry(entry));
	}

	/**
	 * Clear one canvas
	 *
	 * @private
	 * @param {CanvasEntry} entry
	 */
	clearWaveForEntry(entry) {
		entry.waveCtx.clearRect(
			0,
			0,
			entry.waveCtx.canvas.width,
			entry.waveCtx.canvas.height
		);
		if (this.hasProgressCanvas) {
			entry.progressCtx.clearRect(
				0,
				0,
				entry.progressCtx.canvas.width,
				entry.progressCtx.canvas.height
			);
		}
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
	 */
	drawBars(peaks, channelIndex, start, end) {
		return this.prepareDraw(
			peaks,
			channelIndex,
			start,
			end,
			({ absmax, hasMinVals, height, offsetY, halfH, peaks }) => {
				// if drawBars was called within ws.empty we don't pass a start and
				// don't want anything to happen
				if (start === undefined) {
					return;
				}
				// Skip every other value if there are negatives.
				const peakIndexScale = hasMinVals ? 2 : 1;
				const length = peaks.length / peakIndexScale;
				const bar = this.params.barWidth * this.params.pixelRatio;
				const gap =
					this.params.barGap === null
						? Math.max(this.params.pixelRatio, ~~(bar / 2))
						: Math.max(
							  this.params.pixelRatio,
							  this.params.barGap * this.params.pixelRatio
						  );
				const step = bar + gap;

				const scale = length / this.width;
				const first = start;
				const last = end;
				let i;

				for (i = first; i < last; i += step) {
					const peak =
						peaks[Math.floor(i * scale * peakIndexScale)] || 0;
					const h = Math.round(peak / absmax * halfH);
					this.fillRect(
						i + this.halfPixel,
						halfH - h + offsetY,
						bar + this.halfPixel,
						h * 2
					);
				}
			}
		);
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
	 */
	drawWave(peaks, channelIndex, start, end) {
		return this.prepareDraw(
			peaks,
			channelIndex,
			start,
			end,
			({ absmax, hasMinVals, height, offsetY, halfH, peaks }) => {
				if (!hasMinVals) {
					const reflectedPeaks = [];
					const len = peaks.length;
					let i;
					for (i = 0; i < len; i++) {
						reflectedPeaks[2 * i] = peaks[i];
						reflectedPeaks[2 * i + 1] = -peaks[i];
					}
					peaks = reflectedPeaks;
				}

				// if drawWave was called within ws.empty we don't pass a start and
				// end and simply want a flat line
				if (start !== undefined) {
					this.drawLine(peaks, absmax, halfH, offsetY, start, end);
				}

				// Always draw a median line
				this.fillRect(
					0,
					halfH + offsetY - this.halfPixel,
					this.width,
					this.halfPixel
				);
			}
		);
	}

	/**
	 * Tell the canvas entries to render their portion of the waveform
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
	drawLine(peaks, absmax, halfH, offsetY, start, end) {
		this.canvases.forEach(entry => {
			// let t0 = performance.now();
			this.setFillStyles(entry);
			this.drawLineToContext(
				entry,
				entry.waveCtx,
				peaks,
				absmax,
				halfH,
				offsetY,
				start,
				end
			);
			this.drawLineToContext(
				entry,
				entry.progressCtx,
				peaks,
				absmax,
				halfH,
				offsetY,
				start,
				end
			);
			// let t1 = performance.now();
			// let dT = t1 - t0;
			// console.log(dT);
		});
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
	drawLineToContext(entry, ctx, peaks, absmax, halfH, offsetY, start, end) {
		if (!ctx) {
			return;
		}

		const length = peaks.length / 2;
		const scale =
			this.params.fillParent && this.width != length
				? this.width / length
				: 1;

		const first = Math.round(length * entry.start);
		// Use one more peak value to make sure we join peaks at ends -- unless,
		// of course, this is the last canvas.
		const last = Math.round(length * entry.end) + 1;
		if (first > end || last < start) {
			return;
		}
		const canvasStart = Math.min(first, start);
		const canvasEnd = Math.max(last, end);
		let i;
		let j;

		ctx.beginPath();
		ctx.moveTo(
			(canvasStart - first) * scale + this.halfPixel,
			halfH + offsetY
		);

		for (i = canvasStart; i < canvasEnd; i++) {
			const peak = peaks[2 * i] || 0;
			const h = Math.round(peak / absmax * halfH);
			ctx.lineTo(
				(i - first) * scale + this.halfPixel,
				halfH - h + offsetY
			);
		}

		// Draw the bottom edge going backwards, to make a single
		// closed hull to fill.
		for (j = canvasEnd - 1; j >= canvasStart; j--) {
			const peak = peaks[2 * j + 1] || 0;
			const h = Math.round(peak / absmax * halfH);
			ctx.lineTo(
				(j - first) * scale + this.halfPixel,
				halfH - h + offsetY
			);
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
	 */
	fillRect(x, y, width, height) {
		const startCanvas = Math.floor(x / this.maxCanvasWidth);
		const endCanvas = Math.min(
			Math.ceil((x + width) / this.maxCanvasWidth) + 1,
			this.canvases.length
		);
		let i;
		for (i = startCanvas; i < endCanvas; i++) {
			const entry = this.canvases[i];
			const leftOffset = i * this.maxCanvasWidth;

			const intersection = {
				x1: Math.max(x, i * this.maxCanvasWidth),
				y1: y,
				x2: Math.min(
					x + width,
					i * this.maxCanvasWidth + entry.waveCtx.canvas.width
				),
				y2: y + height
			};

			if (intersection.x1 < intersection.x2) {
				this.setFillStyles(entry);

				this.fillRectToContext(
					entry.waveCtx,
					intersection.x1 - leftOffset,
					intersection.y1,
					intersection.x2 - intersection.x1,
					intersection.y2 - intersection.y1
				);

				this.fillRectToContext(
					entry.progressCtx,
					intersection.x1 - leftOffset,
					intersection.y1,
					intersection.x2 - intersection.x1,
					intersection.y2 - intersection.y1
				);
			}
		}
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
	 */
	prepareDraw(peaks, channelIndex, start, end, fn) {
		return util.frame(() => {
			// Split channels and call this function with the channelIndex set
			if (peaks[0] instanceof Array) {
				const channels = peaks;
				if (this.params.splitChannels) {
					this.setHeight(
						channels.length *
							this.params.height *
							this.params.pixelRatio
					);
					return channels.forEach((channelPeaks, i) =>
						this.prepareDraw(channelPeaks, i, start, end, fn)
					);
				}
				peaks = channels[0];
			}
			// calculate maximum modulation value, either from the barHeight
			// parameter or if normalize=true from the largest value in the peak
			// set
			let absmax = 1 / this.params.barHeight;
			if (this.params.normalize) {
				const max = util.max(peaks);
				const min = util.min(peaks);
				absmax = -min > max ? -min : max;
			}

			// Bar wave draws the bottom only as a reflection of the top,
			// so we don't need negative values
			const hasMinVals = [].some.call(peaks, val => val < 0);
			const height = this.params.height * this.params.pixelRatio;
			const offsetY = height * channelIndex || 0;
			const halfH = height / 2;

			return fn({
				absmax: absmax,
				hasMinVals: hasMinVals,
				height: height,
				offsetY: offsetY,
				halfH: halfH,
				peaks: peaks
			});
		})();
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
	fillRectToContext(ctx, x, y, width, height) {
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
	setFillStyles(entry) {
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
	getImage(type, quality) {
		const images = this.canvases.map(entry =>
			entry.wave.toDataURL(type, quality)
		);
		return images.length > 1 ? images : images[0];
	}

	/**
	 * Render the new progress
	 *
	 * @param {number} position X-Offset of progress position in pixels
	 */
	updateProgress(position) {
		this.style(this.progressWave, { width: position + 'px' });
	}


	calcCanvasInfo(x) {
		let x1 = x / this.params.pixelRatio;
		let canN = Math.floor(x1 / this.maxCanvasElementWidth);
		let lhs = canN * this.maxCanvasElementWidth;
		let rhs = lhs + this.maxCanvasElementWidth;
		let canvasWidth = this.maxCanvasWidth + 2 * Math.ceil(this.params.pixelRatio / 2);

		const elementWidth = Math.round(canvasWidth / this.params.pixelRatio);
		const totalWidth = Math.round(this.width / this.params.pixelRatio);

		// Where the canvas starts and ends in the waveform, represented as a decimal between 0 and 1.
		let start = lhs / totalWidth || 0;
		// entry.start = entry.waveCtx.canvas.offsetLeft / totalWidth || 0;
		let end = start + elementWidth / totalWidth;

		return {
			number: canN,
			left:	lhs,
			right:	rhs,
			canvasWidth:  canvasWidth,
			start:	start,
			end:	end,
		}
	}

  imageSampleCanvas(surfer, entry) {
	let t0 = performance.now();
	let buffer = surfer.backend.buffer;
	let {numberOfChannels, sampleRate} = buffer;
	let spDx = sampleRate / this.params.minPxPerSec;
	const height = Math.round(this.params.height * this.params.pixelRatio); // ?
	const halfH = Math.round(height / 2);
	const pixH = 2;
	const pixW = Math.ceil(1/spDx) + 1;
	const ySc = -halfH;
	const duration = surfer.getDuration();
	const durScale = duration * this.params.minPxPerSec;

	for (var c = 0; c < numberOfChannels; ++c) {
		var chan = buffer.getChannelData(c);
		let yoff = halfH + c * height;		
		let {progressCtx, waveCtx}  = entry;
		let lhs = Math.round(entry.start * durScale);
		let rhs = Math.round(entry.end * durScale);

		console.log(lhs + ", " + rhs + " " + entry.start + " " + entry.end);

		this.setFillStyles(entry);
		let sx = entry.start * duration * sampleRate;
		let w = rhs - lhs;
		for (var x = 0; x < w; ++x) {
			let y = yoff + Math.round(chan[Math.round(sx)] * ySc);
			sx += spDx;
			waveCtx.fillRect(x, y, pixW, pixH);
			if(progressCtx) progressCtx.fillRect(x, y, pixW, pixH);		
		}
	}
	let t1 = performance.now();
	let dT = t1 - t0;
	//console.log(dT);
}

// periodic function called in order to maintain the tile strip
	scrollCheck(surfer) {
		let nowX = surfer.drawer.getScrollX(); // NowX should be in canvas coordinates.
		// Track derivative.
		if (this.lastScrollX === undefined) this.lastScrollX = 0;
		let lastX = this.lastScrollX;
		this.lastScrollX = nowX;

		let duration = surfer.getDuration();
		let playState = surfer.isPlaying();

		let durScale = duration * this.params.minPxPerSec;
		let normX = nowX / durScale;
		// console.log(normX);
		let foundCan;
		let canvToFill;
		let maxDist = 0;
		// Find the canvas which is visable.

		this.canvases.forEach(entry => {
			if (normX >= entry.start && normX < entry.end) {
				foundCan = entry;
			} else {
				let midPt = (entry.start + entry.end ) / 2;
				let dist = Math.abs(normX - midPt);
				if (dist >= maxDist) {
					maxDist = dist;
					canvToFill = entry;
				}
			}
		});

		let that = this;
		var whereX = -1;
		// If it isn't there, make that one.
		 // If it is already there, find the next one
		if (foundCan) {
			let ourWid = foundCan.end - foundCan.start;
			let ourMid = foundCan.start + ourWid / 2;
			let seekX = ourMid + ourWid;
			let nextCan = that.canvases.find(function(can) {
				return seekX >= can.start && seekX < can.end
			});
			if (!nextCan) {
				console.log("Filling forward.");
				whereX = seekX * durScale;
			} else {
				seekX = ourMid - ourWid;
				nextCan = that.canvases.find(function(can) {
					return seekX >= can.start && seekX < can.end
				});
				if(!nextCan) {
					whereX = seekX  * durScale;
					console.log("Filling backward.");
				}
			}
		} else {
			whereX = nowX;
			console.log("Filling missing.");
		}

		if (whereX >= 0 && canvToFill) {
			let can = wavesurfer.drawer.calcCanvasInfo(whereX);
			let {canvasWidth, left} = can;
			this.updateDimensions(canvToFill, canvasWidth, this.height, left);
			if (whereX < canvToFill.start || whereX > canvToFill.end) {
				console.log("whereX out of range: " + whereX);
			}
			console.log("imagining: " + Math.round(whereX) + " " + can.number + " " + can.left + " " + can.right + " " + can.canvasWidth + " " + can.start + " " + can.end);
			this.clearWaveForEntry(canvToFill);
			this.imageSampleCanvas(surfer, canvToFill);
		}

		// Strategy:

		// If it is there and we are playing, walk forward in time, making sure future
		// canvases are there.
		// If it is there and we are not playing, walk backward and forward, filling the first gap you find.
		// If we have a first derivative of the scroll position we can give priority to the scroll derivative 
		// direction. On heuristic would be to favor the derivative direction x 2.
	}

 	drawSamples(surfer, width)
  	{
		console.log("drawSampes " + this.maxCanvasElementWidth + " " + this.maxCanvasWidth);
		this.setWidth(width);
		this.clearWave();
		this.canvases.forEach(entry => {this.imageSampleCanvas(surfer, entry)});
		let that = this;
		if (!this.scrollingSetUp) {
			this.scrollingSetUp = true;
			surfer.on('scroll', function (screvt) {
				if (that.tiledRendering) {
					that.scrollCheck(surfer);
				}
			});
		}
	}

} // End of class.

// A hacked-up version of the drawBuffer routine defined in	wavesurfer.js
// The idea	is that	at a suitably high level of	magnification, say 11025
// we should plot samples directly rather than deal	with peak data.
var	overDrawBuffer = function () {
	var	nominalWidth = Math.round(this.getDuration() * this.params.minPxPerSec);
	var	parentWidth	= this.drawer.getWidth();
	var	width =	nominalWidth;

	// If we need more than a certain number of canvases, then we will render them dynamically
	// using a coroutine
	const requiredCanvases = Math.ceil( width / this.params.maxCanvasWidth * this.params.pixelRatio);

	this.drawer.tiledRendering = this.params.minPxPerSec >= 5512 && requiredCanvases > canvasLimit; // only for tile check

	var	start =	0; // this.drawer.getScrollX();
	var	end	= Math.max(start + parentWidth,	width);

	// Fill	container
	if (this.params.fillParent && (!this.params.scrollParent ||	nominalWidth < parentWidth)) {
		width =	parentWidth;
		start =	0;
		end	= width;
	}
	var	peaks =	void 0;
	if (this.params.minPxPerSec	>= 2560) {
		this.drawer.drawSamples(this, width);
	} else {
	  if (this.params.partialRender) {
		var	newRanges =	this.peakCache.addRangeToPeakCache(width, start, end);
		var	i =	void 0;
		for	(i = 0;	i <	newRanges.length; i++) {
			peaks =	this.backend.getPeaks(width, newRanges[i][0], newRanges[i][1]);
			this.drawer.drawPeaks(peaks, width,	newRanges[i][0], newRanges[i][1]);
		 }
	   } else {
		peaks =	this.backend.getPeaks(width, start,	end);
		this.drawer.drawPeaks(peaks, width,	start, end);
	 }
}
	this.fireEvent('redraw', peaks,	width);

 }
 
