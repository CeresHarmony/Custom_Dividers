/*
	CDivs.js 2.0.4 by @ilvimafr - https://ilvimafr.github.io/cdivs/
	-----------------
	Table of contents

	1. Helpers
	1.1. Prefixes
	1.2. Refresh screen information
	1.3. Parsing options
	1.4. Parsing value
	1.5. Split abbreviation keys
	1.6. Strings
	1.7. Arrays
	1.8. Rects
	1.9. Canvas Math
	1.10. Caches
	1.11. Helpers Initialization

	2. DOM Manipulation
	2.1. Basic control functions
	2.2. Query selector
	2.3. User properties
	2.4. Parent, childs & siblings
	2.5. Management
	2.6. Positions & sizes
	2.7. Classes
	2.8. Attributes
	2.9. Events
	2.10. Style sheets
	2.11. Variable initialization
	2.12. Additive classes
	2.13. Pseudo query selector

	3. CSS
	3.1. Value
	3.1.1. Calculation
	3.1.2. Converting
	3.1.3. Parsing
	3.2. Color
	3.2.1. To opaque
	3.2.2. Blend
	3.2.3. Opaque Blend
	3.2.4. Has gradient colors difference
	3.2.5. To string
	3.2.6. Parsing
	3.3. Background
	3.3.1. Size calculation
	3.3.2. Position calculation
	3.3.3. Create pattern
	3.3.4. Parsing
	3.4. Gradient
	3.4.1. Draw Linear
	3.4.2. Draw Radial
	3.4.3. Parsing
	3.5. Gradient Stops
	3.5.1. Calculation
	3.5.2. Normalize
	3.5.3. Fill Middle Points
	3.5.4. Prepare for Repeating
	3.5.5. Blink transparent difference
	3.5.6. Fix Range
	3.5.7. Scale segment
	3.5.8. Parsing
	3.6. Repeat parsing
	3.7. Element transparency
	3.8. Background Clip

	4. CSS Observer
	4.1. Events
	4.2. Start
	4.3. End

	5. Easing

	6. Animation
	6.1. Iterate
	6.2. Segment
	6.3. Process

	7. Animation Manager
	7.1. Intersection Observer
	7.2. Observe
	7.3. Unobserve
	7.4. Process

	8. Canvas
	8.1. Resize
	8.2. Basic operations
	8.3. Gradients
	8.4. Patterns
	8.5. Quality
	8.6. Static canvas

	9. Canvas Background
	9.1. Resize
	9.2. Refresh
	9.3. Calculation
	9.4. Draw

	10. Path
	10.1. Parsing
	10.1.1. Sizes
	10.1.2. Commands
	10.1.3. Coordinates
	10.2. Process
	10.2.1. Commands
	10.2.2. Coordinates
	10.2.3. Shape size
	10.3. Path
	10.3.1. Prepare
	10.3.2. Style prepare
	10.3.3. Iterate
	10.3.4. Draw
	10.3.5. Draw Commands
	10.4. Cache
	10.5. Types

	11. Divider
	11.1. Resize
	11.2. Options
	11.3. Canvas
	11.4. Paths
	11.5. Canvas backgrounds
	11.6. Background clipping
	11.7. Scroll
	11.8. Destroy
	11.9. Default options

	12. Shared List
	13. Resize Observer
	14. Set Default Options
	15. Refresh
	16. Initialization & Events
*/
'use strict';

