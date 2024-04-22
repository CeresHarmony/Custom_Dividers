"use strict";

var Builder = (function(){

	// DOM Manipulation
	var $ = function(sel, parent){
		parent = parent || document;
		var els = parent.querySelectorAll(sel);

		return {
			eq: els,
			each: function(callback) {
				for (var i = 0; i < els.length; i++) {
					callback(i, els[i]);
				}
			},
			on: function(e, callback) {
				for (var i = 0; i < els.length; i++) {
					els[i].addEventListener(e, callback);
				}
			}
		}
	};

	// All divider types
	var types = [
		'skew',
		'triangle',
		'roundedTriangle',
		'triangles',
		'roundedTriangles',
		'hillside',
		'slope',
		'bevels',
		'wave',
		'waves',
		'arc',
		'rise',
		'descent',
		'clouds',
		'circles',
		'rects',
		'debris',
		'pattern1',
		'pattern2',
		'pattern3',
	];

	var decorTypes = [
		'_lines',
		'_obliqueLines',
		'_invertedObliqueLines',
		'_cross',
		'_triangles',
		'_squares',
		'_circles',
		'_dots',
		'_hexagons',
		'_arcs'
	];


	var Builder = {
		options: {},
		points: [],

		// Build js file from options
		build: function(){
			this.refreshOptions();

			var result = '';
			var curIndex = 0;
			for (var i = 0; i < this.points.length; i++) {
				var point = this.points[i];

				result += this.data.substring(curIndex, point.start);

				if (this.checkCondition(point.name)) {
					result += this.data.substring(point.start, point.end);
				}

				curIndex = point.end;
			}
			result += this.data.substring(curIndex, this.data.length);


			var blob = new Blob([result], {type: 'text/plain'});
			if (navigator.msSaveBlob) {
				return navigator.msSaveBlob(blob, 'cdivs.min.js');
			}
			else {
				var a = document.createElement("a");
				a.href = URL.createObjectURL(blob);
				a.download = 'cdivs.min.js';
				a.click();
			}
		},

		getData: function(){
			// Get raw text
			this.data = $('#data').eq[0].innerHTML;
			this.points = JSON.parse($('#data-points').eq[0].innerHTML);
		},

		// Get options status
		refreshOptions: function(){
			var self = this;
			var options = ['attrs', 'cssbackgrounds', 'cssgradients', 'cssthief', 'pseudo', 'scroll'];
			options = options.concat(types);
			options = options.concat(decorTypes);

			options.forEach(function(el) {
				self.options[el] = $('#' + el).eq[0].checked;
			});
		},

		checkCondition: function(val) {
			var cond = val.search(/\||\&/gi);
			if (cond > -1) {
				cond = val[cond];

				var arr = val.split(cond);
				var or = false, and = true;

				for (var option in this.options) {
					for (var i = 0; i < arr.length; i++) {
						if (option == arr[i]) {
							if (this.options[option] == true) {
								or = true;
							} else {
								and = false;
							}
						}
					}
				}

				if (cond == '&') {
					return and;
				}
				if (cond == '|') {
					return or;
				}
			}
			else {
				for (var option in this.options) {
					if (option == val) {
						if (this.options[option] == true) {
							return true;
						}
						return false;
					}
				}
			}

			return false;
		},

		calcSize: function(){
			this.refreshOptions();
			var size = this.data.length;

			for (var i = 0; i < this.points.length; i++) {
				var point = this.points[i];

				if (!this.checkCondition(point.name)) {
					size -= point.end - point.start;
				}
			}

			return (size / 1024).toFixed(2);
		}
	};


	// Checkbox tree
	$('.modules > ul > li').each(function(i, li){
		$('.modules > ul > li > label input', li).on('change', function(e){
			var checked = e.target.checked;

			$('li', li).each(function(i, el){
				el.className = checked ? "" : "disabled";
				$('input[type="checkbox"]', el).each(function(i, input) {
					input.checked = checked;
				});
			});
		});
	});


	// Types templates
	var typeTemplate = $('#type-template > *').eq[0];
	var ul = $('#types').eq[0];
	var decorUl = $('#decorTypes').eq[0];

	types.forEach(function(el){
		var li = typeTemplate.cloneNode(true);
		$('.title', li).eq[0].innerText = el;
		$('img', li).eq[0].setAttribute('src', 'assets/images/types/' + el + '.png');
		$('input', li).eq[0].setAttribute('id', el);
		ul.appendChild(li);
	});
	decorTypes.forEach(function(el){
		var name = el.substring(1);
		var li = typeTemplate.cloneNode(true);
		$('.title', li).eq[0].innerText = name;
		$('img', li).eq[0].setAttribute('src', 'assets/images/decors/' + name + '.png');
		$('input', li).eq[0].setAttribute('id', el);
		decorUl.appendChild(li);
	});


	// Events
	$('input').on('change', function(e){
		$('#total-size').eq[0].innerHTML = Builder.calcSize();
	});
	$('#build').on('click', function(){
		Builder.build();
	});
	$('.toggle-all').on('click', function(e){
		var inputs = $('input', e.target.parentNode.parentNode).eq;

		var test1 = true;
		for (var i = 0; i < inputs.length; i++) {
			if (inputs[i].checked) {
				test1 = false;
			}
		}
		for (var i = 0; i < inputs.length; i++) {
			inputs[i].checked = test1;
		}

		$('#total-size').eq[0].innerHTML = Builder.calcSize();
	});

	Builder.getData();
	$('#total-size').eq[0].innerHTML = Builder.calcSize();

	return Builder;
})();
