
/*The following looks to be a  memeber function
part of init chart*/

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

/*The following is part of "update chart" when the barchart is actually being drawn. The follwing line information comes after the rectangles have been drawn*/
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
    .attr('stroke', "blue"/*chnage this later*/)
    .attr('stroke-width', "2")
    .on('mouseover',function(){console.log("circle mouseover");})
    .on('mouseout',function(){ console.log("circle tooltop");})
    .on('click',function(){console.log("cirle onlick");});
