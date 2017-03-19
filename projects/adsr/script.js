---
# // adapted from original SuperCollider code
---
/**
 * TODO
 * display pitch and timbre inline--and only if there is a change (or make that optional)
 * bounding boxes for phrases? make optional setting?
 * dynamics
 * articulation
 * rehearsal letters
 * show bar lengths?
 * show second ticks?
 * tie, ghost notes
 * x notehead
 * bartok pizz symbol
 * double bar
 * error-check if score height exceeds view
 */
var score = {
        width: 8000
    },
    unit = 10,
    // calculated in resize()
    view = {
        width: 0,
        height: 0,
        center: 0
    },
    // TODO allow numParts to be set from settings
    numParts = +VS.getQueryString("parts") || 4,
    debug = false;

// symbol dictionary
{% include_relative _symbols.js %}

// generate score
{% include_relative _score.js %}

var main = d3.select(".main")
    .attr("width", score.width);

var scoreGroup = main.append("g");

// create placeholder barlines

var layoutGroup = scoreGroup.append("g");

layoutGroup.selectAll("line")
    .data(score.bars)
    .enter()
    .append("line")
        .attr("x1", 0)
        .attr("y1", 3 * unit)
        .attr("x2", 0)
        .attr("y2", (numParts * 12 * unit) + (6 * unit))
    .style("stroke", "black")
    .style("stroke-opacity", "0.25")
    .attr("transform", function(d) {
        var x = (score.width * d) / score.totalDuration,
            y = 0;
        return "translate(" + x + ", " + y + ")";
    });

for (p = 0; p < numParts; p++) {
    var thisPart = parts[p];
    var partGroup = scoreGroup.append("g"); // part group
    var partYPos = (p + 1) * 12 * unit;

    // for each phrase, create a group around a timePoint
    partGroup.selectAll("g")
        .data(score.bars)
        .enter()
        .append("g")
        .attr("transform", function(d, i) {
            var timeDispersion = part[i].timeDispersion,
                x = ((score.width * d) / score.totalDuration) + (VS.getItem([-1, 1]) * timeDispersion * unit), // TODO +/- timeDispersion
                y = partYPos;
            return "translate(" + x + ", " + y + ")";
        })
        // add phrase content
        .each(function(d, i) {
            var durations = thisPart[i].durations;
            d3.select(this).append("text")
                .text(function() {
                    var lo = thisPart[i].pitch.low,
                        hi = thisPart[i].pitch.high;
                    return "\uec82 " + pitchDict[lo] + ( (lo !== hi) ? (" – " + pitchDict[hi]) : "" ) + " \uec83";
                })
                .classed("pitch-range", true)
                .attr("y", -3 * unit);
            d3.select(this).append("text")
                .text(thisPart[i].timbre)
                .classed("timbre", true)
                .attr("y", -5 * unit);
            d3.select(this).selectAll("rect") // TODO should selectAll text, although that is broken
                .data(durations)
                .enter()
                .append("text")
                    .text(function(d) { return durDict[d]; })
                    .classed("durations", true)
                    // TODO Make phrase spacing a named function, can be re-used.
                    // Since "durations" us not accessible here, find a way to pass that value
                    .attr("x", function(d, i) {
                        var upToI = durations.slice(0, i),
                            sum = upToI.reduce(function(a, b) {
                                return a + b + 1; // add padding between here
                            }, 0);
                        return sum * unit;
                    });
                // save this, could be an interesting setting to toggle
                // .append("rect")
                //     .attr("x", function(d, i) {
                //         var upToI = durations.slice(0, i),
                //             sum = upToI.reduce(function(a, b) {
                //             return a + b + 1; // add padding between here
                //         }, 0);
                //
                //         return sum * unit;
                //     })
                //     .attr("y", function(d, i) { return 0; })
                //     .attr("width", function(d) { return d * unit; })
                //     .attr("height", unit)
        });
}

function scrollScore(ndex, dur) {
    var thisBar = score.bars[ndex];
    scoreGroup
    .transition()
    .duration(dur)
    .attr("transform", function() {
        return "translate(" + (view.center + (-score.width * thisBar) / score.totalDuration) + "," +
            ((view.height * 0.5) - (scoreGroup.node().getBBox().height * 0.5) - (3 * unit))
            + ")";
    });
}
for(i = 0; i < score.bars.length; i++) {
    VS.score.add([score.bars[i] * 1000, scrollScore, (score.bars[i + 1] - score.bars[i]) * 1000]); // time, func, duration
}
VS.score.stopCallback = function(){ scrollScore(0, 300); };
VS.score.stepCallback = function(){ scrollScore(VS.score.pointer, 300); };

//
{% include_relative _debug.js %}
//

function resize() {
    view.width = parseInt(d3.select("main").style("width"), 10);
    view.center = view.width * 0.5;
    view.height = parseInt(d3.select("main").style("height"), 10);

    main.attr("height", view.height);

    if(debug){ resizeDebug(); }

    scrollScore(VS.score.pointer, 0);
}

resize();

d3.select(window).on("resize", resize);
