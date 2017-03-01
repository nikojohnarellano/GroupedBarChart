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
                values = _.groupBy(_.map(data,
                    function(d)
                    {
                      return {
                        xval : d.xval,
                        yval : d.yval,
                        zval : d.zval,
                        name : d.name
                      };
                    }),
                  function(d)
                  {
                    return d.xval;
                  });
            }
            else if (data[0].breakdowntype == "YMD")
            {
                values = _.groupBy(_.map(data,
                  function(d)
                  {
                    return {
                      xval : that.toDate(d.xval).format("MMM DD YYYY"),
                      yval : d.yval,
                      zval : d.zval,
                      name : d.name
                    };
                  }),
                  function(d)
                  {
                    return d.xval;
                  }  );
            }
            else if (data[0].breakdowntype == "YM")
            {
              values = _.groupBy(_.map(data,
                function(d)
                {
                  return {
                    xval : that.toDate(d.xval).format("MMM DD"),
                    yval : d.yval,
                    zval : d.zval,
                    name : d.name
                  };
                }),
                function(d)
                {
                  return d.xval;
                });
            }
            else
            {
              // Ask about YW
            }
            return sort ? _.sortBy(values,
                function(d)
                {
                    return that.toDate(d.xval) - 0;
                }) : values;
        },
        initChart : function(data) {
          var that = this;
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
          var z = d3.scale.category20c();
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

        svg.append("g").selectAll("g")
            .data(mainCategories)
            .enter().append("g")
              .attr("transform", function(d) { return "translate(" + x0(d) + ",0)"; })
            .selectAll("rect")
            .data(function(d){ return _.where(data, {xval: d});})
            .enter().append("rect")
              .attr("x", function(d) { return x1(d.name); })
              .attr("y", function(d) { return y(d.yval); })
              .attr("width", x1.rangeBand())
              .attr("height", function(d) { return that.h - y(d.yval); })
              .attr("fill", function(d, i) { return z(i); });
        }
    };
  };
