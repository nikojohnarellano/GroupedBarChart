var lineChart = function(param) {
	var width = param.width;
	var height = param.height;
	var elem = param.elem;
	var firstTooltipLableName = param.firstTooltipLableName;
	var secondTooltipLableName = param.secondTooltipLableName;
	var firstTooltipLableSuffix = param.firstTooltipLableSuffix;
	var showSecondTooltipLable = param.showSecondTooltipLable;
	var margin = { top: 30, right: 50, bottom: 30, left: 60 };
	var defaultXAxisTick = 8;
	var defaultXAxisAddTick = 0; //UISF-584 : Add 1 to the max domain date to show the last data point in the chart for the YW breakdown
	var legendXAxisLableName = param.legendXAxisLableName;
	var legendYAxisLableName = param.legendYAxisLableName;
	var translateX = param.translateX;
	var translateY = param.translateY;
	var showStdErr = param.showStdErr || false;
	var circleRadius = param.circleRadius || 5;

	var scorePrecision;
	if (param.scorePrecision !== undefined) {
		scorePrecision = param.scorePrecision;
	} else {
		scorePrecision = window.Settings.ScorePrecision;
	}

	var trans = 1000;
	var svg = d3.select(elem)
		.append('svg')
		.attr('width', width)
		.attr('height', height)
		.call(responsivefy)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


	d3.select(elem).selectAll("div.tooltip")
		.each(function() {
			$(this).remove();
		});
	var tooltip = d3.select(elem).append("div")
		.attr("class", "tooltip")
		.style("opacity", 0);

	return {
			h: height - margin.top - margin.bottom,
			w: width - margin.left - margin.right,
			path: null,
			data: [],
			svg: svg,
			elem: elem,
			trans: trans,
			xScale: null,
			xAxis: null,
			xAxisTicks: defaultXAxisTick,
			xAxisAddTicks: defaultXAxisAddTick,
			yScale0: null,
			yScale1: null,
			yAxis: null,
			addLine: null,
			addBar: null,  // bar return
			addstyle: null,
			dateAxisFormat: "%b %d '%y",
			setScales: function (xDom, yDom0, yDom1, options) {
				var that = this;
				this.xScale.domain([xDom[0], xDom[1]]);
				//this.xScale.domain([xDom[0], xDom[1].setDate(xDom[1].getDate() + that.xAxisAddTicks)]);
				this.yScale0.domain([yDom0[0]-yDom0[0], yDom0[1]+yDom0[1]*0.7]);
				this.yScale1.domain([yDom1[0]-yDom1[0], yDom1[1]+yDom0[1]*0.7]);
				//for now, i'm keeping the maximum ticks to defaultXAxisTick (i.e 5) until we can define a better logic to determine ticks
				if (options && options.xAxisTicks && typeof options.xAxisTicks === "number") {
					this.xAxisTicks = options.xAxisTicks > defaultXAxisTick ? defaultXAxisTick : options.xAxisTicks;
				}
			},
			setTrans: function(t) {
				this.trans = t;
			},
			/**
         * Initialize the Line chart
         * @param {} xDom x axis domain
         * @param {} yDom y axis domain
         * @param {} options extra parameters
         */
			initChart: function(xDom, yDom0, yDom1, options, data) {
				var that = this;

				//UISF-154 - get the ticks to avoid duplication
				if (options && options.dateAxisFormat && typeof options.dateAxisFormat === "string") {
					that.dateAxisFormat = options.dateAxisFormat;
				}

				that.xScale = d3.time.scale()
					.range([50, that.w-50]);

				//that.yScale = d3.scale.linear()
				//	.range([that.h, 0]);

				that.yScale0 = d3.scale.linear()
					.range([that.h, 0]);

				that.yScale1 = d3.scale.linear()
					.range([that.h, 0]);

				that.setScales(xDom, yDom0, yDom1, options);
                if (data !== undefined)
				{
				    that.xAxis = d3.svg.axis().scale(that.xScale)
					.tickFormat(d3.time.format(that.dateAxisFormat))
					//.ticks(that.xAxisTicks)
                    .tickValues(data.map(function (d) { return d.date; }))
					.orient("bottom");
				}
				else
				{
				    that.xAxis = d3.svg.axis().scale(that.xScale)
                                        .tickFormat(d3.time.format(that.dateAxisFormat))
                                        .ticks(that.xAxisTicks)
                                        .orient("bottom");
				}

				that.svg.append("g")
						.append("line")
						.attr({
							"class": "horizontalGrid",
							"x1": 0,
							"x2": that.w,
							"y1": that.h,
							"y2": that.h,
							"stroke-width": 1
						});

				that.yAxis0 = d3.svg.axis().scale(that.yScale0)
					.orient("left")
					.ticks(10);

				that.yAxis1 = d3.svg.axis().scale(that.yScale1)
					.orient("right")
					.ticks(10);


				that.svg
					.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + that.h + ")")
					.call(that.xAxis);

				that.svg.selectAll('text')
					.style("text-anchor", "end")
					.attr("dx", "2em")
					.attr("dy", "1em")
					.attr("transform", "rotate(-15)");

				that.svg
					.append("g")
					.attr("class", "y axis")
					.call(that.yAxis0);

				that.svg
					.append("g")
					.attr("class", "y axis")
					.attr("transform", "translate(" + that.w + ", 0)")
					.call(that.yAxis1);




				if (legendYAxisLableName !== undefined && legendYAxisLableName !== "") {
					that.svg.append("text")
						.attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
						.attr("transform", "translate(-" + translateY + ")rotate(-90)") // text is drawn off the screen top left, move down and out and rotate
						.style("fill", "#acacac")
						.style("font-size", "12px")
						.attr("dx", "2em")
						.text(legendYAxisLableName);
				}

				if (legendXAxisLableName !== undefined && legendXAxisLableName !== "") {
					that.svg.append("text")
						.attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
						.attr("transform", "translate(" + translateX + ")") // centre below axis
						.style("fill", "#acacac")
						.style("font-size", "12px")
						.attr("dx", "-2em")
						.text(legendXAxisLableName);
				}


				//add line data
				that.addLine = d3.svg.line()
					//.interpolate('cardinal')
					.x(function(d) {
						return that.xScale(d.date);
					})
					.y(function(d) {
					    return that.yScale0(scorePrecision === 0 ? Number(Math.round(d.yval)).toFixed(scorePrecision) : Number(d.yval).toFixed(scorePrecision));
					});

			},
			addStyle: function (pathID, data, type) {

					var strokeWidth = 2,  that = this;
					that.svg.selectAll('path.line').each(function (index) {
						$(this).attr("stroke-width", "2");
					});
				for (var i = 0; i < data.length; i++) {
					var t = data[i].type.toString() + data[i].id.toString();
					if (data && t === pathID && data[i].type === type) {
						strokeWidth = 2.8;
						return strokeWidth;
					} else {
						strokeWidth = 2;
					}
				}
				return strokeWidth;
			},
			addStyle2: function(pathID, data, type) {
				var strokeWidth = 2, that = this ;
				that.svg.selectAll('path.line').each(function (index) {
					$(this).attr("stroke-width", "2");
				});

				for (var i = 0; i < data.length; i++) {
					var t = data[i].type.toString() + data[i].id.toString();
					if (data && t === pathID && data[i].type === type) {
						strokeWidth = 4.8;
						return strokeWidth;
					} else {
						strokeWidth = 2;
					}
				}
				return strokeWidth;

			},
			updateStyle2: function(data, type, id) {
				var that = this;
				var pathID = type.toString() + id.toString();
				that.svg.selectAll('g.gline').each(function(index) {
						if ($(this).attr("id") == pathID && $(this).attr("type") == type) {
							$(this).attr("stroke-width", function() {
								if ($(this).attr("id") == pathID && $(this).attr("type") == type) {
									return 2.8;
								}
								return 2;
							});
						} else {
							return 2;
						}
					}
				);
				},
				updateStyle: function(data, type, id) {
				var that = this;
				var pathID = type.toString() + id.toString();
				that.svg.selectAll('g.gline').each(function(index) {
						if ($(this).attr("id") == pathID && $(this).attr("type") == type) {
							$(this).attr("stroke-width", function() {
								if ($(this).attr("id") == pathID && $(this).attr("type") == type) {
									return 4.8;
								}
								return 2;
							});
						} else {
							return 2;
						}
					}
				);
			},
		updateChart: function(data, color, type, id, name) {
			if (data.length > 0) {
				var that = this;
				if (type === undefined) {
					type = data[0].type;
				}
				var pathID = type.toString() + id.toString();

				//We need to check if the line exists then remove that else add
				var remove = false;
				that.svg.selectAll('g.gline').each(function(index) {
					if ($(this).attr("id") == pathID && $(this).attr("type") != 100) {
						remove = true;
						$(this).remove();
					}
				});

				if (!remove) {


					that.svg.selectAll('g.horizGrid').each(function () {
						$(this).remove();
					});

					// Background lines
					that.svg.append("g")
						.attr("class", "horizGrid")
						.selectAll("line.horizontalGrid").data(that.yScale0.ticks(10)).enter()
						.append("line")
						.attr({
							"class": "horizontalGrid",
							"x1": 0,
							"x2": that.w,
							"y1": function(d) { return that.yScale0(d); },
							"y2": function(d) { return that.yScale0(d); },
							"stroke-dasharray": function(d) { return "3, 3"; }
						});

					that.addBar = that.svg
						.selectAll("rect")
						.data(data)
						.enter()
						.append("rect")
						.attr("class", "bar")
						.attr("x", function(d) {return that.xScale(d.date)-15; })
						.attr("y", that.h)
						.attr("width", 30)
						.attr("height", 0)
						.on('mouseover', function(d) {
						    var tooltipText = '';
						    var yval = scorePrecision === 0 ? Number(Math.round(d.yval)).toFixed(scorePrecision) : Number(d.yval).toFixed(scorePrecision);
							if (showSecondTooltipLable) {
								tooltipText = '<b>' + name + '</b><br/>' +
									//'<span style="color:' + color + '">\u25CF</span> ' + //firstTooltipLableName + ': <b>' + yval + firstTooltipLableSuffix + '</b><br/>' +
									'<span style="color: blue">\u25CF</span> ' + secondTooltipLableName + ': <b>' + d.zval + '</b><br/>' +
									'<span style="color: blue">\u25CF</span> Date: <b>' + d.period + '</b><br/>';
							} else {
								tooltipText = '<b>' + name + '</b><br/>' +
									'<span style="color:blue">\u25CF</span> ' + firstTooltipLableName + ': <b>' + yval + firstTooltipLableSuffix + '</b><br/>' +
									'<span style="color:blue">\u25CF</span> Date: <b>' + d.period + '</b><br/>';
							}
							//alert(tooltipText);
							//add std error value to the tooltip. We always show stderr value if there is value for it, even if it's 0
							//i would prefer we can add this information on the tooltip during the StandardError() initialization,
							//  but since the tooltip belong to Line chart, i can't figure out a good way to separate the code below
							if (showStdErr && d.stderr !== "") {
								tooltipText += '<span style="color:' + color + '">\u25CF</span> Standard Error: <b>' + d.stderr + '</b><br/>';
							}
							tooltip.transition()
								.duration(200)
								.style("opacity", 0.9);
							tooltip.html(tooltipText)
								.style("left", (d3.event.offsetX ) + "px")
								.style("border-color", color)
								.style("top", (d3.event.offsetY - 75) + "px")
								.style("background-color", "#FFFFFF");
							d3.select(this)
								.classed('hover', true)
								.transition()
								.duration(400)
								.attr('r', circleRadius * 1.5)
								.transition()
								.duration(150)
								.attr('r', circleRadius * 1.25);
						})
						.on('mouseout', function() {
							tooltip.transition()
								.duration(500)
								.style("opacity", 0);
							d3.select(this)
								.classed('hover', false)
								.transition()
								.duration(150)
								.attr('r', circleRadius);
						})
						.transition()
						.duration(800)
						.delay(function(d,i){return i*500;})
						.attr("y", function(d) {return that.yScale1(d.zval); })
						.attr("height", function(d) {return that.h - that.yScale1(d.zval); });

					var gLine = that.svg.call(responsivefy)
						.append("g")
						.attr("class", "gline")
						.attr("id", pathID)
						.attr("type", type)
						.on('mouseover', function() {
							that.setFocus(id, type);
						})
						.on('mouseout', function() {
							that.unsetFocus();
						});


					var path = gLine.append("path")
						.attr("class", "line")
						.attr('stroke', color)
						.attr('fill', "none")
						.attr("stroke-width", 2)
						.attr("d", that.addLine(data));

					var totalLength = path.node().getTotalLength();



					path.attr("stroke-dasharray", totalLength + " " + totalLength)
					.attr("stroke-dashoffset", totalLength)
						.transition()
						.duration(that.trans)
						.attr("stroke-dashoffset", 0)
						.ease("linear")
						.attr("stroke-width", that.addStyle(pathID, data, type)).transition().duration(that.trans)
						.attr("stroke-width", that.addStyle2(pathID, data, type)).transition().duration(that.trans)
						.attr("stroke-width", 2)
						.attr("stroke-dashoffset", 0);



					//adding data points to line
					var datapoints = gLine.selectAll("circle")
						.data(data)
						.enter().append("g");

					datapoints.append("circle")
						.attr('class', 'dot')
						.attr('stroke', color)
						.attr('stroke-width', "2")
						.attr('cx', function(d) { return that.xScale(d.date); })
						.attr('cy', function (d) { return that.yScale0(scorePrecision === 0 ? Number(Math.round(d.yval)).toFixed(scorePrecision) : Number(d.yval).toFixed(scorePrecision)); })
						.on('mouseover', function(d) {
						    var tooltipText = '';
						    var yval = scorePrecision === 0 ? Number(Math.round(d.yval)).toFixed(scorePrecision) : Number(d.yval).toFixed(scorePrecision);
							if (showSecondTooltipLable) {
								tooltipText = '<b>' + name + '</b><br/>' +
									'<span style="color:' + color + '">\u25CF</span> ' + firstTooltipLableName + ': <b>' + yval + firstTooltipLableSuffix + '</b><br/>' +
									//'<span style="color:' + color + '">\u25CF</span> ' + //secondTooltipLableName + ': <b>' + d.zval + '</b><br/>' +
									'<span style="color:' + color + '">\u25CF</span> Date: <b>' + d.period + '</b><br/>';
							} else {
								tooltipText = '<b>' + name + '</b><br/>' +
									'<span style="color:' + color + '">\u25CF</span> ' + firstTooltipLableName + ': <b>' + yval + firstTooltipLableSuffix + '</b><br/>' +
									'<span style="color:' + color + '">\u25CF</span> Date: <b>' + d.period + '</b><br/>';
							}
							//alert(tooltipText);
							//add std error value to the tooltip. We always show stderr value if there is value for it, even if it's 0
							//i would prefer we can add this information on the tooltip during the StandardError() initialization,
							//  but since the tooltip belong to Line chart, i can't figure out a good way to separate the code below
							if (showStdErr && d.stderr !== "") {
								tooltipText += '<span style="color:' + color + '">\u25CF</span> Standard Error: <b>' + d.stderr + '</b><br/>';
							}
							tooltip.transition()
								.duration(200)
								.style("opacity", 0.9);
							tooltip.html(tooltipText)
								.style("left", (d3.event.offsetX ) + "px")
								.style("border-color", color)
								.style("top", (d3.event.offsetY - 75) + "px")
								.style("background-color", "#FFFFFF");
							d3.select(this)
								.classed('hover', true)
								.transition()
								.duration(400)
								.attr('r', circleRadius * 1.5)
								.transition()
								.duration(150)
								.attr('r', circleRadius * 1.25);
						})
						.on('mouseout', function() {
							tooltip.transition()
								.duration(500)
								.style("opacity", 0);
							d3.select(this)
								.classed('hover', false)
								.transition()
								.duration(150)
								.attr('r', circleRadius);
						})
						.transition()
						.delay(that.trans)
						.duration(500)
						.attr('r', circleRadius)
						.attr("stroke-width", 2);

					//show or not show the Standard Error
					//should we consider into separate this as it's own function ?
					if (showStdErr) {
						var separam = {
							type: "trend",
							xScale: that.xScale,
							yScale: that.yScale,
							svg: that.svg,
							obj: datapoints,
							r: circleRadius,
							scorePrecision: scorePrecision,
							color: color,
							linestyle: "solid"
						};
						var stderr = new StandardError(separam);
						stderr.draw();
					}
					that.updateStyle(data,type,id);

				}
			}
		},
		setFocus: function(id, type) {
			var that = this;
			_.each(that.svg.selectAll('g.gline')[0], function(line) {
				if (line.id === type.toString() + id.toString()) {
					line.parentNode.appendChild(line);
					if (showStdErr) {
						d3.select(line).selectAll('path.err').style('opacity', 1)
						.attr('stroke-width', "2");
					}
				} else {
					$(line).addClass('notActive');
					if (showStdErr) {
						d3.select(line).selectAll('path.err').style('opacity', 0);
					}
				}
			});
		},
		unsetFocus: function() {
			d3.select(elem).selectAll('g.gline').classed('notActive', false);
			if (showStdErr) {
				//reset the the standard error back to transparent
				d3.select(elem).selectAll('path.err').style('opacity', 0);
			}
		},

		/**
         * Add 'period' & 'date' element to singledata if and only if xval value is not null.
         * 'period' is used as the tooltip value in the dot. The data can be in format of YM (ex: "May 2016"), YW (ex: "May 1 - May 7"), or YMD (ex: "Apr 29, 2016").
         * 'date' is used to determine the x position of the dot when drawing it in line char.
         * @param {} singledata a single chunk of the data, ie: d
         * @param {} customDate input date from date picker
         * @returns {} singledata added 'period' & 'date' to singledata
         */
		setPeriodAndDate: function(singledata, customDate) {
			var that = this;
			var period, momentDate, startOfWeekMomentDate, endOfWeekMomentDate, overwriteMomentDate;
			var startOfYw, endOfYw;
			if (!!singledata.xval) {
				switch (singledata.breakdowntype) {
					case "YW":
						that.xAxisAddTicks = 0;
					//USIF-322, we want to overwrite the beginning of the week or the end of the week to user input date
					momentDate = moment(singledata.breakdown.substring(0, 2) + ' ' + singledata.xval, "YY MMM D");
					startOfWeekMomentDate = momentDate.startOf('week').format('MMM D');
					endOfWeekMomentDate = momentDate.endOf('week').format('MMM D');

					if (customDate && customDate.startDate && customDate.startDate > momentDate.startOf('week').toDate()) {
						startOfYw = moment(customDate.startDate).format('MMM D');
					} else {
						startOfYw = startOfWeekMomentDate;
					}
					if (customDate && customDate.endDate && customDate.endDate < momentDate.endOf('week').toDate()) {
						endOfYw = moment(customDate.endDate).format('MMM D');
					} else {
						endOfYw = endOfWeekMomentDate;
					}
					if (startOfYw === endOfYw) {
						//if startOfYw match the endOfYw, then assign overwriteMomentDate variable to startOfYw (or endOfYw the same too),
						// so that when 'date' is added, we use the adjusted one (i.e not always the end of the week like the value of xval)
						period = startOfYw;
						if (endOfYw === startOfWeekMomentDate) //only assign overwrite value when the custom end date is custom input
							overwriteMomentDate = moment(singledata.breakdown.substring(0, 2) + ' ' + startOfYw, "YY MMM D");
					} else {
						period = startOfYw + ' - ' + endOfYw;
					}
					break;
				case "YM":
					momentDate = moment(singledata.breakdown.substring(0, 2) + ' ' + singledata.xval, "YY MMM");
					period = momentDate.format('MMMM YYYY');
					that.dateAxisFormat = "%b %Y";
					break;
				default: //YMD
					momentDate = moment(singledata.breakdown.substring(0, 2) + ' ' + singledata.xval, "YY MMM D");
					period = momentDate.format('MMM D, YYYY');
					break;
				}
				//assign period & date
				singledata.period = period;
				if (!!overwriteMomentDate) {
					singledata.date = d3.time.format("%b %e %y").parse(overwriteMomentDate.format("MMM D YY"));
				} else {
					singledata.date = d3.time.format("%b %e %y").parse(momentDate.format("MMM D YY"));
				}
			}
			return singledata;
		},

		GenerateEmptyLineChart: function() {
			var that = this;
			var emptyDataColors = applicationEmptyDataColors.slice();

			var lineData = [0, that.h * 0.25, that.h * 0.51, that.h * 0.75, that.h];
			var yLineScale = d3.scale.linear()
				.range([0, that.h]); //that.h
			yLineScale.domain([lineData[0], lineData[4]]);

			that.svg.selectAll('g.gline').each(function() {
				$(this).remove();
			});

			that.svg.append("rect")
				.attr("width", that.w)
				.attr("height", that.h)
				.attr("fill", emptyDataColors[3]);

			svg.append('text')
				.attr("id", "idtextline")
				.attr("dx", that.w / 2)
				.attr("dy", that.h / 2)
				.attr("text-anchor", "middle")
				.attr("fill", emptyDataColors[0])
				.text("No Data to Display");

			svg.append("g")
				.attr("class", "horizGrid")
				.selectAll("line.horizontalGrid").data(lineData).enter()
				.append("line")
				.attr({
					"class": "horizontalGrid",
					"x1": 0,
					"x2": that.w,
					"y1": function(d) { return yLineScale(d); },
					"y2": function(d) { return yLineScale(d); },
					"stroke-dasharray": function(d) { return "3, 3"; }
				});
		}
	};
};
