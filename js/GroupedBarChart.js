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
        setGroupedBarChartData(data)
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

        }
    };
  }
