(function () {
  'use strict';

  const margin = {
    top: 64
  };

  const seconds = t => t * 1000;

  const pitchRange = 87;

  function pitchScale(value) {
    return (1 - value) * pitchRange;
  }

  function doubleBar(selection, height) {
    const g = selection.append("g");

    g.append("line")
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke-width", 1);

    g.append("line")
      .attr("x1", 3)
      .attr("x2", 3)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke-width", 2);

    return g;
  }

  const glyphs = {
    open: "\ue893",
    closed: "\ue890"
  };

  function cue(selection, type = "closed") {
    return selection
      .append("text")
      .attr("class", "bravura")
      .attr("text-anchor", "middle")
      .text(glyphs[type]);
  }

  const durations = VS.dictionary.Bravura.durations.stemless;

  function longTone(selection, x, y, length) {
    const group = selection.append("g");

    group.attr("transform", `translate(${x}, ${y})`);

    group
      .append("text")
      .attr("class", "bravura")
      .text(durations[4]);

    group
      .append("line")
      .attr("x1", "0.5em")
      .attr("x2", length);

    return group;
  }

  const { dynamics } = VS.dictionary.Bravura;

  function drawDynamics(data, scale, selection) {
    const g = selection.append("g");

    data.forEach(d => {
      const text = g.append("text").attr("x", d.x * scale);

      switch (d.x) {
        case 0:
          text.attr("text-anchor", "start");
          break;
        case 1:
          text.attr("text-anchor", "end");
          break;
        default:
          text.attr("text-anchor", "middle");
      }

      switch (d.type) {
        case "symbol":
          text
            .text(dynamics[d.value])
            .attr("class", "bravura")
            .attr("dy", "2em");
          break;
        case "text":
          text
            .text(d.value)
            .attr("class", "text-dynamic")
            .attr("dy", "3.5em");
          break;
      }
    });

    return g;
  }

  var startTimeFromDuration = (bar, i, score) => {
    // Calculate and set startTimes
    const startTime = score
      .slice(0, i)
      .reduce((sum, b, j) => sum + b.duration, 0);
    return { ...bar, startTime };
  };

  function DEPRECATED_translate(x, y, selection) {
    return selection.attr("transform", `translate(${x}, ${y})`);
  }

  function translate(selection, x, y) {
    return selection.attr("transform", `translate(${x}, ${y})`);
  }

  function makeIndicator(selection) {
    // TODO from dirge,,march AND ad;sr
    const indicator = selection
      .append("path")
      .attr("class", "indicator")
      .attr("d", "M-6.928,0 L0,2 6.928,0 0,12 Z")
      .style("stroke", "black")
      .style("stroke-width", "1")
      .style("fill", "black")
      .style("fill-opacity", "0");

    let x = 0;
    let y = 0;

    function translateX(_) {
      x = _;
      DEPRECATED_translate(x, y, indicator);
    }

    function translateY(_) {
      y = _;
      DEPRECATED_translate(x, y, indicator);
    }

    return {
      element: indicator,
      blinker: blinker(indicator),
      translateX,
      translateY
    };
  }

  function blinker(selection) {
    return VS.cueBlink(selection)
      .beats(3)
      .inactive(function(selection) {
        selection.style("fill-opacity", 0);
      })
      .on(function(selection) {
        selection.style("fill-opacity", 1);
      })
      .off(function(selection) {
        selection.style("fill-opacity", 0);
      })
      .down(function(selection) {
        selection.style("fill-opacity", 1);
      });
  }

  function makeScroll(selection) {
    const scroll = selection.append("g");

    let _center = null;
    let _y = 0;

    function setCenter(_) {
      _center = _;
    }

    function scrollTo(x, duration) {
      scroll
        .transition()
        .ease(d3.easeLinear)
        .duration(duration)
        .attr("transform", `translate(${_center - x},${_y})`);
    }

    function y(_) {
      _y = _;
    }

    return {
      element: scroll,
      setCenter,
      scrollTo,
      y
    };
  }

  function makePage(selection) {
    const page = selection.append("g");

    let _scale = 1;

    function scale(_) {
      _scale = _;
      page.attr("transform", `scale(${_scale})`);
    }

    return {
      element: page,
      scale
    };
  }

  function makeScrollingScore() {
    const svg = d3.select("svg.main");

    const page = makePage(svg);

    const scoreGroup = makeScroll(page.element);
    scoreGroup.y(margin.top);

    const indicator = makeIndicator(page.element);

    return {
      svg,
      page,
      scoreGroup,
      indicator
    };
  }

  function makeResize(
    svg,
    page,
    margin,
    pitchRange,
    indicator,
    scoreGroup,
    setScorePosition
  ) {
    return function() {
      VS.score.isPlaying() && VS.score.pause();

      const w = parseInt(svg.style("width"), 10);
      const h = parseInt(svg.style("height"), 10);

      const scale = h / (margin.top + pitchRange + margin.top);
      page.scale(scale);

      const center = (w / scale) * 0.5;
      indicator.translateX(center);
      scoreGroup.setCenter(center);
      setScorePosition();
    };
  }

  function makeScrollFunctions(scoreGroup, xValues) {
    function centerScoreByIndex(index, duration) {
      const x = xValues[index];
      scoreGroup.scrollTo(x, duration);
    }

    return {
      setScorePosition: function() {
        const index = VS.score.getPointer();
        centerScoreByIndex(index, 0);
      },
      scrollToNextBar: function(index, duration) {
        centerScoreByIndex(index + 1, duration);
      }
    };
  }

  function addHooks(setScorePosition) {
    VS.control.hooks.add("step", setScorePosition);
    VS.WebSocket.hooks.add("step", setScorePosition);

    VS.control.hooks.add("pause", setScorePosition);
    VS.WebSocket.hooks.add("pause", setScorePosition);

    VS.score.hooks.add("stop", setScorePosition);
  }

  const articulationGlyph = VS.dictionary.Bravura.articulations;
  const durationGlyph = VS.dictionary.Bravura.durations.stemless;

  function timeScale(t) {
    return t / 200;
  }

  const { svg, page, scoreGroup, indicator } = makeScrollingScore();

  svg.append("style").text(`
  line { stroke: black; }
  line.wip { stroke: blue; }
  text {
    font-size: 10px;
  }
  text.wip { fill: blue; }
  .bravura { font-family: 'Bravura'; font-size: 20px; }
  .text-dynamic {
    font-family: serif;
    font-size: 12px;
    font-style: italic;
  }
  .text-duration {
    font-size: 12px;
  }
`);

  const wrapper = scoreGroup.element;
  const group = (selection = wrapper) => selection.append("g");

  const cues = wrapper.append("g");
  const makeCue = (x, type) => cue(cues, type).attr("x", x);

  const text = (selection, str) => selection.append("text").text(str);
  const wip = (selection, str) => text(selection, str).attr("class", "wip");
  const bravura = (selection, str) =>
    text(selection, str).attr("class", "bravura");

  const durations$1 = translate(group(), 0, -24);
  const makeDuration = (x, duration) =>
    durations$1
      .append("text")
      .text(`${duration / 1000}"`)
      .attr("x", x)
      .attr("class", "text-duration");

  const score = [
    {
      duration: seconds(30),
      render: ({ x, length, duration }) => {
        const g = translate(group(), x, pitchScale(0.5));

        makeCue(x);
        makeDuration(x, duration);

        longTone(g, 0, 0, length);
        bravura(g, articulationGlyph[">"]).attr("dy", "0.5em");
        wip(g, '"th"').attr("dy", "2em");

        drawDynamics(
          [
            {
              type: "symbol",
              value: "mp",
              x: 0
            },
            {
              type: "text",
              value: "cres.",
              x: 0.5
            }
          ],
          length,
          g
        );
      }
    },
    {
      duration: seconds(3),
      render: ({ x, duration }) => {
        const g = translate(group(), x, pitchScale(0.5));

        makeCue(x);
        makeDuration(x, duration);

        bravura(g, durationGlyph["0.5"]).attr("dy", "-0.666em");
        bravura(g, articulationGlyph[">"]).attr("dy", "0.5em");
        bravura(g, articulationGlyph["bartok"]).attr("dy", "-1em");

        drawDynamics(
          [
            {
              type: "symbol",
              value: "ff",
              x: 0
            }
          ],
          length,
          g
        );
      }
    },
    {
      duration: seconds(60),
      render: ({ x, duration }) => {
        const g = translate(group(), x, 0);

        makeDuration(x, duration);

        // wet slaps:
        // tongue slap
        // col legno battuto

        // sloshing:
        // bow hair rotating?

        wip(g, "wet slaps: tongue slap, col legno battuto)").attr("dy", "1em");
        wip(g, "sloshing: water sounds, bow hair rotating)").attr("dy", "2em");
        wip(g, "meandering lines (microtonal steps, larger skips/got slapped)")
          //TODO show
          .attr("dy", "3em");

        drawDynamics(
          [
            {
              type: "symbol",
              value: "p",
              x: 0
            }
          ],
          length,
          g
        ).call(translate, 0, 20);
      }
    },
    {
      duration: 0,
      render: ({ x }) => {
        const g = translate(group(), x, 0);
        doubleBar(g, pitchRange);
      }
    }
  ].map(startTimeFromDuration);

  const scoreWithRenderData = score.map(bar => {
    return {
      ...bar,
      x: timeScale(bar.startTime),
      length: timeScale(bar.duration)
    };
  });

  const { setScorePosition, scrollToNextBar } = makeScrollFunctions(
    scoreGroup,
    scoreWithRenderData.map(bar => bar.x)
  );

  score.forEach((bar, i) => {
    const callback = i < score.length - 1 ? scrollToNextBar : null;
    VS.score.add(bar.startTime, callback, [i, bar.duration]);
  });

  function renderScore() {
    scoreWithRenderData.forEach(bar => {
      const { render, ...data } = bar;
      render(data);
    });
  }

  const resize = makeResize(
    svg,
    page,
    margin,
    pitchRange,
    indicator,
    scoreGroup,
    setScorePosition
  );

  d3.select(window).on("resize", resize);

  d3.select(window).on("load", () => {
    renderScore();
    resize();
  });

  VS.score.preroll = seconds(3);
  function prerollAnimateCue() {
    VS.score.schedule(0, indicator.blinker.start());
  }
  VS.control.hooks.add("play", prerollAnimateCue);
  VS.WebSocket.hooks.add("play", prerollAnimateCue);

  addHooks(setScorePosition);

  VS.WebSocket.connect();

}());
