/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
	var data = {
    	labels: days,
	    datasets: [
	        {
	            fillColor: "rgba(255,76,54,0.2)",
	            strokeColor: "rgba(255,76,54,1)",
	            pointColor: "rgba(255,76,54,1)",
	            pointStrokeColor: "#fff",
	            pointHighlightFill: "#fff",
	            pointHighlightStroke: "rgba(220,220,220,1)",
	            data: visitors
	        },
	        {
	            fillColor: "rgba(53,93,128,0.2)",
	            strokeColor: "rgba(53,93,128,1)",
	            pointColor: "rgba(53,93,128,1)",
	            pointStrokeColor: "#fff",
	            pointHighlightFill: "#fff",
	            pointHighlightStroke: "rgba(151,187,205,1)",
	            data: hits
	        }
	    ]
	};
	var options = {
	    responsive: true,
	    animation: false
	};
	var taracot_statistics;
	if (visitors.length > 1) {
		taracot_statistics = new Chart($("#taracot_statistics").get(0).getContext("2d")).Line(data, options);
		var _mn = [];
		for (var i=0; i<months.length; i++) {
			_mn.push(months[i].month + ' ' + months[i].year);
		}
		$('#h2_stat').append(' (' + _mn.join(', ') + ')');
	} else {
		$('#taracot_stats_wrap').html(_lang_vars.no_stats_avail);
	}
});