var CDivs = (function() {

	// 1. Helpers
	let ua = navigator.userAgent.toLowerCase();
	let tmp;

	let _ = {
		// 1.1. Prefixes
		prefix:    'cdivs',
		max:       Number.MAX_VALUE,
		min:       Number.MIN_VALUE,
		raf:       window.requestAnimationFrame.bind(window),
		cancelRaf: window.cancelAnimationFrame.bind(window),
		viewport:  window.visualViewport,

		isGecko:   ua.indexOf('gecko\/') > 0,
		isBlink:   ua.indexOf('chrome') > 0,
		isWebkit:  ua.indexOf('webkit') > 0 && !(ua.indexOf('chrome') > 0),

		addPrefix(value) {
			return `${this.prefix}${value}`;
		},

		// 1.2. Refresh screen information
		screenRefresh() {
			_.width = q.html.i().clientWidth || 1;
			_.height = q.html.i().clientHeight || 1;
			_.dpr = (window.devicePixelRatio || 1) * (_.viewport ? _.viewport.scale : 1);
		},
		scrollRefresh() {
			_.scroll = [window.scrollX, window.scrollY];
		},

		// 1.3. Parsing options
		parseOptions(str, defaultOptions = {}) {
			let result = Object.assign({}, defaultOptions);
			let abbrs  = defaultOptions.abbrs || {};

			Str.split(str, ',').forEach((option) => {
				if (!option) {
					return;
				}
				let [prop, val] = option.split(/:(.+)/).map(v => v.trim());

				prop    = abbrs[prop] || prop;
				let def = result[prop];

				val = _.parseVal(val);

				if (def && def.a) {
					if (Array.isArray(val)) {
						val = val.map((v, i) => v === '$' ? def.a[i] : v);
					} else {
						val = [val, val, val];
					}
				}

				result[prop] = val;
			});

			return result;
		},

		// 1.4. Parsing value
		parseVal(val) {
			// Boolean
			if (val === undefined) {
				return;
			}
			else if (val === 'true' || val === 'false') {
				val = val === 'true';
			}
			// Symbol boolean
			else if (val === '!' || val === '!!') {
				val = val === '!';
			}
			// Number
			else if (val.search(/[^0-9.]/g) === -1) {
				val = parseFloat(val);
			}
			// Array
			else if (val[0] === '[') {
				val = val.substring(1, val.length-1).split(',').map(v => this.parseVal(v.trim()));
			}
			// String
			else {
				val = Str.content(val);
			}

			return val;
		},

		// 1.5. Split abbreviation keys
		splitAbbrKeys(obj) {
			let result = {};
			Object.defineProperty(result, 'abbrs', { enumerable: false, value: {} });

			for (let key in obj) {
				let subKeys = key.split('|');
				let value = obj[key];

				if (value && value.a) {
					value = value.a;
					value.dynamic = true;
				}

				result[subKeys[0]] = value;
				result.abbrs[subKeys[1]] = subKeys[0];
			}

			return result;
		}
	};

	// 1.6. Strings
	let Str = {
		// Split with considering brackets & nesting
		split(str, div) {
			if (!str) {
				return [];
			}

			let list = [];

			// Cut off strings
			str = str.replace(/(["']).+?\1/g, (v) => (list.push(v), `~@_ilv${list.length-1}`));

			// Cut off brackets content with nesting
			str = str.replace(/(\(.+?(\(.*?\).+)*\))|(\[.+?(\[.*?\].+)*\])/g, (v) => {
				list.push(v.replace(/~@_ilv(\d)/g, (v, g) => list[+g]));
				return `~@_ilv${list.length-1}`;
			});

			return str.split(div).map(part => {
				return part.replace(/~@_ilv(\d)/g, (v, g) => list[+g]).trim();
			});
		},

		// Get brackets content considering nesting
		content(str) {
			let result = /[("']+(.+?)'?"?\)?$/g.exec(str);
			return result ? result[1] : str;
		},

		search(str, arr) {
			return arr.find(v => str.indexOf(v) > -1);
		}
	};

	// 1.7. Arrays
	let Arr = {
		fill(arr, f) {
			for (let i = 0; i < arr.length; i++) {
				arr[i] = f(i);
			}
			return arr;
		},

		remove(arr, el) {
			let pos = arr.indexOf(el);
			if (pos > -1) {
				arr.splice(pos, 1);
			}
		},

		// Fill the array with the last value
		continue(arr, length) {
			length -= arr.length;
			arr.push(...(new Array(length < 0 ? 0 : length).fill(arr[arr.length-1])));
			return arr;
		},

		fixed(arr, length) {
			arr = this.continue(arr, length);
			return arr.slice(0, length);
		}
	};

	// 1.8. Rects
	class Rect {
		constructor(x, y, w, h) {
			this.x = x;
			this.y = y;
			this.w = w;
			this.h = h;
		}

		move(x2, y2, invert) {
			let {x, y, w, h} = this;
			let v = invert ? -1 : 1;

			return new Rect(
				x + x2 * v,
				y + y2 * v,
				w, h
			);
		}

		snap(isTransformed) {
			let {x, y, w, h} = this;
			!isTransformed && (w += x, h += y);

			[x, y, w, h] = [x, y, w, h].map(v => CMath.snap(v));

			!isTransformed && (w -= x, h -= y);
			return new Rect(x, y, w, h);
		}
	};

	// 1.9. Canvas Math
	let CMath = {
		// round(.493px) === 1px
		// Gecko:        1px / 60
		// Webkit/Blink: 1px / 64
		mid: _.isGecko ? (.5 - (1/60/2)) : (.5 - (1/64/2)),

		val(v, s) {
			return Math.round(v * (v > 1 ? _.dpr : s));
		},

		rel(val, v, v2, is) {
			return is ? Math.round(v * v2) : val;
		},

		fit(v, s, is) {
			return is ? Math.ceil(s / (Math.round(s / v) || 1)) : v;
		},

		snap(value, dpr = _.dpr) {
			value *= dpr;
			return Math.floor(value) + (value % 1 >= this.mid ? 1 : 0);
		}
	};

	// 1.10. Caches
	class Cache {
		constructor() {
			this.clear();
		}

		get(key, callback) {
			return this.list[key] || (this.list[key] = callback());
		}

		clear() {
			this.list = {};
		}
	}

	class CachedVar {
		set(value, callback) {
			if ((this.changed = (this.value !== value))) {
				this.value = value;
				callback && callback(value, this.changed);
			}
			return this.value;
		}

		valueOf() {
			return this.value;
		}
	}

	// 1.11. Helpers Initialization
	_.scroll     = [0, 0];
	Rect.empty   = () => new Rect(_.max, _.min, _.max, _.min);
	Rect.fromDOM = r => new Rect(r.left, r.top, r.width, r.height);


	// 2. DOM Manipulation
	class Dom {
		constructor(list = [], hasPseudo = false) {
			if (!q.pseudoSelector) {
				hasPseudo = false;
			}
			if (!list.forEach) {
				if (list.substr) {
					list = hasPseudo ? q.pseudoSelector(list) : Array.from(document.querySelectorAll(list));
				}
				else {
					list = (list.length >= 0 && list !== window) ? Array.from(list) : [list];
				}
			}
			if (!list.pseudo) {
				list.pseudo = hasPseudo.length ? hasPseudo : new Array(list.length);
			}

			this.list = list;
		}

		// 2.1. Basic control functions
		index(el) {
			return this.list.indexOf(el.i());
		}

		isEmpty() {
			return this.list.length === 0;
		}

		copy() {
			let result    = [...this.list];
			result.pseudo = [...this.list.pseudo];
			return new Dom(result);
		}

		each(callback) {
			let i = this.list.length;
			while (i--) {
				callback(this.list[i], i);
			}
			return this;
		}

		map(callback) {
			return this.list.map(callback);
		}

		reduce(callback, start) {
			return this.list.reduce(callback, start);
		}

		i(i = 0) {
			i < 0 && (i += this.list.length);
			return this.list[i];
		}

		add(el) {
			this.list.push(...el.list);
			this.list.pseudo.push(...el.list.pseudo);
			return this;
		}

		// 2.2. Query selector
		q(s = '', hasPseudo) {
			let result    = [];
			result.pseudo = [];

			if (!q.pseudoSelector) {
				hasPseudo = false;
			}

			this.each((el, i) => {
				let arr;

				if (hasPseudo) {
					arr = q.pseudoSelector(s, el);
				} else {
					arr = Array.from(el.querySelectorAll(s));
					arr.pseudo = new Array(arr.length);
				}

				result.push(...arr);
				result.pseudo.push(...arr.pseudo);
			});

			return new Dom(result);
		}

		// 2.3. User properties
		get(v, callback) {
			if (this.list.length) {
				let value = this.list[0][_.prefix + v + (this.list.pseudo[0] || '')];
				callback && callback(value);
				return value;
			}
		}

		set(value, callback) {
			let id = _.prefix + value + (this.list.pseudo[0] || '');
			return (this.list[0][id] = callback(this.list[0][id]));
		}

		// 2.4. Parent, childs & siblings
		parent() {
			return new Dom(this.i().parentNode);
		}

		childNodes() {
			return new Dom(this.reduce((result, el) => {
				el.childNodes.forEach(node => result.push(node));
				return result;
			}, []));
		}

		prev() {
			let arr = [];
			this.each(el => {
				let prev = el.previousElementSibling;
				if (prev) {
					arr.push(prev);
				}
			});
			return new Dom(arr);
		}

		next() {
			let arr = [];
			this.each(el => {
				let prev = el.nextElementSibling;
				if (prev) {
					arr.push(prev);
				}
			});
			return new Dom(arr);
		}

		// 2.5. Management
		clone(deep) {
			return new Dom(this.map(el => el.cloneNode(deep)));
		}

		remove() {
			this.each(el => el.parentNode.removeChild(el));
			return this;
		}

		append(childs, prepend) {
			if (this.list.length) {
				childs.each(child => {
					this.i()[prepend ? 'prepend' : 'append'](child);
				});
			}
			return this;
		}

		prepend(childs) {
			this.append(childs, true);
		}

		wrap(el) {
			this.i().parentNode.insertBefore(el.i(), this.i());
			el.append(this);
			return this;
		}

		unwrap() {
			this.each(el => {
				let parent = el.parentNode;
				while (el.firstChild) {
					parent.insertBefore(el.firstChild, el);
				}
				parent.removeChild(el);
			});
		}

		// 2.6. Positions & sizes
		rect() {
			return Rect.fromDOM(this.i().getBoundingClientRect()).move(_.scroll[0], _.scroll[1]);
		}

		styleRect() {
			let s = this.styles();
			let x, y;
			let w = parseFloat(s.width) || 1;
			let h = parseFloat(s.height) || 1;
			let o = this.rect();

			if (this.list.pseudo[0]) {
				[x, y] = [o.x + parseFloat(s.left), o.y + parseFloat(s.top)];
			} else {
				[x, y] = [o.x, o.y];
			}

			return new Rect(x, y, w, h);
		}

		// 2.7. Classes
		addCl(cl) {
			cl && cl.split(' ').forEach(cl => {
				this.each(el => el.classList.add(cl));
			});
			return this;
		}

		removeCl(cl = '') {
			cl.split(' ').forEach(cl => {
				this.each(el => el.classList.remove(cl));
			});
			return this;
		}

		// 2.8. Attributes
		attr(name, val) {
			if (val === undefined) {
				return this.i().getAttribute(name);
			}

			this.each(el => el.setAttribute(name, val));
			return this;
		}

		removeAttr(name) {
			this.each(el => el.removeAttribute(name));
			return this;
		}

		html(html) {
			if (html) {
				this.each(el => el.innerHTML = html);
			} else {
				return this.i().innerHTML;
			}
		}

		// 2.9. Events
		on(type, f, o) {
			this.each((el, i) => {
				let callback = e => f(e, el, i);
				let list     = q(el).set('Events', v => v || []);

				type.split(' ').forEach(type => {
					list.push([callback, type, f, o]);
					el.addEventListener(type, callback, o);
				});
			});

			return this;
		}

		off(type, f, o) {
			this.each(el => {
				let list     = q(el).get('Events') || [];
				let callback = list.find(e => e[1] === type && e[2] === f && e[3] === o)[0];
				el.removeEventListener(type, callback, o);
			});
			return this;
		}

		// 2.10. Style Sheets
		styles(pseudo, i) {
			let p = pseudo || this.list.pseudo[i || 0];
			let value = window.getComputedStyle(this.i(i), p ? `::${p}` : undefined);
			return value;
		}

		css(props, vals) {
			let args = arguments;

			this.each(el => {
				if (vals !== undefined) {
					for (let i = 0; i < args.length; i += 2) {
						el.style.setProperty(args[i], args[i+1], 'important');
					}
				} else {
					for (let prop in props) {
						el.style.setProperty(prop, props[prop], 'important');
					}
				}
			});

			return this;
		}

		cssVar(props, vals) {
			let args = arguments;

			this.each(el => {
				if (vals !== undefined) {
					for (let i = 0; i < args.length; i += 2) {
						el.style.setProperty('--' + args[i], args[i+1]);
					}
				} else {
					for (let prop in props) {
						el.style.setProperty('--' + prop, props[prop]);
					}
				}
			});

			return this;
		}
	}

	// 2.11. Variable initialization
	let q = (s, hasPseudo) => {
		return new Dom(s, hasPseudo);
	};

	q.wnd  = new Dom(window);
	q.doc  = new Dom(document);
	q.html = new Dom(document.documentElement);
	q.head = new Dom(document.head);
	q.create = type => new Dom(document.createElement(type));

	// 2.12. Additive classes
	q.init = () => {
		q.body = new Dom(document.body);

		let style = q.create('style');
		style.html(`.${_.prefix}-reset::after,.${_.prefix}-reset::before{display:none;}.${_.prefix}-reset{background:none !important}`);
		q.head.append(style);
	};

	// 2.13. Pseudo query selector
	q.pseudoSelector = (s = '', parent = document) => {
		let result = [];
		result.pseudo = [];

		Str.split(s, ',').forEach((selector, i) => {
			let el, pseudo;

			if (selector.indexOf(':after') >= 0 || selector.indexOf(':before') >= 0) {
				selector = selector.replace(/:?:(after|before)/g, (a, p) => (pseudo = p, ''));
			}
			if (selector === '' || selector === ' ') {
				el = [parent];
			} else {
				el = parent.querySelectorAll(selector);
			}
			result.pseudo.push(...new Array(el.length).fill(pseudo));
			result.push(...el);
		});

		return result;
	};

	// 3. CSS
	// 3.1. Value
	class CSSValue {
		constructor(value, unit) {
			this.value = value;
			this.unit  = unit;

			if (this.unit === 'calc') {
				this.isInvert = this.value.some(val => val.unit === 'px' && val.operation === '-');
			}
		}

		// 3.1.1. Calculation
		calc(toPx, size, pxScale = 1) {
			if (this.unit === 'calc') {
				return this.value.reduce((result, value) => {
					let pxValue = value.calc(toPx, size, pxScale);
					// Computed calc value only has + or -
					return result + (value.operation === '-' ? -pxValue : pxValue);
				}, 0);
			}
			else if (this.unit === '%') {
				return this.value / 100 * (toPx ? size : 1);
			}

			return (this.value * (toPx ? pxScale : 1) * _.dpr) / (toPx ? 1 : size);
		}

		// 3.1.2. Converting
		toPx(size, pxScale) {
			return this.calc(true, size, pxScale);
		}

		valueOf() {
			return this.value;
		}
	}

	CSSValue.is = str => !isNaN(parseFloat(str));
	CSSValue.positionList = {
		'left':   0,
		'top':    0,
		'center': 50,
		'right':  100,
		'bottom': 100
	};

	// 3.1.3. Parsing
	CSSValue.parse = function(str) {
		let value, unit;

		if (str.indexOf('calc') === 0) {
			let values = Str.content(str).split(' ');
			[value, unit] = [[], 'calc'];

			values.forEach((calcVal, i) => {
				if (!(i % 2)) {
					let calcValue = CSSValue.parse(calcVal);
					calcValue.operation = values[i-1];
					value.push(calcValue);
				}
			});

			return new CSSValue(value, unit);
		}

		str = str.replace(/left|right|top|bottom|center/, type => {
			[value, unit] = [CSSValue.positionList[type], '%'];
			return '';
		});

		if (str) {
			if (!CSSValue.is(str)) {
				return str;
			}

			[value, unit] = [parseFloat(str), Str.search(str, ['px', '%'])];
		}

		return new CSSValue(value, unit);
	};

	CSSValue.parseValues = function(values, isPosition) {
		// if background-position has 4 uncalculated values
		if (isPosition && /left|right|top|bottom/.test(values)) {
			// Turn to calc function
			values = values.replace(/(left|right|top|bottom)(\s\d\S+)?/g, (match, type, value = '0px') => {
				let operation = (/bottom|right/.test(type)) ? '-' : '+';
				return `calc(${CSSValue.positionList[type]}% ${operation}${value})`;
			});
		}

		return Str.split(values, ' ').map(v => CSSValue.parse(v));
	};


	// 3.2. Color
	class Color {
		constructor(val) {
			this.val = val;
		}

		// 3.2.1. To opaque
		toOpaque() {
			let alpha = this.val[3];
			return new Color([
				this.val[0] * alpha,
				this.val[1] * alpha,
				this.val[2] * alpha,
				1
			]);
		}

		// 3.2.2. Blend
		blend(color, weight) {
			if (this.hasDiff(color)) {
				return this.opaqueBlend(color, weight);
			}
			return new Color(this.val.map((v, i) => {
				return v + (color.val[i] - v) * weight;
			}));
		}

		// 3.2.3. Opaque Blend
		opaqueBlend(color, weight) {
			let {val} = this;
			let alpha = val[3] + (color.val[3] - val[3]) * weight;
			alpha = Math.max(alpha, 0.001);

			let mixedColor = this.toOpaque().blend(color.toOpaque(), weight).val.map(v => {
				return alpha === 0 ? 255 : v / alpha;
			});

			return new Color([mixedColor[0], mixedColor[1], mixedColor[2], alpha]);
		}

		// 3.2.4. Has gradient colors difference
		// Canvas gradient in Blink & Gecko different from CSS
		hasDiff(color) {
			let {val} = this;
			let sval = color.val;

			// If two colors has differnt opacity and has differnt rgb colors
			return (_.isBlink || _.isGecko) && (val[3] !== sval[3] && (val[0] !== sval[0] || val[1] !== sval[1] || val[2] !== sval[2]));
		}

		// 3.2.5. To string
		toString() {
			let {val} = this;
			let v = [~~val[0], ~~val[1], ~~val[2], val[3]];
			return `rgba(${v.join(',')})`;
		}
	}

	// 3.2.6. Parsing
	Color.parse = function(str) {
		let color;

		if (str.indexOf('rgb') === 0) {
			let rgb = Str.content(str).split(',');
			color = rgb.map(color => parseFloat(color));

			if (rgb.length > 3 && rgb[3].indexOf('%') > 0) {
				color[3] /= 100;
			}
		}
		else if (str[0] === '#') {
			let hex = str.split('');
			hex.shift();

			if (str.length < 6) {
				color = hex.map(num => parseInt(num + num, 16));
			} else {
				color = [];
				for (let i = 0; i < hex.length; i += 2) {
					 color.push(parseInt(hex[i] + hex[i+1], 16));
				}
			}
			if (color[3]) {
				color[3] /= 255;
			}
		} else {
			Canvas.tmp.g.fillStyle = str;
			return Color.parse(Canvas.tmp.g.fillStyle);
		}

		if (color.length === 3) {
			color.push(1);
		}

		return new Color(color);
	};


	// 3.3. Background
	class Bg {
		constructor(type, image) {
			this.type  = type;
			this.image = image;
			this.isURL = type === 'url';
		}

		// 3.3.1. Size calculation
		// Calculate background-size for current element size
		calcSize(size, repeat, elWidth, elHeight) {
			this.repeat = repeat;
			let [repeatX, repeatY] = repeat;

			let width   = size[0] || 'auto';
			let height  = size[1] || 'auto';

			let isFixed     = width.unit && height.unit;
			let imgWidth    = elWidth;
			let imgHeight   = elHeight;
			this.widthAuto  = width === 'auto';
			this.heightAuto = height === 'auto';

			// Size values to px
			if (this.isURL) {
				imgWidth = this.image.width * _.dpr;
				imgHeight = this.image.height * _.dpr;
			}

			// Percents to pixels
			width.unit  && (width  = width.toPx(elWidth));
			height.unit && (height = height.toPx(elHeight));

			// Cover, contain, auto. String values to pixels.
			if (!isFixed) {
				if (width === 'auto' && height === 'auto') {
					width  = imgWidth;
					height = imgHeight;
				}
				else {
					if (width === 'cover' || width === 'contain') {
						let wFactor = imgWidth / elWidth;
						let hFactor = imgHeight / elHeight;
						let factor;

						if (width === 'cover') {
							factor = (wFactor > hFactor) ? hFactor : wFactor;
						}
						else {
							factor = (wFactor < hFactor) ? hFactor : wFactor;
						}

						height = imgHeight / factor;
						width = imgWidth / factor;
					}
					else {
						if (width === 'auto') {
							width = this.isURL ? (imgWidth * (height / imgHeight)) : elWidth;
						} else {
							height = this.isURL ? (imgHeight * (width / imgWidth)) : elHeight;
						}
					}
				}
			}

			this.width    = this.rawWidth = width;
			this.height   = this.rawHeight = height;
			this.elWidth  = elWidth;
			this.elHeight = elHeight;
		}

		// Resize background size by repeat
		repeatResize(size, repeat, blockSize) {
			let factor      = 0;
			let patternSize = size;

			if (repeat === 'space') {
				let count = Math.floor(blockSize / size);
				if (count > 1) {
					let spaceSize = (blockSize  - size*count) / (count-1);
					if (_.isWebkit) {
						spaceSize = Math.round(spaceSize);
					}
					patternSize += spaceSize;
				}
			}
			else if (repeat === 'round') {
				let count   = Math.round(blockSize / size);
				patternSize = blockSize / count;
				factor      = size / patternSize;
				size        = patternSize;
			}

			return [size, patternSize, factor];
		}

		// Resize auto sized background with opposite repeat 'round'
		repeatResizeF(isAuto, repeat, oppositeRepeat, size, patternSize, oppFactor) {
			if (isAuto && repeat !== 'round' && oppositeRepeat === 'round') {
				// Resize current size by opposite resize factor
				patternSize *= oppFactor;
				if (oppositeRepeat !== 'space') {
					size *= oppFactor;
				}
			}
			return [size, patternSize];
		}


		// 3.3.2. Position calculation
		calcPosition(pos, elX, elY) {
			this.elX = elX;
			this.elY = elY;

			let [x, y] = pos;
			let [repeatX, repeatY] = this.repeat;

			// Remove background size from element size for percent values
			let posWidth  = this.elWidth  - this.width;
			let posHeight = Math.round(this.elHeight) - Math.round(this.height);

			// Percent or calc to pixels
			x = x.toPx(posWidth);
			y = y.toPx(posHeight);

			(repeatX !== 'round') && pos.right  && (x = posWidth - x);
			(repeatY !== 'round') && pos.bottom && (y = posHeight - y);

			(repeatX === 'space') && (x = 0);
			(repeatY === 'space') && (y = 0);

			this.x = x;
			this.y = y;

			// Blink repeated background can be non-integer
			if (_.isBlink) {
				(repeatX !== true) && (this.x = Math.round(x));
				(repeatY !== true) && (this.y = Math.round(y));
				return;
			}

			// Gecko background-position depend on background-size
			// position 0.4px + 0.1px size = 1px position
			// position 0.5px + 0.9px size = 0px position
			// 0px values ignore background-size fraction
			if (_.isGecko) {
				if (x !== 0) {
					let fractionX = this.width - Math.round(this.width);
					this.x = CMath.snap(x - fractionX, 1);
				}
				if (y !== 0) {
					let fractionY = this.height - Math.round(this.height);
					this.y = CMath.snap(y - fractionY, 1);
				}
				return;
			}

			// Webkit background-position depend on element position & background size
			if (_.isWebkit) {
				let offsetX = elX + this.width;
				let offsetY = elY + this.height;
				let fractionX = (offsetX - Math.round(offsetX));
				let fractionY = (offsetY - Math.round(offsetY));

				this.x = Math.round(x - fractionX);
				this.y = Math.round(y - fractionY);
				return;
			}

			this.x = Math.round(x);
			this.y = Math.round(y);
		}

		// 3.3.3. Create pattern
		createPattern() {
			let {width, height, elWidth, elHeight} = this;
			let [repeatX, repeatY] = this.repeat;

			let hasSpace = (repeatX === 'space' || repeatY === 'space');

			// Webkit background-size depend on element position
			if (_.isWebkit) {
				let fractionX = this.elX - Math.round(this.elX);
				let fractionY = this.elY - Math.round(this.elY);
				width  = Math.round(width + fractionX);
				height = Math.round(height + fractionY);
			}

			// Pattern sizes
			let patternWidth, patternHeight, widthFactor, heightFactor;

			[width, patternWidth, widthFactor]    = this.repeatResize(width, repeatX, elWidth);
			[height, patternHeight, heightFactor] = this.repeatResize(height, repeatY, elHeight);

			// Resize auto sized background with opposite repeat 'round'
			[width, patternWidth] = this.repeatResizeF(
				this.widthAuto, repeatX, repeatY, width, patternWidth, heightFactor
			);
			[height, patternHeight] = this.repeatResizeF(
				this.heightAuto, repeatY, repeatX, height, patternHeight, widthFactor
			);

			// Canvas pattern has fixed sizes
			// So scale canvas before draw for size with float pixels
			let scaleWidth  = patternWidth / Math.round(patternWidth);
			let scaleHeight = patternHeight / Math.round(patternHeight);

			// If background is image and spaces not used
			// Then calculate scale special for image size
			if (this.isURL && !hasSpace) {
				scaleWidth  = patternWidth / this.image.width;
				scaleHeight = patternHeight / this.image.height;
			}

			// Disable floating sizes
			patternWidth  = Math.round(patternWidth);
			patternHeight = Math.round(patternHeight);

			// Generate Pattern
			let pattern;

			if (this.type === 'grad') {
				pattern = this.image.toCanvas(Math.round(width), Math.round(height), patternWidth, patternHeight);
			}

			if (this.isURL) {
				// Create pattern only for repeat 'spaces'
				// Else return already created pattern
				if (hasSpace) {
					pattern = Canvas.pattern(patternWidth, patternHeight, (c, g) => {
						c.quality('high');
						g.drawImage(this.image, 0, 0, width, height);
						c.quality();
					});
				} else {
					pattern = this.image.pattern;
				}
			}

			this.patternWidth  = patternWidth;
			this.patternHeight = patternHeight;
			this.scaleWidth    = scaleWidth;
			this.scaleHeight   = scaleHeight;
			this.pattern       = pattern;
		}
	}

	Bg.imgCache = new Cache();

	// 3.3.4. Parsing
	Bg.parse = (str, callback) => {
		let type, val;

		if (str.indexOf('url') === 0) {
			let src = Str.content(str);
			type = 'url';
			val  = Bg.imgCache.get(src, () => {
				let img = document.createElement('img');

				img.onload = () => {
					img.loaded  = true;

					if (src.search(/\.svg(\?.+?)?$/g) > 0) {
						img.isSvg = true;
					}
					else {
						img.pattern = Canvas.pattern(img.width, img.height, (c, g) => {
							c.quality('high');
							g.drawImage(img, 0, 0);
							c.quality();
						});
					}

					img.callbacks.forEach(v => v());
				};

				img.callbacks = [];
				img.src = src;
				return img;
			});

			if (!val.pattern) {
				val.callbacks.push(callback);
			}
		}
		else if (str.indexOf('gradient') >= 0) {
			type = 'grad';
			val  = Grad.parse(str);
		}

		return new Bg(type, val);
	};

	// 3.4. Gradient
	class Grad {
		constructor(type, stops, angle, circle, pos, side, closest, isRepeating) {
			this.type        = type;
			this.stops       = stops;
			this.angle       = angle;
			this.circle      = circle;
			this.pos         = pos;
			this.side        = side;
			this.closest     = closest;
			this.isRepeating = isRepeating;
		}

		// 3.4.1. Draw Linear
		drawLinear(bgW, bgH, bgPW, bgPH) {
			let {angle, stops, pos, isRepeating} = this;
			let length, x1 = 0, y1 = 0, x2 = 0, y2 = 0;

			// Find start & end points from angle
			if (angle.x) {
				angle = Math.atan2(angle.x*bgH, angle.y*bgW) / Math.PI*180;
				if (angle < 0) {
					angle = 360 + angle;
				}
			}

			switch (angle) {
			case 0:
			case 360:
				y1 = bgH;
				break;
			case 90:
				x2 = bgW;
				break;
			case 180:
				y2 = bgH;
				break;
			case 270:
				x1 = bgW;
				break;
			default:
				let hH = bgH / 2;
				let hW = bgW / 2;

				let slope  = Math.tan((90 - angle) * (Math.PI/180));
				let pSlope = -1 / slope;

				let corX = angle < 180 ? hW : -hW;
				let corY = (angle < 90 || angle >= 270) ? hH : -hH;

				let c    = corY - pSlope * corX;
				let endX = c / (slope - pSlope);
				let endY = pSlope * endX + c;

				x1 = hW - endX;
				y1 = hH + endY;
				x2 = hW + endX;
				y2 = hH - endY;
			}

			length = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
			let [gradStops, gradRepeat] = stops.calc(length, isRepeating);

			// Calculate longest repeat segment
			if (isRepeating) {
				let [length, shift, count] = gradRepeat;

				let xLen    = x2 - x1 + (_.isWebkit ? 1 : 0);
				let xCenter = x1 + xLen/2;
				let xOffset = (xLen * length / 2);

				let yLen    = y2 - y1 + (_.isWebkit ? 1 : 0);
				let yCenter = y1 + yLen/2;
				let yOffset = (yLen * length / 2);

				let xShift = xLen / 2 - xOffset;
				let yShift = yLen / 2 - yOffset;

				x1 = xCenter - xOffset;
				x2 = xCenter + xOffset;
				y1 = yCenter - yOffset;
				y2 = yCenter + yOffset;

				xLen = x2 - x1;
				yLen = y2 - y1;
				xShift -= xLen * shift - xLen;
				yShift -= yLen * shift - yLen;

				gradRepeat = [
					length, shift, count,
					xShift, yShift, xLen, yLen
				];
			}

			if (!isRepeating && bgPW >= bgW && bgPH >= bgH) {
				return Canvas.tmp.lGrad(x1, y1, x2, y2, gradStops);
			}

			return Canvas.pattern(bgPW, bgPH, (c, g) => {
				g.fillStyle = c.lGrad(x1, y1, x2, y2, gradStops);

				if (isRepeating) {
					let [,,count, xShift, yShift, xLen, yLen] = gradRepeat;
					let x = -xShift;
					let y = -yShift;

					g.translate(x, y);

					for (let i = 0; i < count+1; i++) {
						g.fillRect(-x, -y, bgW*2, bgH*2);
						g.translate(xLen, yLen);

						x += xLen;
						y += yLen;
					}
					c.resetTransform();
					// If background-repeat has 'spaces', then cut off extra
					if (bgW !== bgPW) {
						g.clearRect(bgW, 0, (bgPW - bgW), bgPH);
					}
					if (bgH !== bgPH) {
						g.clearRect(0, bgH, bgPW, (bgPH - bgH));
					}
				}
				else {
					g.fillRect(0, 0, bgW, bgH);
				}

				c.resetTransform();
			});
		}

		// 3.4.2. Draw Radial
		drawRadial(bgW, bgH, bgPW, bgPH) {
			let {angle, stops, closest, side, circle, pos, isRepeating} = this;
			let scale = [1, 1];

			let posX = pos[0].toPx(bgW);
			let posY = pos[1].toPx(bgH);

			let sideX = (posX / bgW) > .5;
			let sideY = (posY / bgH) > .5;

			let cornerX = (sideX ^ closest) ? 0 : bgW;
			let cornerY = (sideY ^ closest) ? 0 : bgH;

			let shapeW = Math.abs(cornerX - posX);
			let shapeH = Math.abs(cornerY - posY);

			let inscribedLength, circubscribedLength;
			let pxScale = 1;

			if (circle) {
				if (side) {
					inscribedLength = ((bgW > bgH) ^ closest) ? shapeW : shapeH;
				}
				else {
					inscribedLength = Math.sqrt(shapeW ** 2 + shapeH ** 2);
				}
			}
			// If ellipse then make big circle then scale
			else {
				let ellipseWidth  = side ? shapeW : Math.sqrt(shapeW ** 2 * 2);
				let ellipseHeight = side ? shapeH : Math.sqrt(shapeH ** 2 * 2);
				let widthLonger   = ellipseWidth > ellipseHeight;

				inscribedLength = widthLonger ? ellipseWidth : ellipseHeight;
				scale[+widthLonger] = (widthLonger
					? ellipseHeight / ellipseWidth
					: ellipseWidth / ellipseHeight) || 0.001;

				if (ellipseHeight > ellipseWidth) {
					pxScale = ellipseHeight / ellipseWidth;
				}

				posX /= scale[0];
				posY /= scale[1];
			}

			circubscribedLength = Math.sqrt(
				Math.abs(posX - (sideX ? 0 : bgW)) ** 2 +
				Math.abs(posY - (sideY ? 0 : bgH)) ** 2
			);
			circubscribedLength = Math.sqrt(circubscribedLength ** 2 * 2);

			// Calculate stops offsets and colors
			let [gradStops, gradRepeat] = stops.calc(inscribedLength, isRepeating, circubscribedLength, pxScale);

			// Calculate repeating count
			if (isRepeating) {
				gradRepeat[2] = Math.ceil(circubscribedLength / (inscribedLength * gradRepeat[0]));
			}

			// If it doesn't require scale then return simple radial gradient
			if (!isRepeating && circle) {
				return Canvas.tmp.rGrad(posX, posY, 0, circubscribedLength, gradStops);
			}

			// Create canvas pattern
			return Canvas.pattern(bgPW, bgPH, (c, g) => {
				g.scale(scale[0], scale[1]);

				if (isRepeating) {
					let [sLength, shift, count] = gradRepeat;
					// One segment radius
					let radius  = sLength * circubscribedLength;
					// Start radius which increases in steps
					let rLength = shift * radius;

					// Scale first gradient if there are shifts
					if (rLength > 0.01) {
						let stops = Stops.scaleSegment(gradStops, 1-shift, 1);
						g.fillStyle = c.rGrad(posX, posY, 0, rLength, stops);
						g.fillRect(0, 0, bgW / scale[0], bgH / scale[1]);
					}

					for (let i = count-1; i >= 0; i--) {
						rLength += radius;
						g.fillStyle = c.rGrad(posX, posY, rLength - radius, rLength, gradStops);
						g.fillRect(0, 0, bgW / scale[0], bgH / scale[1]);
					}
				}
				else {
					g.fillStyle = c.rGrad(posX, posY, 0, circubscribedLength, gradStops);
					g.fillRect(0, 0, bgW / scale[0], bgH / scale[1]);
				}

				c.resetTransform();
			});
		}

		toCanvas(bgW, bgH, bgPW, bgPH) {
			if (this.type === 'linear') {
				return this.drawLinear(bgW, bgH, bgPW, bgPH);
			}
			if (this.type === 'radial') {
				return this.drawRadial(bgW, bgH, bgPW, bgPH);
			}
		}
	}

	// 3.4.3. Parsing
	Grad.parse = function(str) {
		let type  = Str.search(str, ['linear', 'radial']);
		let parts = Str.split(Str.content(str), ',');
		let isRepeating = str.indexOf('repeating') >= 0;

		let angle, isTurn, pos, circle, closest, side;

		let info = parts[0];

		// Angle
		if (type === 'linear') {
			angle = 180;

			if (info.indexOf('deg') > 0 || (isTurn = info.indexOf('turn') > 0)) {
				angle = parseFloat(info) * (isTurn ? 360 : 1);
				angle = angle % 360;
				angle < 0 && (angle += 360);
				parts.shift();
			}
			else if (info.indexOf('to ') === 0) {
				angle = {
					'to left':         270,
					'to right':        90,
					'to bottom':       180,
					'to top':          0,
					'to left top':     { x: -1, y:  1 },
					'to left bottom':  { x: -1, y: -1 },
					'to right top':    { x:  1, y:  1 },
					'to right bottom': { x:  1, y: -1 },
				}[info];
				parts.shift();
			}
		}
		else if (type === 'radial') {
			let radType = Str.search(info, ['circle', 'ellipse']);
			let hasPos  = info.indexOf('at ') >= 0;
			let corner  = Str.search(info, [
				'closest-side',
				'closest-corner',
				'farthest-side',
			]);

			if (radType || corner || hasPos) {
				parts.shift();
			}

			let strPos = hasPos ? info.split('at ')[1] : 'center center';

			pos     = Arr.continue(CSSValue.parseValues(strPos), 2);
			circle  = radType === 'circle';
			corner  = corner || 'farthest-corner';
			side    = corner.indexOf('side') >= 0;
			closest = corner.indexOf('closest') >= 0;
		}

		let stops = Stops.parse(parts);
		return new Grad(type, stops, angle, circle, pos, side, closest, isRepeating);
	};


	// 3.5. Gradient Stops
	class Stops {
		constructor(rawArr) {
			this.rawArr = rawArr;
			this.arr = [];
			this.hasMidpoints = rawArr.some(v => !v[1]);
			this.hasOpacityDiff = rawArr.some(v => v[1] && rawArr[0][1].val[3] !== v[1].val[3]);
		}

		// 3.5.1. Calculation
		calc(length, isRepeating, relativeLength, pxScale) {
			this.normalize(length, relativeLength || length, pxScale);

			if (this.hasMidpoints) {
				this.fillMidpoints();
			}
			if (this.hasOpacityDiff && (_.isBlink || _.isGecko)) {
				this.blinkTransDiff(length);
			}

			let repeat;
			if (isRepeating) {
				repeat = this.prepareForRepeating(length);
			}
			else {
				this.arr = Stops.fixRange(this.arr);
			}

			return [this.arr, repeat];
		}

		// 3.5.2. Normalize
		normalize(length, relativeLength, pxScale) {
			let emptyStops = [];
			let prevOffset = this.rawArr[0][0].toPx(length, pxScale) / relativeLength;

			this.arr = this.rawArr.map(rawStop => {
				let stop = rawStop.map(v => v);
				let [offset] = stop;

				if (offset) {
					 stop[0] = Math.max(prevOffset, offset.toPx(length, pxScale) / relativeLength);

					 if (emptyStops.length) {
						  emptyStops.forEach((emptyStop, i) => {
							  emptyStop[0] = prevOffset
								  + (1 / (emptyStops.length+1) * (i + 1)) * (stop[0] - prevOffset);
						  });
						  emptyStops = [];
					 }

					 prevOffset = stop[0];
				}
				else {
					 emptyStops.push(stop);
				}

				return stop;
			});
		}

		// 3.5.3. Fill Middle Points
		fillMidpoints() {
			let result = [];

			this.arr.forEach((stop, i) => {
				if (!stop[1]) {
					 let prev   = this.arr[i-1];
					 let next   = this.arr[i+1];
					 let pOff   = prev[0];
					 let nOff   = next[0];
					 let offset = stop[0];
					 let left   = offset - pOff;
					 let right  = nOff - offset;
					 let total  = nOff - pOff;

					 if (left === right) {
						  return;
					 }
					 if (left === 0) {
						  result.push([offset, next[1]]);
						  return;
					 }
					 if (right === 0) {
						  result.push([offset, prev[1]]);
						  return;
					 }

					 let offsets = [];
					 if (left > right) {
						  for (let j = 0; j < 7; ++j) {
							  offsets.push(pOff + left * (7 + j) / 13);
						  }
						  offsets.push(offset + right / 3, offset + right * 2 / 3);
					 } else {
						  offsets.push(pOff + left / 3, pOff + left * 2 / 3);
						  for (let j = 0; j < 7; ++j) {
							  offsets.push(offset + right * j / 13);
						  }
					 }

					 let hintRelOff = Math.log(.5) / Math.log(left / total);

					 for (let j = 0; j < 9; ++j) {
						  let relOff = (offsets[j] - pOff) / total;
						  let color = prev[1].blend(next[1], Math.pow(relOff, hintRelOff));
						  result.push([offsets[j], color]);
					 }
				} else {
					 result.push(stop);
				}
			});

			this.arr = result;
		}

		// 3.5.4. Prepare for Repeating
		prepareForRepeating(length) {
			let start  = this.arr[0][0];
			let end    = this.arr[this.arr.length-1][0];
			let offsetLength = end - start;

			this.arr = Stops.scaleSegment(this.arr, start, end);
			// ??? old fix
			// this.arr[0][0] += 0.00001;
			// this.arr[arr.length-1][0] -= 0.00001;
			this.arr.unshift([0, new Color([0, 0, 0, 0])]);
			this.arr.push([1, new Color([0, 0, 0, 0])]);

			return [
				offsetLength,
				(start % offsetLength) / offsetLength,
				Math.ceil(1 / offsetLength)
			];
		}

		// 3.5.5. Blink transparent difference
		// Fill Blink & Gecko stops between the various transparent stops
		blinkTransDiff(length) {
			let skip = false;

			this.arr = this.arr.reduce((result, stop, i) => {
				let [fOffset, fColor] = stop;
				let [sOffset, sColor] = this.arr[i+1] || [];

				if (i !== this.arr.length-1 && fColor.hasDiff(sColor)) {
					 for (let j = 0; j <= 10; j++) {
						  let percent = j / 10;
						  let offset  = fOffset + (sOffset - fOffset) * percent;
						  let color   = fColor.opaqueBlend(sColor, percent);
						  result.push([offset, color]);
					 }
					 skip = true;
				} else {
					 !skip && result.push([fOffset, fColor]);
					 skip = false;
				}

				return result;
			}, []);
		}
	}

	// 3.5.6. Fix Range
	// Make range from 0 to 1
	Stops.fixRange = function(arr) {
		return arr.map((stop, i) => {
			let [offset, color] = stop;

			if (offset < 0) {
				let [nOffset, nColor] = arr[i+1];
				if (nOffset > 0) {
					 color = color.blend(nColor, Math.abs(offset / (nOffset - offset)));
				}
				offset = 0;
			}
			if (offset > 1)  {
				let [pOffset, pColor] = arr[i-1];
				if (pOffset < 1) {
					 color = color.blend(pColor, Math.abs((offset - 1) / (offset - pOffset)));
				}
				offset = 1;
			}

			return [offset, color];
		});
	};

	// 3.5.7. Scale segment
	Stops.scaleSegment = function(arr, start, end) {
		return Stops.fixRange(arr.map(v => {
			return [(v[0] - start) / (end - start), v[1]];
		}));
	};

	// 3.5.8. Parsing
	Stops.parse = function(parts) {
		let stops = [];

		parts.forEach((stop, i) => {
			let color, offset;
			let arr = Str.split(stop, ' ');

			if (!CSSValue.is(arr[0])) {
				color = Color.parse(arr[0]);
				arr.shift();
			}

			// Fill offsets without color
			arr.forEach(v => stops.push([CSSValue.parse(v), color]));

			// Only color without offset
			if (arr.length === 0) {
				if (i === 0 || i === parts.length-1) {
					 offset = CSSValue.parse(!i ? '0%' : '100%');
				}
				stops.push([offset, color]);
			}
		});

		return new Stops(stops);
	};

	let CSS = {

		Value: CSSValue,
		Color: Color,
		Bg:    Bg,
		Grad:  Grad,
		Stops: Stops,

		// 3.6. Repeat parsing
		parseRepeat(str = '') {
			if (str === 'repeat-y') {
				return [false, true];
			}
			if (str === 'repeat-x') {
				return [true, false];
			}

			let values = str.split(' ').map(value => {
				if (value === 'no-repeat') {
					return false;
				}
				if (value.indexOf('repeat') >= 0) {
					return true;
				}
				return value;
			});

			return Arr.continue(values, 2);
		},

		// 3.7. Element transparency
		isElementTransparent(el) {
			let styles = el.styles();
			return styles.backgroundImage === 'none' && Color.parse(styles.backgroundColor).val[3] === 0;
		},

		isElementSemiTransparent(el) {
			let styles = el.styles();
			let color  = Color.parse(styles.backgroundColor);
			return (color.val[3] > 0 && color.val[3] < 1) || styles.opacity < 1;
		},

		// 3.8. Background Clip
		// Wrap the element with itself and add the clip-path property using css variables
		clipBackground(el) {
			return el.set('ClipBg', prevWrap => {
				// Return a previously created wrapper
				if (prevWrap) {
					return prevWrap;
				}

				let isImg = el.i().nodeName === 'IMG';
				let wrap = isImg ? q.create('div') : el.clone(false);

				wrap.i().id        = '';
				wrap.i().className = el.i().className;
				wrap.i().style     = el.attr('style');

				let styles     = el.styles();

				let wrapCSS = {
					'background': 'none',
					'overflow':   'visible',
					'padding':    '0',
					'display':    'block',
					'will-change': 'transform'
				};

				if (styles.position === 'static') {
					wrapCSS['position'] = 'relative';
				}

				let clip = `inset(var(--${_.prefix}-top) -1px var(--${_.prefix}-bottom) -1px)`;
				let elCSS = {
					'width':              '100%',
					'height':             '100%',
					'margin':             '0',
					'position':           'relative',
					'top':                '0',
					'left':               '0',
					'right':              'auto',
					'bottom':             'auto',
					'transform':          'none',
					'z-index':            '1',
					'opacity':            '1',
					'clip-path':          clip,
					'-webkit-clip-path':  clip,
					'-moz-clip-path':     clip,
				};

				isImg && (elCSS.display = 'block');

				el.wrap(wrap.css(wrapCSS).addCl(_.addPrefix('-reset')))
					.css(elCSS)
					.cssVar(
						_.addPrefix('-top'),    '0px',
						_.addPrefix('-bottom'), '0px',
					);

				return wrap;
			});
		}
	};


	// 4. CSS Observer
	let onlyEnd = !('ontransitionstart' in q.html.i());
	class CSSObserver {
		constructor(o) {
			let {el, type} = o;

			// Append inner empty element with transition property
			// This will help to find out if the CSS property change has occurred
			let inner = this.inner = q.create('div').css({
				position:           'absolute',
				visibility:         'hidden',
				transition:         `0.01s step-end`,
				transitionProperty: type,
				[type]:             'inherit'
			});
			el.append(inner);

			this.o    = o;
			this.el   = el;
			this.type = type;
			this.animStarted = false;
			this.elStarted   = false;

			// 4.1. Events
			if (el.styles().transitionDuration === '0s' && el.styles().transitionDelay === '0s') {
				el.css('transition', `${type} 0.01s step-end 0s`);
			}

			if (type !== 'color') {
				el.on('animationstart', e => {
					if (e.target === e.currentTarget) {
						this.animStarted = true;
						this.start();
					}
				});
				el.on('animationcancel animationend', e => {
					if (e.target === e.currentTarget) {
						this.animStarted = false;
						this.end();
					}
				});
			}

			el.on('transitionrun', e => {
				if (this.transTest(e)) {
					this.elStarted = true;
					this.start();
				}
			});

			el.on('transitionend', e => {
				if (this.transTest(e)) {
					this.elStarted = false;
					this.end();
				}
			});

			inner.on('transitionend', () => this.end(true));
		}

		// 4.2. Start
		start() {
			if (!this.started && (this.animStarted || this.elStarted)) {
				this.started = true;
				this.o.start();
			}
		}

		// 4.3. End
		end(force) {
			if (this.started) {
				if (!this.animStarted && !this.elStarted) {
					this.started = false;
					this.o.end();
				}
			}
			else if (onlyEnd || force) {
				this.o.end(true);
			}
		}

		transTest(e) {
			return e.target === e.currentTarget && e.propertyName.indexOf(this.type) >= 0;
		}

		destroy() {
			this.el.css('transition', '');
			this.inner.remove();
		}
	}

	// 5. Easing
	let Easing = {
		'linear': t => t,
		'in': t => t * t,
		'out': t => -(t * (t - 2)),
		'inOut': t => t < .5 ? 2 * t * t : (-2 * t * t) + (4 * t) - 1,
		'cubicIn': t => t * t * t,
		'cubicOut': t => (tmp = t - 1, tmp * tmp * tmp + 1),
		'cubicInOut': t => t < .5 ? 4 * t * t * t : (tmp = (2 * t) - 2, .5 * tmp * tmp * tmp + 1)
	};


	// 6. Animation
	class Anim {
		constructor() {
			this.dur       = 1000;
			this.delay     = 0;
			this.reverse   = true;
			this.repeat    = true;
			this.easing    = Easing.inOut;
			this.totalTime = 0;
		}

		// 6.1. Iterate
		iterate(t) {
			this.totalTime += t;
		}

		// 6.2. Segment
		segment(dur, segAddTime) {
			let segTotalTime = this.totalTime + segAddTime;
			let segCurTime   = segTotalTime % dur;
			let isEnded      = segTotalTime >= (dur * (this.reverse + 1));

			// Reverse invert
			if (this.reverse && ((segTotalTime / dur) % 2) >= 1) {
				segCurTime = dur - segCurTime;
			}

			return this.easing(segCurTime / dur);
		}

		// 6.3. Process
		processKeys(vals, durs, curTime) {
			// Return first value if time has not passed first value time
			if (durs[0] > curTime) {
				return vals[0];
			}

			// Find a time span, then calc value
			for (let i = 1; i < durs.length; i++) {
				if (durs[i] >= curTime) {
					let prev        = i - 1;
					let timePercent = (curTime - durs[prev]) / (durs[i] - durs[prev]);

					return vals[prev] + (timePercent * (vals[i] - vals[prev]));
				}
			}

			return vals[vals.length - 1];
		}
	}

	// 7. Animation manager
	let AM = {
		time: 0,
		list: [[], [], []],

		// 7.1. Intersection Observer
		IO: window.IntersectionObserver && new IntersectionObserver(entries => entries.forEach(entry => {
			let am = q(entry.target).get('AM');
			am.bcr       = Rect.fromDOM(entry.boundingClientRect).move(_.scroll[0], _.scroll[1]);
			am.isVisible = entry.isIntersecting;
			[am.style, am.iterate, am.draw].forEach(fnc => fnc.rebuild());
		})),

		// 7.2. Observe
		observe(am) {
			[am.style, am.iterate, am.draw].forEach((fnc, i) => {
				fnc.reqCount = 0;

				// draw.req() - request draw call every frame when element is visible
				// draw.req(true) - request one draw call even if element not visible
				fnc.req = (oneRun) => {
					oneRun ? (fnc.oneRun = true) : (fnc.reqCount++);
					fnc.rebuild();
				};

				fnc.unreq = (stop) => {
					fnc.reqCount = Math.max(--fnc.reqCount, 0);
					if (stop) {
						fnc.reqCount = 0;
						fnc.oneRun = false;
					}
					fnc.rebuild();
				};

				fnc.rebuild = () => {
					if ((am.isVisible && fnc.reqCount > 0) || fnc.oneRun) {
						if (!fnc.added) {
							fnc.added = true;
							this.list[i].push(fnc);

							if (!this.isRunning) {
								this.isRunning = true;
								_.raf(this._process);
							}
						}
					}
					else if ((!am.isVisible || fnc.reqCount === 0) && !fnc.oneRun) {
						fnc.added = false;
						Arr.remove(this.list[i], fnc);
					}
				};
			});

			if (this.IO) {
				this.IO.observe(am.el.i());
			} else {
				am.isVisible = true;
				[am.style, am.iterate, am.draw].forEach(fnc => fnc.rebuild());
			}

			return am.el.set('AM', () => am);
		},

		// 7.3. Unobserve
		unobserve(o) {
			this.IO && this.IO.unobserve(o.el.i());
			o.el.set('AM', () => undefined);
			[o.style, o.iterate, o.draw].forEach((fnc, i) => {
				fnc.reqCount = 0;
				fnc.oneRun   = false;
				Arr.remove(this.list[i], fnc);
			});
		},

		// 7.4 Process
		processArr(arr, elapsedTime) {
			let v, i = arr.length;
			while (i--) {
				v = arr[i];
				v(elapsedTime);

				if (v.oneRun) {
					v.oneRun = false;
					v.rebuild();
				}
			}
		},

		process(time) {
			let elapsedTime = Math.min(time - this.time, 50);

			if (this.list[0].length) {
				this.processArr(this.list[0], elapsedTime);
				CanvasBg.list = [];
			}
			this.processArr(this.list[1], elapsedTime);
			this.processArr(this.list[2], elapsedTime);

			this.isRunning = this.list[0].length || this.list[1].length || this.list[2].length;
			if (this.isRunning) {
				this.time = time;
				_.raf(this._process);
			}
		}
	};

	AM._process = AM.process.bind(AM);


	// 8. Canvas
	class Canvas {
		constructor(o = {}) {
			this.el = q.create('canvas');
			this.g  = this.el.i().getContext('2d');

			this.isResize = false;
			this.changes  = [];

			if (o.draw) {
				this.am = AM.observe({
					el: this.el,

					style:  t => {
						if (this.isResize) {
							 this._resize();
							 o.resize(this, this.g, this.changes);
						}

						o.style(this, this.g, this.isResize, this.changes);

						this.isResize = false;
						this.changes  = this.changes.map(v => false);
					},
					iterate: t => o.iterate(this, this.g, t),
					draw:    t => o.draw(this, this.g, t),
				});
			}
		}

		// 8.1. Resize
		_resize() {
			this.el.i().width  = this.w;
			this.el.i().height = this.h;
		}

		resize(width, height, _changes) {
			this.w = width || 1;
			this.h = height || 1;

			if (_changes) {
				this.changes = _changes.map((v, i) => this.changes[i] || v);
			}

			if (this.am) {
				this.isResize = true;
				this.am.style.req(true);
				this.am.draw.req(true);
			} else {
				this._resize();
			}
		}

		// 8.2. Basic operations
		clear() {
			this.g.clearRect(0, 0, this.w, this.h);
		}

		fill(style, gco) {
			style && (this.g.fillStyle = style);
			gco && this.gco(gco);
			this.g.fillRect(0, 0, this.w, this.h);
			gco && this.gco();
		}

		resetTransform() {
			this.g.setTransform(1, 0, 0, 1, 0, 0);
		}

		gco(o) {
			this.g.globalCompositeOperation = o || 'source-over';
		}

		// 8.3. Gradients
		lGrad(x1, y1, x2, y2, colors) {
			let grad = this.g.createLinearGradient(x1, y1, x2, y2);
			colors.forEach(color => grad.addColorStop(color[0], color[1]));
			return grad;
		}

		rGrad(x, y, startRad, rad, colors) {
			let grad = this.g.createRadialGradient(x, y, startRad, x, y, rad);
			colors.forEach(color => grad.addColorStop(color[0], color[1]));
			return grad;
		}

		vGrad(colors) {
			return this.lGrad(0, 0, 0, this.h, colors);
		}

		// 8.4. Patterns
		pattern(repeat) {
			return this.g.createPattern(this.el.i(), repeat || "repeat");
		}

		// 8.5. Quality
		quality(q = 'low') {
			this.g.imageSmoothingEnabled = true;
			this.g.imageSmoothingQuality = q;
		}

		destroy() {
			this.am && AM.unobserve(this.am);
			this.el.remove();
		}
	}

	// 8.6. Static canvas
	Canvas.tmp = new Canvas();
	Canvas.pattern = (width, height, callback) => {
		Canvas.tmp.resize(width, height);
		callback(Canvas.tmp, Canvas.tmp.g);
		return Canvas.tmp.pattern();
	}


	// 9. Canvas Background
	class CanvasBg {

		constructor(o) {
			let {el, am, type} = o;

			// Check if element already used
			let canvasBg = el.get('CanvasBg');
			if (canvasBg) {
				canvasBg.amList.push(am);
				return canvasBg;
			} else {
				el.set('CanvasBg', () => this);
			}

			this.el      = el;
			this.type    = type;
			this.amList  = [am];
			this.styles  = el.styles();
			this.list    = [];

			this.hasFixed = this.styles.backgroundAttachment.indexOf('fixed') >= 0;
			this.isImage  = el.i().nodeName === 'IMG';

			// Block coordinates
			this.width  = new CachedVar();
			this.height = new CachedVar();
			this.x      = new CachedVar();
			this.y      = new CachedVar();

			// Position relative to the main background
			this.bgX = 0;
			this.bgY = 0;

			this.list  = [];
			this.cache = {
				bgImage:  new CachedVar(),
				bgSize:   new CachedVar(),
				bgPos:    new CachedVar(),
				bgRepeat: new CachedVar(),
			};

			// <img> load callback
			el.i().onload = () => {
				this.amList.forEach(am => {
					am.style.req(true);
					am.draw.req(true);
				});
			};

			this.cssObserver = new CSSObserver({
				el:   el,
				type: type,

				start: () => {
					this.amList.forEach(am => {
						am.style.req();
						am.draw.req();
					});
				},
				end: (notStarted) => {
					this.amList.forEach(am => {
						if (!notStarted) {
							am.style.unreq();
							am.draw.unreq();
						}
						am.style.req(true);
						am.draw.req(true);
					});
				}
			});
		}

		// 9.1. Resize
		resize(bgX, bgY, bgW, bgH, x, y, width, height, screenChanged) {
			this.bgX = bgX;
			this.bgY = bgY;
			this.bgW = bgW;
			this.bgH = bgH;

			this.x.set(x);
			this.y.set(y);
			this.width.set(width);
			this.height.set(height);

			if (!this.isMoved) {
				this.isMoved = this.x.changed || this.y.changed;
			}
			if (!this.isResized) {
				this.isResized =
					this.width.changed ||
					this.height.changed ||
					(this.hasFixed && screenChanged) ||
					(_.isWebkit && (this.x.changed || this.y.changed));
			}
		}

		// 9.2. Refresh
		// Refresh CSS data
		refresh() {
			let {styles, cache} = this;

			// Background already calculated.
			if (CanvasBg.list.find(v => v === this)) {
				return;
			} else {
				CanvasBg.list.push(this);
			}

			// <img> element
			if (this.isImage) {
				this.isMoved = false;
				this.isResized = false;
				return;
			}

			// Color only
			if (this.type === 'color') {
				this.textColor = styles.color;
				return;
			}

			this.color = styles.backgroundColor;

			if (this.isResized) {
				cache.bgImage.set(styles.backgroundImage, v => {
					this.list = (v === 'none' ? [] : Str.split(v, ',')).map(rawImage => {
						// Find exist element
						let item = this.list.find(v => v.raw.image.value === rawImage);
						// Create new if not found
						!item && this.list.push(item = {
							raw: {
								image:    new CachedVar(),
								size:     new CachedVar(),
								position: new CachedVar(),
								repeat:   new CachedVar()
							},
							parsed: {}
						});

						item.raw.image.set(rawImage);
						return item;
					}) || [];

					// Reset cache
					cache.bgSize.value = 0;
					cache.bgPos.value = 0;
					cache.bgRepeat.value = 0;
				});

				// If has image then parse rest properties
				if (this.list.length) {
					// background-size
					cache.bgSize.set(styles.backgroundSize, v => {
						Arr.fixed(Str.split(v, ','), this.list.length).forEach((value, i) => {
							this.list[i].raw.size.set(value, value => {
								this.list[i].parsed.size = CSS.Value.parseValues(value);
							});
						});
					});

					// background-repeat
					cache.bgRepeat.set(styles.backgroundRepeat, v => {
						Arr.fixed(v.split(', '), this.list.length).forEach((value, i) => {
							this.list[i].raw.repeat.set(value, value => {
								this.list[i].parsed.repeat = CSS.parseRepeat(value);
							});
						});
					});

					// background-attachment
					let attachment  = styles.backgroundAttachment;
					this.hasFixed   = attachment.indexOf('fixed') >= 0;

					Arr.fixed(attachment.split(', '), this.list.length).forEach((value, i) => {
						this.list[i].raw.attachment = value;
						this.list[i].isFixed = value === 'fixed';
					});
				}
			}

			if (this.list.length) {
				// background-position
				cache.bgPos.set(styles.backgroundPosition, v => {
					Arr.fixed(Str.split(v, ','), this.list.length).forEach((value, i) => {
						this.list[i].raw.position.set(value, value => {
							this.list[i].parsed.position = CSS.Value.parseValues(value, true);
						});
					});
				});
			}

			this.list.forEach((item, i) => {
				// Only for new background-image item or changed item
				if (item.raw.image.changed) {
					item.background = CSS.Bg.parse(item.raw.image.value, () => {
						// Recalculate when image loaded & run redraw
						this.calcItem(item, true);
						this.amList.forEach(am => {
							am.style.req(true);
							am.draw.req(true);
						});
					});

					// If background ready now then recalculate
					if (item.background.type !== 'url' || item.background.image.loaded) {
						this.calcItem(item);
					}
				}
			});

			this.isResized = false;
			this.isMoved   = false;
		}

		// 9.3. Calculation
		// Prepare background item for rendering
		calcItem(item, imageLoadEvent) {
			let {raw, parsed} = item;

			// Element sizes
			let [width, height] = item.isFixed
				? [_.width * _.dpr, _.height * _.dpr]
				: [this.width, this.height];

			let isChanged       = this.isResized || raw.image.changed || imageLoadEvent;
			let positionChanged = isChanged || raw.position.changed;
			let sizeChanged     = positionChanged || raw.size.changed;

			if (sizeChanged) {
				item.background.calcSize(parsed.size, parsed.repeat, Math.ceil(width), height);
			}
			if (positionChanged || (sizeChanged && !_.isBlink)) {
				item.background.calcPosition(parsed.position, +this.x, +this.y);
			}
			if (positionChanged || sizeChanged) {
				item.background.createPattern(+this.x, +this.y);
			}
		}

		// 9.4. Draw
		draw(c, addY) {
			let {type, bgX, bgY, bgW, bgH, width, height, list} = this;

			let g = c.g;

			if (type === 'color') {
				g.fillStyle   = this.textColor;
				g.strokeStyle = this.textColor;
				return;
			}

			// Draw <img> element
			if (this.isImage) {
				if (this.el.i().complete) {
					c.quality('high');
					g.drawImage(this.el.i(), bgX, bgY - addY, bgW, bgH);
					c.quality();
				}
				return;
			}

			// Fill background color
			g.fillStyle = this.color;
			g.fillRect(bgX, bgY - addY, bgW, bgH);

			// Draw background images
			let i = list.length;
			while (i--) {
				let item = list[i];

				// Image still loading
				if (!item.background.pattern) {
					continue;
				}

				let {x, y, width, height, scaleWidth, scaleHeight, pattern} = item.background;
				let [repeatX, repeatY] = item.parsed.repeat;

				// Calculate fixed offset
				let [fixedX, fixedY] = [0, 0];
				if (item.isFixed) {
					fixedY -= ((_.scroll[1] - c.am.bcr.y) * _.dpr) - bgY;
					fixedX -= ((_.scroll[0] - c.am.bcr.x) * _.dpr) - bgX;
					addY = 0;
				}

				// Translate for pattern
				g.translate(
					x + bgX - fixedX,
					y + bgY - addY - fixedY
				);
				g.scale(scaleWidth, scaleHeight);

				let dx = repeatX ? (-(x - fixedX) / scaleWidth)  : 0;
				let dy = repeatY ? (-(y - fixedY) / scaleHeight) : 0;
				let dw = (repeatX ? this.bgW : width) / scaleWidth;
				let dh = (repeatY ? this.bgH : height) / scaleHeight;

				g.fillStyle = pattern;
				g.fillRect(dx, dy, dw, dh);

				c.resetTransform();
			}
		}

		destroy(am) {
			Arr.remove(this.amList, am);
			if (this.amList.length === 0) {
				this.cssObserver.destroy();
				this.cssObserver = this.styles = this.amList = null;
				this.el.set('CanvasBg', () => null);
			}
		}
	}

	// List of already calculated backgrounds
	// To recalculate once per two dividers
	CanvasBg.list = [];


	// 10. Path
	// 10.1. Parsing
	let Parse = {
		flags: {
			'S': 'shift',
			's': 'static',
			'r': 'relative',
			'f': 'fit',
		},

		// 10.1.1. Sizes
		size(str) {
			let list = str.split(' ').map(val => {
				let [num, flags] = val.match(/[\d\.]+|(\w+)?/g);
				let result       = new Number(parseFloat(num));

				flags && flags.split('').forEach(v => result[this.flags[v]] = true);

				return result;
			});

			return {
				type:            list[0] || 0,
				invertType:      +list[1] || 0,
				delayMultiplier: list[2] || 1,
				width:           list[3] || 0,
				height:          list[4] || 0,
				xRepeat:         list[5] === undefined ? 1 : list[5],
				yRepeat:         list[6] === undefined ? 1 : list[6],
			};
		},

		// 10.1.2. Commands
		commands(str) {
			let result = [];
			let commandCoords;

			str.split(/\s(?=[A-Z])/g).forEach(c => {
				let type   = Path.types[Path.types.keys.indexOf(c[0])];
				let coords = c.split(' ');
				let flag   = c[1];

				coords.shift();
				let command = [type, this.coords(coords)];
				command.flag = flag;

				result.push(command);

				// All other command coords set to lineTo
				if (type[0] === 'moveTo') {
					type = Path.types[1];
				}
				while ((commandCoords = command[1].splice(type[1].length, type[1].length)).length) {
					let nextCommand = [type, commandCoords];
					nextCommand.flag = flag;
					result.push(nextCommand);
				}
			});

			return result;
		},

		// 10.1.3. Coordinates
		coords(coords, delay, sizeIndex) {
			return coords.map(coordinate => {
				let result;
				let locSizeIndex;

				// Search size index
				coordinate = coordinate.replace(/s\d/, v => (locSizeIndex = +v.slice(1), ''));
				locSizeIndex = locSizeIndex === undefined ? sizeIndex : locSizeIndex;

				// Multiple coords
				let symI = coordinate.search(/[api]/g);
				if (symI >= 0) {
					// Check delay
					let curDelay;
					coordinate.replace(
						/d[0-9\-\.]+/g,
						val => (curDelay = parseFloat(val.substring(1)))
					);

					// Parse multiple coords
					result = this.coords(
						coordinate.substr(symI+1).split({a: '/', p: '_', i: ','}[coordinate[symI]]),
						curDelay || delay, locSizeIndex
					);

					result.type      = coordinate[symI];
					result.keyI      = parseInt(coordinate) || 0;
					result.delay     = curDelay || delay;
					result.sizeIndex = locSizeIndex;
					return result;
				}

				result = [
					parseFloat(coordinate),
					parseFloat(coordinate.split(/[~#]/g)[1]) * (coordinate.indexOf('~') >= 0 ? -1 : 1),
					parseInt(coordinate.split('$')[1]),
					parseInt(coordinate.split('@')[1])
				];
				result.sizeIndex = locSizeIndex;

				if (isNaN(result[0]) && coordinate.indexOf('~') >= 0) {
					result[0] = 1;
				}
				return result;
			});
		}
	};


	// 10.2. Process
	let Process = {
		// 10.2.1. Commands
		// Dynamic commands to static
		commands(top, strength, size, commands, dynValues, invertType) {
			let result = [];
			let { width, height, segWidth, segHeight, xRepeat, yRepeat } = size;

			let prevArgs = [0, 0, 0, 0, 0, 0, 0];
			let curX     = 0;

			for (let _i, i = 0; i < xRepeat; i++) {
				for (let j = 0; j < yRepeat; j++) {

					_i = invertType === 1 ? ((xRepeat-1) - i) : i;

					let wp = (i / (xRepeat-1)) || 0;
					let hp = (j / (yRepeat-1)) || 0;

					let dynamicValues = !dynValues ? 0 : dynValues({
						'i':   i,
						'j':   j,
						'w':   width / _.dpr,
						'h':   height / _.dpr,
						'wp':  wp,
						'hp':  hp,
						'iwp': 1 - wp,
						'ihp': 1 - hp
					});

					// Process commands for current segment
					let _commands = commands.filter(c => {
						return !(
							 (c.flag === 's' && i > 0) ||
							 (c.flag === 'e' && i < xRepeat-1) ||
							 (c.flag === 'm' && (i === 0 || i === xRepeat-1)) ||
							 (c.flag === 'c' && !(i === 0 || i === xRepeat-1))
						);
					}).map(c => {
						// Array of size types
						let sizes = c[0][1];

						// Return command [type, coords]
						return [c[0], c[1].map((c, ci) => {
							 // Select coordinate from multiple coords
							 if (c.type === 'i') {
								  c = c[_i%c.length];
							 }

							 // Additive segment position
							 let addX = (invertType === 3) ? (segWidth * xRepeat / 2) : 0;
							 let additive = [segWidth * _i + addX, segHeight * j + top, 0, 0, 0, 0][sizes[ci]];
							 // Subtractive segment position for invert shape coordinates
							 let subtractive = [0, segWidth, segHeight, 0][
								  ((sizes[ci] + 1) === invertType) ? invertType : 0
								  ];

							 // Custom size type index
							 let sizeIndex = c.sizeIndex === undefined ? sizes[ci] : c.sizeIndex;
							 let size      = [segWidth, segHeight, Math.PI, segWidth, segHeight, 1][sizeIndex];

							 // Process coordinate
							 let coord = this.coord(
								  c, dynamicValues, additive, subtractive, size, strength, sizeIndex !== 2
							 );

							 // Save X coordinate for animation delay
							 if (sizes[ci] === 0) {
								  curX = coord.type ? coord[0] : (coord.useArg ? prevArgs[coord.v] : coord);
							 }

							 // Calculate animation delay by X coordinate
							 if (coord.type === 'a') {
								  coord.xP = curX / (segWidth * xRepeat);

								  if (coord.delay) {
									  coord.xP += (coord.delay / xRepeat);
								  }
							 }

							 prevArgs[ci] = coord;
							 return coord;
						})];
					});

					result.push(..._commands);
				}
			}

			return result;
		},

		// 10.2.2. Coordinates
		coord(coord, dynamicValues, additive, subtractive, size, strength, toPx) {
			if (coord.type) {
				let arr = coord.map(c => this.coord(c, dynamicValues, additive, subtractive, size, strength, false));

				if (strength < 1) {
					arr = arr.map((v, i) => {
						if (i === 0) return v;
						return arr[0] + ((v - arr[0]) * strength);
					});
				}

				arr.type  = coord.type;
				arr.keyI  = coord.keyI;
				arr.delay = coord.delay;
				return arr;
			}

			let percent = (coord[0] || 0) * size;
			let pixels  = (coord[1] || 0) * _.dpr;
			let dynVal  = 0;

			if (coord[3]) {
				let r = { v: coord[3]-1 };
				r.useArg = true;
				return r;
			}

			if (coord[2]) {
				dynVal = dynamicValues[coord[2]-1] * _.dpr;
			}

			let result = percent + pixels + dynVal;
			if (subtractive) {
				result = subtractive - result;
			}
			result += additive;

			return toPx ? Math.round(result) : result;
		},

		// 10.2.3. Shape size
		shapeSize(canvasWidth, canvasHeight, rawSize, segFit, segSizeMultiplier) {
			let width     = canvasWidth;
			let height    = canvasHeight;
			let segWidth  = canvasWidth;
			let segHeight = canvasHeight;
			let xCount  = 1;
			let yCount  = 1;
			let xRepeat = 1;
			let yRepeat = 1;

			// Is pattern
			if (rawSize.width > 0) {
				let c = CMath;

				width  = c.val(rawSize.width, canvasWidth);
				height = c.val(rawSize.height, canvasHeight);

				width  = c.rel(width, rawSize.width, height, rawSize.width['relative']) * segSizeMultiplier;
				height = c.rel(height, rawSize.height, width, rawSize.height['relative']);

				width  = c.fit(width, canvasWidth, rawSize.width['fit'] && segFit);
				height = c.fit(height, canvasHeight, rawSize.height['fit'] && segFit);

				segWidth  = width;
				segHeight = height;

				xRepeat = +rawSize.xRepeat || Math.ceil(canvasWidth / width);
				yRepeat = +rawSize.yRepeat || Math.ceil(canvasHeight / height);

				width  *= xRepeat;
				height *= yRepeat;


				// + 1 additive for using previous segment coords in current
				xCount = Math.ceil(canvasWidth / width) + 1;
				yCount = Math.ceil(canvasHeight / height);

				// If enabled shift then add additive segment for shifting animation
				if (rawSize.type['shift']) {
					xCount += 1;
				}
			}

			return {
				width,    height,
				segWidth, segHeight,
				xCount,   yCount,
				xRepeat,  yRepeat
			};
		}
	};


	// 10.3. Path
	class Path {
		constructor(o) {
			let type   = Path.shapes.abbrs[o.type] || o.type;
			let sRaw   = Path.shapes[type];

			this.cache = Path.cache.shapes.get(type, () => ({
				size:      Parse.size(Path.getShapeValue(type, 0)),
				commands:  Parse.commands(Path.getShapeValue(type, 1)),
				keys:      sRaw[2] || [[0,1]]
			}));

			this.o     = o;
			o.top      = o.top      || 0;
			o.bottom   = o.bottom   || 0;
			o.stroke   = o.stroke   || 0;
			o.strength = o.strength || 0;
			o.shift    = o.shift    || 0;
			o.shiftDur = o.shiftDur || 0;
			o.delay    = o.delay    || 0;
			o.segSize  = o.segSize  || 1;
			o.opacity  = o.opacity === undefined ? 1 : o.opacity;
			o.segFit   = o.segFit  === undefined ? true : o.segFit;

			this.rawSize     = this.cache.size;
			this.staticKey   = `${type}${o.inverted}${o.stroke}`;
			this.rawCommands = this.cache.commands;
			this.keys        = this.cache.keys;
			this.dynVals     = sRaw[3];
			this.args        = new Array(8);

			this.useAnim = o.useAnim;
			this.anim    = new Anim();
		}

		// 10.3.1. Prepare
		prepare(w, h, fill) {
			let {o} = this;

			this.wdpr = w;
			this.hdpr = h;

			this.size = Process.shapeSize(
				this.wdpr, this.hdpr, this.rawSize, o.segFit, o.segSize
			);

			this.bottom = Math.round(o.bottom * h);
			this.top    = Math.round(o.top * h);
			let subHeight = this.top + this.bottom;

			if (o.isOpaque) {
				o.isBottom ? (this.top += 1) : (this.bottom += 1);
			}

			this.size.height    -= subHeight;
			this.size.segHeight -= subHeight;

			this.commands = Process.commands(
				this.top, o.strength, this.size,
				this.rawCommands, this.dynVals,
				this.o.inverted ? this.rawSize.invertType : 0,
			);

			// Precalculation
			this.animDelay = this.anim.dur * (o.delay * this.rawSize.delayMultiplier);

			this.addX = 0;
			this.addY = 0;
			this.lineWidth = Math.round(o.stroke * _.dpr);

			if (o.stroke && this.lineWidth % 2 !== 0) {
				this.addX += .5;
				this.addY += .5;
			}

			this.startX = 0;
			this.endX   = this.size.width * this.size.xCount;

			if (this.o.inverted && this.rawSize.invertType === 1) {
				[this.startX, this.endX] = [this.endX, this.startX];
			}

			this.prepareStyle(fill);
		}

		// 10.3.2. Style prepare
		// Generate pattern for types without animation
		prepareStyle(fill = '#fff') {
			if (this.rawSize.type['static']) {
				let { width, height } = this.size;

				this.pattern = Path.cache.patterns.get(this.staticKey + _.dpr, () => (
					Canvas.pattern(width, height, (c, g) => {
						g.strokeStyle = g.fillStyle = '#fff';
						this.draw(c, 0, true);
					})
				));

				this.pattern = Canvas.pattern(width, height, (c, g) => {
					c.fill(fill);
					g.globalAlpha = this.o.opacity;
					c.fill(this.pattern, 'destination-in');
					g.globalAlpha = 1;
				});
			}
		}

		// 10.3.3. Iterate
		iterate(animTime, strokeTime) {
			let {o} = this;
			let useShift = this.rawSize.type['shift'];

			if (this.useAnim) {
				this.anim.iterate(animTime);
			}
			if (useShift && o.shiftDur) {
				o.shift += (this.hdpr / o.shiftDur) * animTime;
			}
		}

		// 10.3.4. Draw
		draw(c, parallaxTime, forPattern) {
			let {o, animDelay} = this;
			let g = c.g;

			if (this.pattern && !forPattern) {
				g.globalAlpha = 1;
				c.fill(this.pattern);
				return;
			}

			let { width, height, segWidth, xCount, yCount } = this.size;
			let type      = this.rawSize.type;
			let isPattern = this.rawSize.width > 0;
			let useShift  = type['shift'];
			let addCommandType = +type;

			// Additive translation in pixels
			let addX = this.addX;
			let addY = this.addY;

			// Shift
			let shiftOffsetIndex = ~~(o.shift / width) + 1;
			let shiftAddCount    = useShift + isPattern;

			if (useShift) {
				addX += o.shift % width - (width * shiftAddCount);
			}

			// Segments
			let xLen = forPattern ? 1 : xCount;
			let yLen = forPattern ? 1 : yCount;

			// Canvas settings
			if (!forPattern && o.opacity < 1) {
				g.globalAlpha = o.opacity;
			}
			if (o.stroke > 0) {
				g.lineWidth = this.lineWidth;
			}

			g.beginPath();

			let startX = addX + this.startX;
			let endX   = addX + this.endX;

			if (addCommandType === 1) {
				g.moveTo(startX, c.h + 2);
				g.lineTo(startX, c.h - this.bottom);
			}

			// Animation precalculation
			let animShiftIndex = xLen + shiftOffsetIndex;

			// Draw all segments
			for (let shiftIndex, _i, i = 0; i < xLen; i++) {
				_i = (this.o.inverted && this.rawSize.invertType === 1) ? ((xLen - 1) - i) : i;
				// Shift current x index by shift offset index
				shiftIndex = useShift ? (_i - shiftOffsetIndex) : _i;
				(shiftIndex < 0) && (shiftIndex += xLen);

				let animTimeOffset = (animShiftIndex - _i) * animDelay;

				for (let j = 0; j < yLen; j++) {
					this.drawCommands(
						g,
						addX + (width * _i),
						addY + (height * j),
						false,
						animTimeOffset,
						animDelay
					);
				}
			}

			if (addCommandType > 0) {
				if (addCommandType === 2) {
					g.moveTo(startX, c.h + 2);
					g.lineTo(startX, c.h - this.bottom);
				}
				g.lineTo(endX, c.h - this.bottom);
				g.lineTo(endX, c.h + 2);
			}

			o.stroke ? g.stroke() : g.fill();

			if (!forPattern && o.opacity < 1) {
				g.globalAlpha = 1;
			}
		}

		// 10.3.5. Draw Commands
		drawCommands(g, x, y, draw, animTimeOffset, animDur) {
			for (let k = 0; k < this.commands.length; k++) {
				let c = this.commands[k];
				let [type, coords] = c;
				let dir = type[1];

				for (let coord, n = 0; n < coords.length; n++) {
					coord = coords[n];

					if (coord.type) {
						this.args[n] = this.anim.processKeys(
							 coord,
							 this.keys[coord.keyI],
							 this.anim.segment(
								  this.anim.dur,
								  animTimeOffset - coord.xP * animDur
							 )
						);
					}
					else if (coord.useArg) {
						this.args[n] = this.args[coord.v];
						continue;
					}
					else {
						this.args[n] = coord;
					}
					this.args[n] += [x, y, 0, 0, 0, 0][dir[n]];
				}

				if (!draw) {
					g[type[0]](...this.args);
				}
			}
		}
	}

	// 10.4. Caches
	Path.cache = {
		shapes:   new Cache(),
		patterns: new Cache()
	};

	Path.getShapeValue = (name, val) => {
		let {shapes} = Path;
		if (shapes[name] === undefined) {
			console.log(`CDivs. Type '${name}' not found.`);
		}
		let result = shapes[name][val];

		if (result.p) {
			return shapes[result.p][val];
		}

		return result;
	}

	// 10.5. Types
	// Size multiplier indices
	// 0 - Segment width  + additive x
	// 1 - Segment height + additive y
	// 2 - Math.PI
	// 3 - Segment width  - used for radius
	// 4 - Segment height - used for radius
	// 5 - No multiplier
	Path.types = [
		['moveTo',           [0, 1]],
		['lineTo',           [0, 1]],
		['rect',             [0, 1, 3, 4]],
		['arc',              [0, 1, 4, 2, 2, 5]],
		['arcTo',            [0, 1, 0, 1, 4]],
		['ellipse',          [0, 1, 3, 4, 2, 2, 2, 5]],
		['quadraticCurveTo', [0, 1, 0, 1]],
		['bezierCurveTo',    [0, 1, 0, 1, 0, 1]],
		['spiral',           [0, 1, 0, 1, 0, 1]],
	];
	Path.types.keys = 'MLRATEQCS';

	// Pattern Flags
	// S - Enable shift
	// s - Static shape
	// r - Relative to other side
	// f - Fit pattern segments to canvas size

	// Pattern Order
	// 0 - Start coords. 0 - no, 1 - yes, 2 - starts coords after draw
	// 1 - Invert type. 1 - By x, 2 - by Y, 3 - add 50% to X.
	// 2 - Animation segment delay multiplier
	// 3 - Pattern width in percent.
	// 4 - Pattern height in percent.
	// 5 - Pattern static repeat by X count.
	// 6 - Pattern static repeat by Y count.

	// Pattern Example
	// 1S 1 1 2rf 1 0 3
	// 1 - With start coords
	// S - Shift enabled
	// 1 - Invert type by X
	// 2rf - 200%. r - relative to height, 200% of height. f - fit to divider width.
	// 1 - 100% height
	// 0 - inifite x repeat
	// 1 - 1 y repeat

	// Shapes
	// M - moveTo(x, y)
	// L - lineTo(x, y)
	// R - rect(x, y, w, h)
	// A - arc(x, y, radius, startAngle, endAngle, startFrom: 1 or 0)
	// T - arcTo(x, y, x1, y1, radius)
	// E - ellipse(x, y, xRadius, yRadius, rotation, startAngle, endAngle, startFrom: 1 or 0)
	// Q - quadraticCurveTo(x, y, x1, y1)
	// C - bezierCurveTo(x, y, x1, y1, x2, y2)
	// S - spiral. Not implemented.

	// Shape flags
	// s - only first in pattern
	// m - only middle in pattern
	// e - only last in pattern
	// c - only first and last in pattern

	// Coords
	// a/  - Animation. a0/1/.5
	// p-  - Parallax. p0-1
	// i,  - Segment index. ia0/1,a1/0
	// @   - Previous command coord. @2
	// s   - Size multiplier index. L 0 s0a1/0
	// #   - Pixels. #10 = +10px
	// ~   - Pixels. ~10 = 100%-10px
	// .5~ - Pixels with percents .5~10 = 50%-10px
	// $   - Dynamic value from function array. $1 = dynArr[0]

	// Shape structure
	// 1. Pattern info        '1S 2rf 1'
	// 2. Shape commands      'M 0 0'
	// 3. Animation keys.     [0, 1]
	// 4. Dynamic values      (p) => [p.w]
	// 5. Stroke size factor  100

	// Live editing: https://ilvimafr.github.io/cdivs/path

	Path['shapes'] = _.splitAbbrKeys({
		'skew|s': [
			'1 1', 'L 0 a0/.5 1 1'
		],
		'triangle|t': [
			'1 2', 'L 0 1 .5 a0/.5 1 1'
		],
		'roundedTriangle|rt': [
			'1 2', 'L 0 1 T .5 a0/.5 1 1 2 1 1'
		],
		'triangles|ts': [
			'1S 3 1 2rf 1', 'L 0 @2 .5 a0/.3 1 a1/.7'
		],
		'roundedTriangles|rts': [
			'1S 3 1 2rf 1', 'T .5 a-.05/.3 .75 .5 s0.07 T 1 a1.05/.7 1.25 .5 @5'
		],
		'hillside|hs': [
			'1S 1 5 2rf 1 0 1',
			'Ls 0 1 L 0 a.3$2/.2$2 .5 a0$1/.1$1',
			0, (p) => [(p.h*.7)*p.wp, (p.h*.7)*p.wp]
		],
		'slope|sl': [
			'1 1',
			'L 0 0 T .7 a1/.7 1 0 s3.2 L 1 0 1 1',
		],
		'bevels|bs': [
			'1 2', 'L 0 1 T .1 a.3/.6 .5 0 s3.1 T .8 a0/.3 1 1 s3.1 L 1 1 1 0',
		],
		'wave|w': [
			'1 1', 'L 0 0 C a.33/.2 a2.9/1.9 a.66/.7 a-1.9/-.9 1 1'
		],
		'waves|ws': [
			'1S 3 2 1.8rf 1 2 1',
			'C .4 d-.4ia0/.3,a1/.7 .6 d.4ia1/.7,a0/.3 1 @4'
		],
		'arc|a': [
			'1 2', 'L 0 1 Q .5 a-1/0 1 1'
		],
		'rise|ri': [
			'1 1', 'L 0 0 Q a.5/.2 a1/1.1 1 1'
		],
		'descent|ds': [
			'1 1', 'L 0 0 Q .5 a0/.5 1 1'
		],
		'clouds|cl': [
			'1S 3 5 4rf 1',
			'E .13 .5$1 .1 s3a.1/.08 0 .8 .3 E .28 .8$1 .12 s3a.12/.1 0 .8 .2 E .42 1.1$2 .12 s3a.12/.1 0 .1 0 E .58 1.2$2 .12 s3a.12/.1 0 .8 .5 E .72 .83$2 .1 s3a.1/.08 0 .8 .5 E .85 .55$1 .1 s3a.1/.08 0 .8 .5 E 1 .35$1 .1 s3a.1/.08 0 .8 .3',
			0, (p) => [(p.w-p.h*3)*.09, (p.w-p.h*3)*.05]
		],
		'circles|ci': [
			'1S 3 1 1.5rf 1',
			'E .5 1 .5#1 a1/.6 0 1 0',
		],
		'rects|rs': [
			'1S 3 1 .5rf 1',
			'L 0 a0/1 .5 @2 .5 a1/0 1 @2',
		],
		'debris|db': [
			'2S 3 1 2rf 1 1 1',
			'M 0 1 0 .9 .2 .8 .3 .95 .4 .85 .5 .9 .7 .7 .8 .85 .9 .8 1 .9 1 1 M 0 a.6/.8 .07 d-.07a.5/.7 .18 d-.18a.6/.78 0 a.7/.88 M .22 d.08a.6/.8 .3 a.45/.65 .39 d-.09a.64/.84 .3 a.75/.93 M .42 d.08a.62/.82 .6 d-.06a.4/.6 .67 d-.1a.5/.7 .5 a.67/.87 M .73 d.07a.45/.65 .8 a.45/.65 .89 d-.09a.57/.77 .8 a.62/.82 .73 d.07a.52/.72 M .9 a.3/.5 .95 a.4/.6 .97 a.6/.8 .92 a.5/.7 M .4 d.1a.35/.55 .55 d-.05a.1/.3 .6 d-.1a.15/.35 .4 d.1a.4/.6 M .1 a.25/.45 .2 d-.1a.2/.4 .2 d-.1a.4/.6 M .65 d.05a.15/.35 .7 a.1/.3 .8 d-.1a.1/.3 .8 d-.1a.2/.4 .75 d-.05a.3/.5 .7 a.3/.5'
		],
		'pattern1|pt1': [
			'2S 3 1 1.5rf 1',
			'M 0 a.1/.25 .24 d-.25a.4/.55 0 a.85/1 M 0 1 .28 .47 .5 .6 .72 .47 1 1 M .325 d.175a.375/.498 .5 a.475/.6 .675 d-.175a.375/.498 .6 d-.1a.2/.35 .5 a.25/.4 .4 d.1a.2/.35 M 1 a.85/1 0.76 d.25a.4/.55 1 a.1/.25',
		],
		'pattern2|pt2': [
			'2S 3 5 5rf 1',
			'M 0 1 0 .75 Q .25 .25 .5 .75 Q .75 1.25 1 .75 L 1 1 M .75 a.2/.7 A @1 @2 .2 1 -1 M .6 a.2/.7 A @1 @2 .1 1 -1 M .9 a.2/.7 A @1 @2 .1 1 -1 M .45 a.15/.4 A @1 @2 .15 1 -1 M .3 a.1/.4 A @1 @2 .05 1 -1 M .15 a.1/.4 A @1 @2 .1 1 -1 M .02 a.1/.4 A @1 @2 .05 1 -1',
		],
		'pattern3|pt3': [
			'2S 3 5 2rf 1 1 1',
			'M 0 1 Q 0 .5 .18 a0/.3 L .5 .8 .82 a0/.3 Q 1 .5 1 1 M .5 .5 A .5 a.5/.2 .1 1 -1',
			0,
		],

		'_lines|_l': [
			'0 0 1 10 10',
			'M .5 -1 .5 2'
		],
		'_obliqueLines|_ol': [
			'0s 0 1 12 12',
			'M -1 -1 2 2 ' +
			'M -1 0 1 2 ' +
			'M 0 -1 2 1'
		],
		'_invertedObliqueLines|_iol': [
			'0s 0 1 12 12',
			'M 2 -1 -1 2 ' +
			'M 2 -2 -1 1 ' +
			'M 2 0 -1 3'
		],
		'_cross|_c': [
			'0s 0 1 12 12',
			'M 2 -1 -1 2 ' +
			'M 2 -2 -1 1 ' +
			'M 2 0 -1 3 ' +
			'M -1 -1 2 2 ' +
			'M -1 0 1 2 ' +
			'M 0 -1 2 1'
		],
		'_triangles|_t': [
			'0s 0 1 24 12',
			'M -.5 -.9 0 -.1 .5 -.9 ' +
			'M 1.5 -.9 1 -.1 .5 -.9 ' +
			'M 0 1.9 .5 1.1 1 1.9 ' +
			'M -.5 .1 0 .9 .5 .1 1 .9 1.5 .1'
		],
		'_squares|_sq': [
			'0s 0 1 16 16 1 0',
			'R $1 $1 $2 $2', 0, p => [4 + 3 * p.hp, 8 - 6 * p.hp]
		],
		'_circles|_ci': [
			'0s 0 1 16 16 1 0',
			'M .5$2 .5 A .5 .5 $1 -1 1.2', 0, p => [4 * p.ihp, -(4 * p.ihp)]
		],
		'_dots|_do': [
			'0s 0 1 10 10',
			'R .5 .5 #1 #1'
		],
		'_hexagons|_hx': [
			'0s 0 1 36 32 1 1',
			'M #9 #10 #18 #5 #27 #10 #27 #20 #18 #26 #9 #21 #9 #10 M #9 #10 #0 #5 #0 #-1 M #18 #5 #18 #-1 M #27 #10 #37 #4 #36 #-1 M #27 #20 #36 #26 #36 #33 M #18 #26 #18 #34 M #9 #21 #0 #26 #0 #33',
		],
		'_arcs|_as': [
			'0s 0 1 26 26 1 1',
			'M #0 #13 A #13 #13 #13 -1 0 M #2 #13 A #13 #13 #10 -1 0 M #-13 #26 A #0 #26 #13 -1 0 M #-13 #26 A #0 #26 #10 -1 0 M #13 #26 A #26 #26 #13 -1 0 M #13 #26 A #26 #26 #10 -1 0 M #0 #39 A #13 #39 #13 -1 0',
		],
		'empty|e': ['0', 'M 0 0'],
	});


	// 11. Divider
	class CDivs {
		constructor(el, options = {}) {
			// Cache
			this.cache = {
				width:    new CachedVar(),
				height:   new CachedVar(),
				dpr:      new CachedVar(),
				adaptive: new CachedVar(),
			};

			// Options abbreviation disclosure
			for (let key in options) {
				options[CDivs.defaultOptions.abbrs[key] || key] = options[key];
			}
			// Options defaults
			this.options = Object.assign({}, CDivs.defaultOptions, options);

			// Calculate options
			this.updateOptions();
			let o = this.o;

			let isBottom = !!o.bottom;

			// Find element
			el = q(el);
			el = el.get('El') || el;
			let wrap = el.get('Wrap') || el;

			if (o.opposite) {
				let checkEl = isBottom ? wrap.next() : wrap.prev();
				checkEl = checkEl.get('El') || checkEl;

				// Check if opposite is suited
				if (!CSS.isElementTransparent(checkEl)) {
					el = checkEl;
					wrap = el.get('Wrap') || el;
					isBottom = !isBottom;
				}
			} else {
				// Select element which has background
				if (!o.ignoreTransparency && CSS.isElementTransparent(el)) {
					el = isBottom ? wrap.next() : wrap.prev();
					el = el.get('El') || el;
					wrap = el.get('Wrap') || el;
					isBottom = !isBottom;
				}
			}

			this.oppEl    = isBottom ? wrap.next() : wrap.prev();
			this.bgEl     = el;
			this.isBottom = isBottom;
			this.pos      = isBottom ? 'bottom' : 'top';

			// If divider already added to current position then return already created divider
			let list = this.bgEl.get('List') || new CDivsList();
			if (list.length === 1 && list[0].isBottom === this.isBottom) {
				return new CDivsList(list[0]);
			}
			if (list.length > 1) {
				return new CDivsList((list[0].isBottom === this.isBottom) ? list[0] : list[1]);
			}

			this.refreshSemiTransparent();

			// Define background and inner elements
			this.bgEls = this.bgEl.copy();

			if (o.inners) {
				this.innerEls = this.bgEl.q(o.inners, true);
				this.bgEls.add(this.innerEls);
			} else {
				this.innerEls = q([]);
			}

			// Save canvas position for WebKit fix
			this.cLeft = 0;
			this.cTop  = 0;

			this.refreshRects();

			this.clipInit();
			this.canvasInit();
			this.bgInit();

			if (this.hasFixed) {
				this.bgWrap.css('transform', 'none');
			}

			this.bgEls.each(el => {
				q(el).set('ROList', (list = new CDivsList()) => (list.push(this), list));
				CDivs.RO && CDivs.RO.observe(el);
			});
			this.bgEl.set('List', (list = new CDivsList()) => (list.push(this), list));
			this.bgWrap.set('List', () => this.bgEl.get('List'));

			this.bgResize();
			this.canvasRefresh();

			this.bgEl.addCl(_.addPrefix('-element'));
			this.bgEl.addCl(_.addPrefix('-element-' + this.pos));

			CDivs.list.push(this);
			return new CDivsList(this);
		}

		// 11.1. Resize
		resize() {
			this.updateOptions();
			this.refreshRects();
			this.clipRefresh();
			this.bgResize();
			this.canvasRefresh();
		}

		refreshRects() {
			let {bgEl, bgEls, el, o, pos} = this;

			bgEl.set(pos, v => o.size);
			this.rects = bgEls.map((el, i) => q(el, [bgEls.list.pseudo[i]]).styleRect());
		}

		// 11.2. Options
		calcOptions() {
			let aIndex = this.cache.adaptive.value;
			this.o = {};

			for (let key in CDivs.defaultOptions) {
				let value    = this.options[key];
				let defValue = CDivs.defaultOptions[key];

				// Dynamic value depending on breakpoints
				if (defValue && defValue.dynamic && Array.isArray(value)) {
					value = value[aIndex >= value.length ? value.length-1 : aIndex];
				}

				this.o[key] = value;
			}
		}

		updateOptions() {
			let {cache, options} = this;

			// Cache
			cache.width.set(_.width);
			cache.height.set(_.height);
			cache.dpr.set(_.dpr);

			let index = options.breakpoints.findIndex(p => p >= _.width);
			cache.adaptive.set(index === -1 ? options.breakpoints.length : index);

			if (cache.adaptive.changed || this.optionsChanged) {
				this.calcOptions();
			}
		}

		setOptions(newOptions) {
			this.optionsChanged = true;

			for (let prop in newOptions) {
				let abbr = CDivs.defaultOptions.abbrs[prop] || prop;

				newOptions[abbr]   = newOptions[prop];
				this.options[abbr] = newOptions[prop];
			}

			this.updateOptions();

			if (newOptions.semiTransparent !== undefined) {
				this.refreshSemiTransparent();
			}
			if (newOptions.inners !== undefined) {
				this.bgs.forEach(bg => bg.destroy(this.canvas.am));

				this.innerEls = this.bgEl.q(newOptions.inners, true);
				this.bgEls = this.bgEl.copy().add(this.innerEls);

				this.bgInit();
			}
			if (newOptions.scroll !== undefined || newOptions.scrollParent !== undefined) {
				this.scrollInit();
			}

			this.refreshRects();
			this.clipRefresh();
			this.bgResize();
			this.canvasRefresh();
			this.createPaths();

			this.optionsChanged = false;
		}

		getOptions() {
			return this.options;
		}

		getCurrentOptions() {
			return this.o;
		}

		// 11.3. Canvas
		canvasInit() {
			let c = this.canvas = new Canvas({
				// Canvas resize
				resize: (c, g, changes) => {
					let {o} = this;
					let [dprChanged, adaptiveChanged, optionsChanged] = changes;

					// Cut path is static, so update only after device pixel ratio changes
					if (dprChanged || optionsChanged) {
						this.cutPath && this.cutPath.prepare(c.w, c.h, '#fff');
					}
					// Update cut pattern
					if (dprChanged || adaptiveChanged || optionsChanged) {
						let cutGrad = [
							[0, `rgba(255,255,255,${o.decorOpacity})`],
							[1, `rgba(255,255,255,0)`]
						];
						if (o.decorFading === 'centerFade' || o.decorFading === 'cF') {
							cutGrad[0][0] = .5;
							cutGrad.unshift([0, `rgba(255,255,255,0)`]);
						}
						cutGrad = c.vGrad(cutGrad);

						// Create pattern with cut path and gradients
						this.cutPattern = Canvas.pattern(this.cutPath ? this.cutPath.size.width : 2, c.h, (c, g) => {
							g.fillStyle = '#fff';
							this.cutPath && this.cutPath.draw(c, 0);
							c.fill(cutGrad, 'destination-in');
						});

						// Update opacity gradient pattern
						let bgGrad = c.vGrad([
							[0, `rgba(255,255,255,${o.opacity})`],
							[1, '#fff']
						]);
						this.gradPattern = Canvas.pattern(2, c.h, (c, g) => {
							c.fill(bgGrad);
						});
					}
					// Update main path group
					this.paths.forEach(p => p.prepare(c.w, c.h - (this.semiTransparent ? 0 : 1)));
				},

				// Called for updating styles
				// After canvas resize & changing background elements css properties
				style: (c, g) => {
					let {o} = this;
					// Refresh css properties
					if (c.am.isScroll || c.am.isLongScroll) {
						if (o.scroll !== false) {
							this.refreshRects();
							this.bgResize();
						}
						c.am.isScroll = false;
					}
					else {
						this.bgs.forEach(bg => bg.refresh());
					}

					// Make background pattern
					c.clear();
					this.bgs.forEach(bg => bg.draw(c, this.isBottom ? (Math.round(this.bgs[0].height) - c.h) : 0));
					this.bgPattern = c.pattern();
				},

				// Animation iterate
				iterate: (c, g, t) => {
					this.paths.forEach(p => p.iterate(t, t));
				},

				draw: (c, g, t) => {
					c.clear();

					// Fill main path group with cut pattern
					g.fillStyle = this.gradPattern;
					this.paths.forEach(p => p.draw(c, 0));

					c.gco('destination-out');
					c.fill(this.cutPattern);

					// Fill the background in shape
					c.gco(this.isBottom ? 'source-out' : 'source-in');
					c.fill(this.bgPattern);
					c.gco();
				}
			});

			c.el.addCl(`${_.addPrefix('-canvas')} ${_.addPrefix('-canvas-' + (this.isBottom ? 'bottom' : 'top'))}`).css(
				'width',     '100%',
				'position',  'absolute',
				'left',      '0',
				this.pos,    '0',
				'will-change', 'transform',
				'z-index',   '2',
			);

			this.bgWrap.prepend(c.el);
			this.createPaths();
		}

		canvasRefresh() {
			let {canvas, rects, cache, o, bgs, pos, optionsChanged} = this;

			let cWidth        = rects[0].snap(true).w || canvas.w || 1;
			let cHeight       = Math.round(o.size * _.dpr);

			let bgChanged     = bgs.some(bg => bg.isResized || bg.isMoved);
			let screenChanged = cache.dpr.changed || cache.adaptive.changed;
			let sizeChanged   = cWidth !== canvas.w || cHeight !== canvas.h;
			let isVisible     = cWidth > 1 && cHeight > 1;
			let changes       = [
				cache.dpr.changed,
				cache.adaptive.changed,
				optionsChanged
			];

			if (isVisible && (bgChanged || screenChanged || sizeChanged || optionsChanged)) {
				canvas.resize(cWidth, cHeight, changes);
			} else {
				canvas.changes = changes.map((v, i) => canvas.changes[i] || v);
			}

			// Refresh duration
			if (cache.adaptive.changed) {
				this.refreshDuration();
			}

			if (cache.adaptive.changed || optionsChanged) {
				canvas.el.css('height', o.size + 'px');
			}

			if (isVisible && this.hasFixed) {
				canvas.am.bcr = canvas.el.rect();
			}

			// Fix Safari WebKit canvas position
			if (_.isWebkit && isVisible) {
				let cpos  = canvas.el.rect();
				let cleft = (cpos.x - this.cLeft) * _.dpr;
				let ctop  = (cpos.y - this.cTop) * _.dpr;

				this.cLeft = (cleft % 1 >= .5) ? ((.5 - cleft % .5) / _.dpr) : 0;
				this.cTop  = (ctop % 1 >= .5) ? ((.5 - ctop % .5) / _.dpr) : 0;

				canvas.el.css(
					pos,    `${(this.isBottom ? -this.cTop : this.cTop)}px`,
					'left', `${this.cLeft}px`
				);
			}
		}

		// 11.4. Paths
		createPaths() {
			let {o, canvas}   = this;

			this.hasAdditional = !!o.addType;
			this.isAdditive    = ['a', 'su', 'sd', 'additive', 'stretchedUp', 'stretchedDown'].some(v => v === o.addType);

			// Create paths options
			let options = {
				type:      o.type,
				opacity:   1,
				isBottom:  this.isBottom,
				isOpaque:  !this.semiTransparent,
				strength:  o.strength,
				inverted:  o.inverted,
				delay:     o.delay,
				segFit:    o.segFit,
				segSize:   o.segSize,
				shiftDur:  o.shift,
				stroke:    o.stroke || undefined,
				useAnim:   !!o.dur,
			};

			let addOptions = {
				...options,
				type:     o.type,
				inverted: !o.inverted,
				opacity:  o.addOpacity,
				segSize:  o.addSegSize || o.segSize,
				segFit:   o.addSegFit   === undefined ? o.segFit : o.addSegFit,
				delay:    o.addDelay    === undefined ? o.delay : o.addDelay,
				shiftDur: o.addShift    === undefined ? o.shift : o.addShift,
				strength: o.addStrength === undefined ? o.strength : o.addStrength,
				useAnim:  !!(o.addDur   === undefined ? o.dur : o.addDur),
			};
			addOptions = new Array(o.addCount).fill(0).map(v => Object.assign({}, addOptions));

			// Restore previous paths properties
			this.paths && this.paths.forEach((path, i) => {
				if (i === 0 && o.shift) {
					options.shift = path.o.shift;
					addOptions.forEach(v => v.shift = path.o.shift);
				}
				if (i > 0 && addOptions[i-1] && o.addShift !== undefined) {
					addOptions[i-1].shift = o.addShift ? path.o.shift : 0;
				}
			});

			// Additional shape is additive
			this.isStretchedDown = ['sd', 'stretchedDown'].some(v => v === o.addType);
			this.isTypeAdditive  = ['a', 'additive'].some(v => v === o.addType);

			if (!this.isStretchedDown) {
				options.top = o.scale;
			}

			if (this.isAdditive) {
				addOptions = addOptions.map((v, i) => {
					let result = {...options};
					let power = (i + 1) / o.addCount;

					result.opacity = o.addOpacity;
					result.top = this.isStretchedDown ? 0 : (o.scale * (1 - power));

					if (this.isStretchedDown || this.isTypeAdditive) {
						result.bottom = o.scale * power;
					}
					return result;
				});
			}

			// Create paths
			let oldPaths = this.paths;
			this.paths = [new Path(options)];
			this.hasAdditional && addOptions.forEach(value => {
				let newPath = new Path(value);
				this.paths.push(newPath);
			});

			this.refreshDuration();

			// Set easing
			this.paths.forEach(path => path.anim.easing = Easing[o.timingFnc]);

			// Restore previous animation time
			oldPaths && this.paths.forEach((path, i) => {
				if (path.useAnim) {
					let index = i >= oldPaths.length ? oldPaths.length - 1 : i;
					path.anim.totalTime = oldPaths[index].anim.totalTime * (path.anim.dur / oldPaths[index].anim.dur);
				}
			});

			// Create cut path
			this.cutPath = !o.decor ? undefined : new Path({
				type:    `_${o.decor}`,
				opacity: 1,
				stroke:  o.decorWidth
			});
		}

		refreshDuration() {
			let {o} = this;

			this.paths.forEach((path, i) => {
				let dur = o.dur;
				let startTime = o.startTime;

				if (i > 0 && this.hasAdditional && !this.isAdditive) {
					dur = o.addDur === undefined ? o.dur : o.addDur;
					startTime = o.addStartTime === undefined ? o.startTime : o.addStartTime;
				}

				if ((path.useAnim = dur)) {
					path.anim.dur = dur;
				} else {
					path.anim.dur = 1000;
					path.anim.totalTime = path.anim.dur * startTime;
				}
			});

			if (o.dur || o.shift || (this.hasAdditional && !this.isAdditive && (o.addDur || o.addShift))) {
				this.enableAM();
			} else {
				this.disableAM();
			}
		}

		disableAM() {
			if (this.amEnabled) {
				this.canvas.am.draw.unreq();
				this.canvas.am.iterate.unreq();
				this.amEnabled = false;
			}
		}

		enableAM() {
			if (!this.amEnabled) {
				this.amEnabled = true;
				this.canvas.am.draw.req();
				this.canvas.am.iterate.req();
			}
		}

		// 11.5. Canvas backgrounds
		bgInit() {
			let {canvas, bgEls, o} = this;

			this.bgs = bgEls.map((el, i) => {
				return new CanvasBg({
					el:   q(el, [bgEls.list.pseudo[i]]),
					am:   canvas.am,
					type: 'background'
				});
			});

			this.hasFixed = this.bgs.some(v => v.hasFixed);
			this.scrollInit();
		}

		bgResize() {
			let {rects, bgs, cache} = this;

			let shift = rects[0];

			// Safari Webkit snapping first
			if (_.isWebkit) {
				shift = shift.snap();
			}

			bgs.forEach((bg, i) => {
				let fractionRect = rects[i];

				let rect;
				if (_.isWebkit) {
					rect = rects[i].snap().move(shift.x, shift.y, true);
				} else {
					rect = rects[i].move(shift.x, shift.y, true).snap();
				}

				bg.resize(
					rect.x, rect.y,
					rect.w, rect.h,
					fractionRect.x * _.dpr, fractionRect.y * _.dpr,
					fractionRect.w * _.dpr, fractionRect.h * _.dpr,
					cache.width.changed || cache.height.changed
				);
			});
		}

		refreshSemiTransparent() {
			let {o, bgEl} = this;

			this.semiTransparent = o.semiTransparent === 'auto' ? CSS.isElementSemiTransparent(bgEl) : o.semiTransparent;
		}

		// 11.6. Background clipping
		clipInit() {
			this.bgWrap = CSS.clipBackground(this.bgEl);
			this.bgEl.set('Wrap', () => this.bgWrap);
			this.bgWrap.set('El', () => this.bgEl);
			this.bgWrap.addCl(_.addPrefix('-wrap ') + _.addPrefix(`-wrap-${this.pos}`));

			this.clipRefresh();
			if (this.o.underlay && typeof this.o.underlay === 'number') {
				this.bgWrap.addCl(_.addPrefix('-underlay'));
			}
		}

		clipRefresh() {
			let {pos, o, bgEl, bgWrap, rects, cache} = this;
			let rect = rects[0];

			// Fix clip-path float coords
			let diff = false;

			if (_.isBlink) {
				if (!this.isBottom) {
					diff = (o.size * _.dpr) % 1;
					diff = diff >= CMath.mid ? (1 - diff) : -diff;
				}
				else {
					diff = ((rect.h - o.size) * _.dpr) % 1;
					diff = diff >= CMath.mid ? -(1 - diff) : diff;
				}
				diff /= _.dpr;
			}

			if (_.isWebkit && this.isBottom) {
				let fractionY   = (rect.y * _.dpr) % 1;
				let fractionH   = (rect.h * _.dpr) % 1;
				let fractionSum = fractionY + fractionH;

				if (fractionY < .5 && fractionH < .5 && fractionSum >= .5) {
					diff = -1;
				}
				if (fractionY >= .5 && fractionH >= .5 && fractionSum >= 1.0 && fractionSum < 1.5) {
					diff = 1;
				}
			}

			if (cache.adaptive.changed || this.optionsChanged || diff !== false) {
				bgEl.cssVar(
					_.addPrefix('-' + pos),
					`${o.size + diff - (this.semiTransparent ? 0 : 1)}px`,
				);
			}

			if (cache.adaptive.changed) {
				this.oppEl.cssVar(
					_.addPrefix('-offset-' + (this.isBottom ? 'top' : 'bottom')),
					`${o.underlay ? o.size : 0}px`,
				);
			}

			if (cache.adaptive.changed || this.optionsChanged) {
				let size = 0;
				if (o.underlay) {
					size = o.size;
					if (typeof o.underlay === 'number') {
						size = o.underlay * o.size;
					}
					bgWrap.css(`margin-${pos}`, `-${size+1}px`);
				}
			}
		}

		// 11.7. Scroll
		scrollInit() {
			let {o, canvas: c} = this;

			this.scrollDestroy();

			if (this.hasFixed || o.scroll) {
				this.scrollEl = q(o.scrollParent);
				this.scrollCallback = () => {
					if (typeof o.scroll === 'number') {
						if (!c.am.isLongScroll) {
							c.am.isLongScroll = true;
							c.am.style.req();
							c.am.draw.req();
						}

						clearTimeout(this.scrollTimeout);
						this.scrollTimeout = setTimeout(() => {
							c.am.isLongScroll = false;
							c.am.style.unreq();
							c.am.draw.unreq();

							c.am.style.req(true);
							c.am.draw.req(true);
						}, o.scroll);
					}
					else {
						if (c.am.isVisible) {
							c.am.isScroll = true;
							c.am.style.req(true);
							c.am.draw.req(true);
						}
					}
				};
				this.scrollEl.on('scroll', this.scrollCallback);
			}
		}

		scrollDestroy() {
			if (this.scrollEl) {
				clearTimeout(this.scrollTimeout);
				this.scrollEl.off('scroll', this.scrollCallback);
				this.scrollEl = undefined;
			}
		}

		// 11.8. Destroy
		destroy() {
			this.scrollDestroy();

			// Destroy background if one divider left
			if (this.bgEl.get('List').length === 1) {
				this.bgWrap.unwrap();
				this.bgEl.css({
					'width':             '',
					'height':            '',
					'margin':            '',
					'position':          '',
					'top':               '',
					'left':              '',
					'right':             '',
					'bottom':            '',
					'transform':         '',
					'z-index':           '',
					'opacity':           '',
					'display':           '',
					'clip-path':         '',
					'-webkit-clip-path': '',
					'-moz-clip-path':    '',
				});
				this.bgEl.set('ClipBg', () => undefined);
			}
			// Destroy one divider
			else {
				// Remove current Animation Manager from Canvas Background
				this.bgs.forEach(bg => Arr.remove(bg.amList, this.canvas.am));
			}

			this.bgs.forEach(bg => bg.destroy(this.canvas.am));
			this.canvas.destroy();


			this.bgEl.removeCl(_.addPrefix('-element'));
			this.bgEl.removeCl(_.addPrefix('-element-' + this.pos));
			this.bgEl.cssVar(_.addPrefix('-' + this.pos), '0px');
			this.bgEl.get('List', list => Arr.remove(list, this));

			this.bgEls.each(el => {
				let list = q(el).get('ROList', list => Arr.remove(list, this));
				if (CDivs.RO && list.length === 0) {
					CDivs.RO.unobserve(el);
				}
			});

			Arr.remove(CDivs.list, this);
		}
	}

	// 11.9. Default options
	CDivs.defaultOptions = _.splitAbbrKeys({
		'breakpoints|b':   [768, 992, 1200],
		'size|s':          {a: [80, 100, 110, 120]},

		'semiTransparent|sTr':   'auto',
		'ignoreTransparency|iT': false,

		'type|t':          'waves',
		'inverted|i':      false,
		'opacity|o':       .8,
		'underlay|u':      false,
		'inners|in':       false,
		'opposite|op':     false,
		'bottom|bt':       false,
		'scroll|sc':       false,
		'scrollParent|sp': window,
		'stroke|sr':       0,

		'dur|d':           {a: [2000]},
		'startTime|sT':    0,
		'timingFnc|tF':    'inOut',
		'delay|dl':        0,
		'strength|st':     1,
		'shift|sh':        false,

		'segFit|sF':       true,
		'segSize|sS':      1,
		'scale|sl':        0,

		'addType|aT':      'invert',
		'addCount|aC':     1,
		'addOpacity|aO':   .5,
		'addSegFit|aF':    undefined,
		'addSegSize|aSS':  undefined,

		'addDur|aD':        {a: [undefined]},
		'addStartTime|aST': undefined,
		'addStrength|aSt':  undefined,
		'addDelay|aDl':     undefined,
		'addShift|aSh':     undefined,

		'decor|dc':        'lines',
		'decorFading|dF':  'fade',
		'decorOpacity|dO': .5,
		'decorWidth|dW':   1,
	});


	// 12. Shared list
	class CDivsList extends Array {
		push(el) {
			if (this.indexOf(el) === -1) {
				super.push(el);
			}
		}
	}
	Object.getOwnPropertyNames(CDivs.prototype).forEach(name => {
		if (name !== 'constructor' && typeof CDivs.prototype[name] === 'function') {
			CDivsList.prototype[name] = function(...args) {
				let result = [];
				let i = this.length;
				while (i--) {
					result.push(this[i][name](...args));
				}
				return result;
			};
		}
	});

	CDivs['list'] = new CDivsList();

	// 13. Resize Observer
	CDivs.RO = window.ResizeObserver && new ResizeObserver(entries => {
		let list = new Set();
		entries.forEach(entry => list.add(q(entry.target).get('ROList')));
		list.forEach(list => list.forEach(divider => divider.resize()));
	});

	// 14. Set Default Options
	CDivs['setDefaultOptions'] = function(options = {}) {
		let defOptions = CDivs.defaultOptions;

		for (let key in options) {
			defOptions[defOptions.abbrs[key] || key] = options[key];
		}
	};

	// 15. Refresh
	CDivs['refresh'] = function() {
		q('[data-cdivs]').each(el => {
			new CDivs(el, _.parseOptions(q(el).attr('data-cdivs')));
			q(el).removeAttr('data-cdivs');
		});
	};


	// 16. Initialization & Events
	if (document.readyState !== 'loading') {
		q.init();
		_.screenRefresh();
		_.scrollRefresh();
	} else {
		q.doc.on('DOMContentLoaded', () => {
			q.init();
			_.screenRefresh();
			_.scrollRefresh();
		});
	}

	q.wnd.on('load', () => {
		CDivs.refresh();
	});
	q.wnd.on('resize load', () => {
		_.screenRefresh();
		_.scrollRefresh();
		CDivs.list.forEach(divider => divider.resize());
	});
	q.wnd.on('scroll', () => {
		_.scrollRefresh();
	});

	_.viewport && _.viewport.addEventListener('resize', () => {
		_.screenRefresh();
		_.scrollRefresh();
		CDivs.list.forEach(divider => divider.resize());
	});

	CDivs['Path'] = Path;
	CDivs['Easing'] = Easing;
	return CDivs;
})();