//Global variables
//This array contains the colors to be used application wide, use them in order 0,1,2,3
var applicationColors = ["#F5A623", "#00ADF3", "#00975E", "#616161", "#AE53C0", "#FF7152", "#D22F43", "#50E3C2", "#FFD92F", "#A0E254", "#550000", "#FFAAAA", "#E55F95", "#AA3939", "#304E0E", "#FFF297", "#70AF28", "#E1F35A", "#121212", "#F57323", "#8B572A", "#4745FF", "#4AE0FF", "#BDF7F7", "#6900C4"];
//This array contains the colors to be used when selecting, graying out or disable an elements. Use the same index of "applicationColors"
var applicationColorsGrayout = ["#AB7318", "#0078A9", "#006941", "#434343", "#793986", "#B24E39", "#92202E", "#379E87", "#B29720", "#6F9D3A", "#3B0000", "#B27676", "#9F4268", "#762727", "#213609", "#B2A869", "#4E7A1B", "#9DA93E", "#0C0C0C", "#AB5018", "#613C1D", "#3130B2", "#339CB2", "#83ACAC", "#490088"];
var chartsColors = ["#D22F43", "#616161", "#40DB86"]; //In order: Positive, Neutral, Negative
var npsColors = ["#D22F43", "#FEEF53", "#40DB86"]; //In order: Positive, Neutral, Negative
var applicationEmptyDataColors = ["#ACACAC", "#C8C8C8", "#E5E5E5","#F3F3F3"]; //No Data Display Chart colors
 
if ($(document) !== null) {
	jQuery(function($) {
		$(document).ready(function() {
			$('.slideout-menu-toggle').on('click', function(event) {
				event.preventDefault();
				// create menu variables
				var slideoutMenu = $('.slideout-menu');
				var slideoutMenuWidth = $('.slideout-menu').width();

				// toggle open class
				slideoutMenu.toggleClass("open");

				// slide menu
				if (slideoutMenu.hasClass("open")) {
					slideoutMenu.animate({
						right: "0px"
					});
				} else {
					slideoutMenu.animate({
						right: -slideoutMenuWidth
					}, 250);
				}
			});
		});
	});
}

    
// Make D3 charts responsive
function responsivefy(svg) {
	//get container + svg aspect ratio
	var container = d3.select(svg.node().parentNode),
		    width = parseInt(svg.style('width')),
		    height = parseInt(svg.style('height')),
		    aspect = width / height;

	// add viewBox and preserveAspectRation properties,
	// and call resize so that svg resizes on initial page load
	svg.attr('viewBox', '0 0 ' + width + ' ' + height)
			.attr('preserveAspectRatio', 'xMinYMid')
			.call(resize);

	// to register multiple listeners for same event type,
	// you need to add namespace, i.e., 'click.foo'
	// necessary if you call invoke this function for multiple svgs
	// api docs: https://github.com/mbostock/d3/wiki/Selections#on
	d3.select(window).on('resize.' + container.attr('id'), resize);

	// get width of container and resize svg to fit it
	function resize() {
		var targetWidth = parseInt(container.style('width'));
		svg.attr('width', targetWidth);
		svg.attr('height', Math.round(targetWidth / aspect));
	}
}
