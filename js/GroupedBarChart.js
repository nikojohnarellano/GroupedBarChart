/**
 * Create GroupedBarChart object
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

var GroupedBarChart = function(param)
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
        x1Scales : null,
        xAxis: null,
        yScale: null,
        yAxis: null,
        zScale: null,
        zAxis: null,
        addLine: null,
        dateFormatString: null,
        dataLength: null,
        /**
         * Does some processing for json data. Groups year-months together or year-month-days together.
         * Takes the aggregate z-axis values and average y-axis values for each group.
         * @param data - parsed data from input json
         * @returns processed data
         */
        setGroupedBarChartData : function(data)
        {
            var values;
            var that = this;
            var sort = data[0].breakdowntype !== "STRING";
            if (data[0].breakdowntype == "STRING")
            {
              values = _.map(data, function(d) {
                var data_value = {};

                data_value.xval = d.xval;
                data_value.yval = d.yval;
                data_value.name = d.name;

                // Only add zval into the data object if there is a zval
                if(d.zval !== undefined) {
                  data_value.zval = d.zval;
                }

                return data_value;
              });
            }
            else if (data[0].breakdowntype == "YW")
            {
              values = _.map(data, function(d) {
                var data_value = {};

                data_value.xval = that.toDate(d.xval).format("MMM DD YYYY");
                data_value.yval = d.yval;
                data_value.name = d.name;

                // Only add zval into the data object if there is a zval
                if(d.zval !== undefined) {
                  data_value.zval = d.zval;
                }

                return data_value;
              });
            }
            else if (data[0].breakdowntype == "YM")
            {

            }
            else
            {
              // Ask about YW
            }

            return sort ? _.sortBy(values, function(d) {
              return that.toDate(d.xval) - 0;
            }) : values;
        },
        initChart : function(data) {
          var that     = this;

          //get unique xvals from the data, these are the main categories. they make up the x0 domain
          //use pluck and unique
          var mainCategories = _.uniq(_.pluck(data, 'xval'));
          console.log(mainCategories);

          var maxY = _.max(_.pluck(data, 'yval'));
          console.log(maxY);

          //get the max number of subcategories, or count the number of names in  each
          //
          //maybe later  make it dynamic (3 instead of four)
          var subCategories = _.uniq(_.pluck(data, 'name'));
          console.log(subCategories);
          //colors
          var c = d3.scale.category20c();
          var y = d3.scale.linear()
                  .domain([0, 100])
                  .range([that.h, 0]);
          var x0 = d3.scale.ordinal()
                  .domain(mainCategories.map(function(d){console.log(d); return d;}))
                  .rangeBands([0, that.w], 0.5);
          console.log(x0.range());

          var x1 = d3.scale.ordinal()
            .domain(subCategories.map(function(d,i){console.log(d); return d;}))
            .rangeBands([0, x0.rangeBand()]);


          /*Axis stuff.*/

          console.log(x1.range());
          var xAxis = d3.svg.axis()
            .scale(x0)
            .orient("bottom");
          var yAxis = d3.svg.axis()
              .scale(y)
              .orient("left");
        svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);
          svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + that.h + ")")
            .call(xAxis);
        console.log(data);

        /*Transitionn Functions*/
        /*Enter the data into the dom*/
        var barsAnimationTime = 1000;
        svg.append("g").selectAll("g")
          .data(mainCategories)
          .enter().append("g")
            .attr("transform", function(d) { return "translate(" + x0(d) + ",0)"; })
          .selectAll("rect")
            .data(function(d){ return _.where(data, {xval: d});})
            .enter().append("rect")
              .attr("x", function(d, i) { return x1(d.name); })
              .attr("y", that.h)
              .attr("width", x1.rangeBand())
              .attr("height", 0)
              .attr("fill", function(d, i) { return c(_.indexOf(data, d)); })
              // The transition produces a bouncing effect for the bar
              .transition()
                // Each bar will be delayed depending on its position in the graph
                .delay(function(d, i) { return  _.indexOf(data, d) * 50;} )
                .duration(barsAnimationTime/3)
                // Expand height first (bounce effect)
                .attr('y', function(d) { return y(d.yval) - 50; })
                .attr('height', function(d) { return (that.h - y(d.yval)) + 50 ;})
                  .transition()
                  .duration(barsAnimationTime/3)
                  // Lower the height after (bounce effect)
                  .attr('y', function(d) { return y(d.yval) + 15; })
                  .attr('height', function(d) { return that.h - y(d.yval) - 15; })
                    .transition()
                    .duration(barsAnimationTime/3)
                    // Turn back to original height
                    .attr('y', function(d) { return y(d.yval); })
                    .attr('height', function(d) { return that.h - y(d.yval); });


                    /*Data point funcitons*/
                    var c_mouseover = function(d){
                      d3.select(this)
                          .classed('hover', true)
                          .transition()
                          .duration(400)
                          .attr('r', 5 * 1.5)
                          .transition()
                          .duration(150)
                          .attr('r', 5 * 1.25);
                    };

                    var c_mouseout = function(d){
                      d3.select(this)
                          .classed('hover', false)
                          .transition()
                          .duration(150)
                          .attr('r', 5);
                    };

                    that.addLine = d3.svg.line()
                        .x(
                            function(d)
                            {
                                return x0(d.x0) + x1(d.x1) + x1.rangeBand()/2 ;
                            })
                        .y(
                            function(d)
                            {
                                return y(d.y);
                            });

                    function createLineData(arrY, arrX0, arrX1){
                      var lineData = [];
                      var size = Math.max(arrY.length, arrX0.length, arrX1.length);
                      for (var i = 0; i < size; i++) {
                        var object= {
                          "x0": arrX0[i],
                          "x1": arrX1[0],
                          "y": arrY[i]
                        };
                        if(_.values(object).length==3)
                          lineData.push(object);
                      }
                      return lineData;
                    }//end of functions

                    /*data point data*/
                    var circleAniminationTime = 500;
                    var lineanimationTime = 1000;
                    var lineData = _.map(_.where(data, {name: "Total Average"}), function(d){
                      return {
                        x0: d.xval,
                        x1: d.name,
                        y:d.yval
                      };
                    });


                    /*Data Point render*/
                    var gLine = that.svg.call(responsivefy)
                        .append("g")
                        .attr("class", "gline");

                    /*Line stuff.*/
                    var path = gLine.append("path")
                      .attr("class", "line")
                      .attr('fill', "none")
                      .attr("stroke-width", 2)
                      .attr("d", that.addLine(lineData))
                      .data(lineData);

                    var totalLength = path.node().getTotalLength();
                    path.attr("stroke-dasharray", totalLength + " " + totalLength)
                        .attr("stroke-dashoffset", totalLength)
                        .transition("Line")
                        .delay(barsAnimationTime+circleAniminationTime)
                        .duration(lineanimationTime)
                        .attr("stroke-dashoffset", 0)
                        .each(function (d, i){
                          d3.select(this).attr('stroke', function(d){
                            var i =_.indexOf(data, _.findWhere(data,{xval:d.x0, name:d.x1 }));
                            return c(i);
                          });
                        })
                        .ease("linear")
                        .attr("stroke-width", 2)
                        .attr("stroke-dashoffset", 0);

                      var datapoints = gLine.selectAll("circle")
                          .data(lineData)
                          .enter().append("circle")
                          //.attr('class', 'dot')
                          .attr('stroke', function(d, i){return "white";})
                          .attr('stroke-width', "0.5")
                          .on('mouseover',c_mouseover)
                          .on('mouseout',c_mouseout)
                          .on('click',function(){console.log("cirle onlick");})
                          .attr('cx', function(d) { return x0(d.x0) + x1(d.x1) + x1.rangeBand()/2;})
                          .attr('cy', function (d) { return y(d.y); })
                          .attr("fill", function(d){
                            var i =_.indexOf(data, _.findWhere(data,{xval:d.x0, name:d.x1 }));
                            return c(i);
                          })
                          .transition().delay(function(d, i) {return barsAnimationTime + 50 + (i * 50);})
                            //.delay(function(d, i){return i * (1000 / (dataLength - 1));}
                            // Each bar will be delayed depending on its position in the graph
                            .duration(circleAniminationTime/2)
                            // Expand height first (bounce effect)
                            .attr('r', 5)
                            .attr('cy', function (d) { return y(d.y) - 30; })
                            .transition()
                            .duration(circleAniminationTime/2)
                            // Lower the height after (bounce effect)
                            .attr('cy', function (d) { return y(d.y);});
                              // Turn back to original height

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
        }
    };
  };
