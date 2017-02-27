/**
 * Create barLineChart object
 * @param {Object} param - an object with the following fields:
 *                          {number} width - the width of the svg element
 *                          {number} height - the height of the svg element
 *                          {string} elem - selector for the element to append the svg element to
 *                          {string} chartTitle - title for the chart
 *                          {string} xAxisLabel - label for the x-Axis
 *                          {string} yAxisLabel - label for the y-Axis
 *                          {string} zAxisLabel - label for the z-Axis
 *                          {object} margin - object with the following fields:
 *                              {number} top - top margin
 *                              {number} right - right margin
 *                              {number} bottom - bottom margin
 *                              {number} left - left margin
 */
var barLineChart = function(param)
{
    var width = param.width;
    var height = param.height;
    var elem = param.elem;
    var chartTitle = param.chartTitle;
    var xAxisLabel = param.xAxisLabel;
    var yAxisLabel = param.yAxisLabel;
    var zAxisLabel = param.zAxisLabel;
    var tooltipTitle = param.tooltipTitle;
    var margin = { top: 57, right: 57, bottom: 57, left: 57 };

    var svg = d3.select(elem)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .call(responsivefy)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var tooltip = d3.select(elem).append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    return {
        h: height - margin.top - margin.bottom,
        w: width - margin.left - margin.right,
        svg: svg,

        xScale: null,
        xAxis: null,
        yScale: null,
        yAxis: null,
        zScale: null,
        zAxis: null,
        addLine: null,
        dateFormatString: null,
        dataLength: null,

        /**
         * Set the scales for the chart based on the data and it's domain
         * @param {number[]} xDom - array of two numbers representing min and max values of the x domain
         * @param {number[]} yDom - array of two numbers representing min and max values of the y domain
         * @param {number[]} zDom - array of two numbers representing min and max values of the z domain
         * @param data - parsed data from the input json
         */
        setScales: function(xDom, yDom, zDom, data)
        {
            var that = this;

            if (that.isDate(data[0].xval)) // if data is date-based, generate an ordinal scale based it's values
            {
                var dates = _.sortBy(_.uniq(_.map(data,
                    function(d)
                    {
                        return that.toDate(d.xval);
                    }
                )),
                    function(d)
                    {
                        return d - 0;
                    }
                );

                var dateStrings = _.uniq(_.map(dates,
                    function(d)
                    {
                        return moment(d).format(that.dateFormatString);
                    }
                ));


                that.xScale = d3.scale.ordinal();
                that.xScale.domain(dateStrings)
                    .rangeBands([0, that.w], 0.5, 0.1);
            }
            else
            {
                that.xScale = d3.scale.linear();
                that.xScale.range([0, that.w])
                    .domain([xDom[0], xDom[1]]);
            }

            that.yScale = d3.scale.linear();
            that.zScale = d3.scale.linear();

            // line chart values < 0 should start at the next nearest ten to provide a buffer
            var yFactorLow = Math.floor(Math.log10(yDom[0])) - 1;
            var yFactorHigh = Math.floor(Math.log10(yDom[1])) - 1;
            var xFactor = Math.floor(Math.log10(zDom[1])) - 1;

            that.yScale.range([that.h, 0])
                .domain([(yDom[0] < 0) ? Math.ceil(((yDom[0] * -1) + 1) / 10) * -10 : yDom[0], Math.ceil((yDom[1] + 1) / 10) * 10]);

            // bar chart should start at 0 even if the lowest value in the dataset is not 0
            var zDom_bottom = zDom[0] > 0 ? 0 : zDom[0];

            // create buffer for bar chart max value
            that.zScale.range([that.h, 0])
                .domain([zDom_bottom, Math.ceil((zDom[1] + Math.pow(10, xFactor - 1)) / Math.pow(10, xFactor)) * Math.pow(10, xFactor)]);

            that.xAxis = d3.svg.axis()
                .scale(that.xScale)
                .orient("bottom");

            that.yAxis = d3.svg.axis()
                .scale(that.yScale)
                .orient("right");

            that.zAxis = d3.svg.axis()
                .scale(that.zScale)
                .orient("left");
        },

        /**
         * Initializes the chart. Sets the scales and generates the axes and grid lines.
         * @param {number[]} xDom - array of two numbers representing min and max values of the x domain
         * @param {number[]} yDom - array of two numbers representing min and max values of the y domain
         * @param {number[]} zDom - array of two numbers representing min and max values of the z domain
         * @param data - parsed data from the input json
         */
        initChart: function(xDom, yDom, zDom, data)
        {
            var that = this;

            that.setScales(xDom, yDom, zDom, data);

            var xAxisClass = (isNaN(xDom[0])) ? "x axis slanted" : "x axis";

            that.svg
                .append("g")
                .attr("class", xAxisClass)
                .attr("transform", "translate(0," + that.h + ")")
                .call(that.xAxis);

            that.svg
                .append("g")
                .attr("class", "z axis")
                .call(that.zAxis);

            that.svg
                .append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + that.w + ", 0)")
                .call(that.yAxis);

            if (chartTitle !== undefined)
            {
                that.svg
                    .append("text")
                    .attr("class", "title")
                    .attr("text-anchor", "middle")
                    .text(chartTitle)
                    .attr("transform", "translate(" + margin.left + "," + (-margin.top / 2) + ")");
            }

			if (xAxisLabel.length > 20){
				xAxisLabel = xAxisLabel.substring(0,20);
			}

            if (xAxisLabel !== undefined)
            {

                that.svg
                    .append("text")
                    .attr("class", "x axis label")
                    .attr("text-anchor", "middle")
                    .text(xAxisLabel)
                    .attr("transform", "translate(" + (that.w / 2) + "," + (that.h + 55) + ")");
            }

            if (zAxisLabel !== undefined)
            {
                that.svg
                    .append("text")
                    .attr("class", "z axis label")
                    .attr("text-anchor", "middle")
                    .text(zAxisLabel)
                    .attr("transform", "translate(" + -45 + "," + (that.h / 2) + ") rotate(-90)");
            }

            if (yAxisLabel !== undefined)
            {
                that.svg
                    .append("text")
                    .attr("class", "y axis label")
                    .attr("text-anchor", "middle")
                    .text(yAxisLabel)
                    .attr("transform", "translate(" + (that.w  + 45) + "," + (that.h / 2) + ") rotate(90)");
            }


            that.svg.append("g")
                .attr("class", "horizGrid")
                .selectAll("line.horizontalGrid").data(_.filter(that.zScale.ticks(), function(num){ return num !== 0})).enter()
                .append("line")
                .transition()
                .duration(500)
                .attr(
                {
                    "class": "horizontalGrid",
                    "x1": 0,
                    "x2": that.w,
                    "y1": function(d) { return that.zScale(d); },
                    "y2": function(d) { return that.zScale(d); },
                    "stroke-dasharray": function(d) { return "3, 3"; }
                });

            that.addLine = d3.svg.line()
                .x(
                    function(d)
                    {
                        return that.xScale(that.toDate(d.xval).format(that.dateFormatString)) + (that.xScale.rangeBand()/2);
                    })
                .y(
                    function(d)
                    {
                        return that.yScale(d.yval);
                    });
        },

        /**
         * Helper function. Deletes old bar elements after they are shrunk to zero (For animation pruposes, the bars are shrunk to zero instead of being instantly removed).
         */
        deleteGarbage: function()
        {
            d3.selectAll(".toBeDeleted").remove();
        },

        /**
         * Updates the chart based on the data passed in.
         * @param data - parsed data from input json
         * @param {string} lineColor - hex color code for the line
         * @param {string} barColor - hex color code for the bars
         */
        updateChart: function(data, lineColor, barColor)
        {
            var barColorCode = barColor;
            var lineColorCode = lineColor;
            dataLength = data.length;

            if (data.length > 0)
            {
                var that = this;

                if (!d3.selectAll(".bars").empty())
                {
                    var xDom = d3.extent(data, function(d) { return d.xval;});
                    var yDom = d3.extent(data, function(d) { return d.yval;});
                    var zDom = d3.extent(data, function(d) { return d.zval;});

                    that.setScales(xDom, yDom, zDom, data);

                    svg.selectAll(".x.axis")
                        .transition()
                        .duration(1000)
                        .call(that.xAxis);

                    svg.selectAll(".y.axis")
                        .transition()
                        .duration(1000)
                        .call(that.yAxis);

                    svg.selectAll(".z.axis")
                        .transition()
                        .duration(1000)
                        .call(that.zAxis);

                    svg.selectAll(".bars")
                        .transition()
                        .duration(500)
                        .attr("height", 0)
                        .attr("y", that.h)
                        .attr("class", "bars toBeDeleted")
                        .each("end", that.deleteGarbage);

                    svg.selectAll("circle").remove();
                    svg.selectAll(".gline").remove();

                    svg.selectAll("line.horizontalGrid")
                        .data(that.zScale.ticks()).enter()
                        .append("line")
                        .attr(
                        {
                            "class": "horizontalGrid",
                            "x1": 0,
                            "x2": that.w,
                            "y1": that.h,
                            "y2": that.h,
                            "stroke-dasharray": function(d) { return "3, 3"; }
                        });


                    svg.selectAll("line.horizontalGrid")
                        .transition()
                        .duration(500)
                        .attr(
                        {
                            "class": "horizontalGrid",
                            "x1": 0,
                            "x2": that.w,
                            "y1": function(d) { return that.zScale(d); },
                            "y2": function(d) { return that.zScale(d); },
                            "stroke-dasharray": function(d) { return "3, 3"; }
                        });

                    svg.selectAll("line.horizontalGrid")
                        .data(that.zScale.ticks())
                        .exit()
                        .remove();
                }

                var bars = that.svg.append("g")
                    .attr("class", "bars")
                    .selectAll("bars.rect")
                    .data(data)
                    .enter()
                    .append("rect")
                    .attr("class", "bars")
                    .attr("x",
                        function(d)
                        {
                            return that.xScale(that.toDate(d.xval).format(that.dateFormatString));
                        })
                    .attr("y", that.h)
                    .attr("height", 0)
                    .on('mouseover',
                        function(d)
                        {
                            var tooltipText = '';
                            var xvalText = that.toDate(d.xval).format(that.dateFormatString);
                            var zvalText = d.zval;

                            if (xAxisLabel !== undefined)
                            {
                                tooltipText = "<strong>" + xAxisLabel + ": </strong>";
                            }

                            tooltipText += xvalText + '<br/>';

                            if (zAxisLabel !== undefined)
                            {
                                tooltipText += "<strong>" + zAxisLabel + ": </strong>";
                            }

                            tooltipText += zvalText;

                            tooltip.transition()
                                .duration(200)
                                .style("opacity", 0.9)
                                .style("border-color", barColorCode);
                            tooltip.html(tooltipText)
                                .style("border-color", "#c3c3c3")
                                .style("background-color", "#FFFFFF")
								.style("left", (d3.event.offsetX ) + "px")
								.style("top", (d3.event.offsetY - 75) + "px");
                        })
                    .on('mouseout',
                        function()
                        {
                            tooltip.transition()
                                .duration(500)
                                .style("opacity", 0);
                        })
                    .transition()
                    .duration(1000)
                    .attr("y",
                        function(d)
                        {
                            return that.zScale(d.zval);
                        })
                    .attr("width", that.xScale.rangeBand())
                    .attr("height",
                        function(d)
                        {
                            return that.h - that.zScale(d.zval);
                        });

                var gLine = that.svg.call(responsivefy)
                    .append("g")
                    .attr("class", "gline");

                var path = gLine.append("path")
                    .attr("class", "line")
                    .attr('stroke', lineColor)
                    .attr('fill', "none")
                    .attr("stroke-width", 2)
                    .attr("d", that.addLine(data));

                var totalLength = path.node().getTotalLength();

                path.attr("stroke-dasharray", totalLength + " " + totalLength)
                    .attr("stroke-dashoffset", totalLength)
                    .transition()
                    .duration(1000)
                    .attr("stroke-dashoffset", 0)
                    .ease("linear")
                    .attr("stroke-width", 2)
                    .attr("stroke-dashoffset", 0);

                var datapoints = gLine.selectAll("circle")
                    .data(data)
                    .enter().append("g");

                datapoints.append("circle")
                    .attr('class', 'dot')
                    .attr('stroke', lineColor)
                    .attr('stroke-width', "2")
                    .on('mouseover',
                        function(d)
                        {
                            var tooltipText = '';
                            var xvalText = that.toDate(d.xval).format(that.dateFormatString);
                            var yvalText = d.yval;

                            if (xAxisLabel !== undefined)
                            {
                                tooltipText = "<strong>" + xAxisLabel + ": </strong>";
                            }

                            tooltipText += xvalText + '<br/>';

                            if (yAxisLabel !== undefined)
                            {
                                tooltipText += "<strong>" + yAxisLabel + ": </strong>";
                            }

                            tooltipText += yvalText;

                            tooltip.transition()
                                .duration(200)
                                .style("opacity", 0.9)
                                .style("border-color", lineColorCode);
                            tooltip.html(tooltipText)
                                .style("left", (d3.event.offsetX) + "px")
                                .style("border-color", "#c3c3c3")
                                .style("top", (d3.event.offsetY - 75) + "px")
                                .style("background-color", "#FFFFFF");
                            d3.select(this)
                                .classed('hover', true)
                                .transition()
                                .duration(400)
                                .attr('r', 5 * 1.5)
                                .transition()
                                .duration(150)
                                .attr('r', 5 * 1.25);
                        })
                    .on('mouseout',
                        function()
                        {
                            tooltip.transition()
                                .duration(500)
                                .style("opacity", 0);
                            d3.select(this)
                                .classed('hover', false)
                                .transition()
                                .duration(150)
                                .attr('r', 5);
                        })
					.on('click',
						function(d)
						{
							var xvalText = that.toDate(d.xval).format(that.dateFormatString);
                            var yvalText = d.yval;
							var text = "dot clicked: ";
							text = text + "Date: " + xvalText;
							text = text + ", Value: " + yvalText;

							d3.select("#clickInfo").html(text);
						})
                    .transition()
                    .duration(1000)
                    .delay(
                        function(d, i)
                        {
                            return i * (1000 / (dataLength - 1));
                        }
                    )
                    .attr('r', 5)
                    .attr("stroke-width", 2)
                    .attr('cx', function(d) { return that.xScale(that.toDate(d.xval).format(that.dateFormatString)) + (that.xScale.rangeBand()/2); })
                    .attr('cy', function (d) { return that.yScale(d.yval); });
            }
        },

        /**
         * Checks if a string represents a date
         * @param {string} the string to check
         * @returns {bool} whether the string is a date or not
         */
        isDate: function(data)
        {
            var dateFormat = "MMM-DD-YYYY";
            return moment(data, dateFormat, false).isValid();
        },

        /**
         * Returns a date object for a string
         * @param {string} the string to get a date for
         * @returns {object} a date object representing the string
         */
        toDate: function(date)
        {
            var dateFormat = "MMM-DD-YYYY";
            return moment(date, dateFormat, false);
        },

        /**
         * Does some processing for json data. Groups year-months together or year-month-days together.
         * Takes the aggregate z-axis values and average y-axis values for each group.
         * @param data - parsed data from input json
         * @returns processed data
         */
        setBarLineChartData : function(data)
        {
            var that = this;

            var unsortedValues;

            if (data[0].breakdowntype == "YM")
            {
                that.dateFormatString = "MMM YYYY";
                unsortedValues = _.map( _.groupBy(data,
                function(d)
                {
                    return that.toDate(d.xval).format("MMM YYYY");
                }),
                function(d)
                {
                    return {
                        xval: that.toDate(d[0].xval).format("MMM YYYY"),
                        yval: _.reduce(_.map(d,
                            function(d)
                            {
                                return d.yval;
                            }),
                            function(memo, num)
                            {
                                return memo + num;
                            },
                            0) / d.length,
                        zval: _.reduce(_.map(d,
                            function(d)
                            {
                                return d.zval;
                            }),
                            function(memo, num)
                            {
                                return memo + num;
                            },
                            0)
                    };
                });
            }
            else if (data[0].breakdowntype == "YMD")
            {
                that.dateFormatString = "MMM DD YYYY";
                unsortedValues = _.map( _.groupBy(data,
                function(d)
                {
                    return that.toDate(d.xval).format("MMM DD YYYY");
                }),
                function(d)
                {
                    return {
                        xval: that.toDate(d[0].xval).format("MMM DD YYYY"),
                        yval: _.reduce(_.map(d,
                            function(d)
                            {
                                return d.yval;
                            }),
                            function(memo, num)
                            {
                                return memo + num;
                            },
                            0) / d.length,
                        zval: _.reduce(_.map(d,
                            function(d)
                            {
                                return d.zval;
                            }),
                            function(memo, num)
                            {
                                return memo + num;
                            },
                            0)
                    };
                });
            }
            else if (data[0].breakdowntype == "YW")
            {

            }
            else
            {

            }

            return _.sortBy(unsortedValues,
                function(d)
                {
                    return that.toDate(d.xval) - 0;
                });

        }
    };
};
