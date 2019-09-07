// make held tone less predictable/gated
// replace pink with noisy texture
// add pressure, irr trem
// add stems/flags to cluster hits (subsequent hits are not cluster?)
// add accent to main hit

import drone from "../drone";
import translate from "../translate";
import pathAlongPath from "../pathAlongPath";

import makePage from "./page";
import makeScroll from "./scroll";
import makeIndicator from "./indicator";
import drawDynamics from "./dynamics";
import noisePatch from "./noisePatch";
import longTone from "./longTone";
import lineBecomingAir from "./lineBecomingAir";

const margin = {
  top: 64
};

const seconds = t => t * 1000;

const pitchRange = 87;
function pitchScale(value) {
  return (1 - value) * pitchRange;
}
// function pitchScale(midi) {
//   // MIDI 21/A0 to 108/C8
//   // 64.5/Eq#4 is center
//   const [min, max] = [21, 108];
//   const range = max - min;
//
//   return 1 - midi / range;
// }

function timeScale(t) {
  return t / 200;
}

const svg = d3.select("svg.main");
svg.append("style").text(`
  line { stroke: black; }
  .bravura { font-family: 'Bravura'; font-size: 20px; }
  .text-dynamic {
    font-family: serif;
    font-size: 12px;
    font-style: italic;
  }
 `);

const page = makePage(svg);

// Create hidden line to ensure page fits margins
page.element
  .append("line")
  .attr("y1", 0)
  .attr("y2", margin.top + pitchRange + 32) // TODO
  //.attr("y2", margin.top + pitchRange + margin.top)
  .style("visibility", "hidden");

const scoreGroup = makeScroll(page.element);
scoreGroup.y(margin.top); // TODO allow chaining
//scoreGroup.element.style("outline", "1px dotted red");

const indicator = makeIndicator(page.element);

// drone(scoreGroup.element); // TODO: how do these integrate with the ending

const { articulations, dynamics } = VS.dictionary.Bravura;

const splitDynamics = endDynamic => [
  {
    type: "symbol",
    value: "sffz", // sfffz?
    x: 0
  },
  {
    type: "symbol",
    value: "mf",
    x: 0.15
  },
  {
    type: "text",
    value: "decres.",
    x: 0.5
  },
  {
    type: "symbol",
    value: endDynamic,
    x: 1
  }
];

// const score = [
let score = [
  {
    startTime: null,
    duration: seconds(60),
    render: ({ startTime, duration }) => {
      const startX = timeScale(startTime);
      const length = timeScale(duration);

      const g = longTone(scoreGroup.element, startX, pitchScale(0.5), length);

      g.append("text")
        .text(articulations[">"])
        .attr("class", "bravura")
        .attr("dy", "0.66em");

      drawDynamics(
        [
          {
            type: "symbol",
            value: "p",
            x: 0
          }
          //          {
          //            type: "text",
          //            value: "cres.",
          //            x: 0.5
          //          },
          //          {
          //            type: "symbol",
          //            value: "mf",
          //            x: 1
          //          }
        ],
        length,
        g
      );
    }
  },
  {
    startTime: null,
    duration: seconds(5), // TODO 2 seconds time, more display
    render: ({ startTime, duration }) => {
      const startX = timeScale(startTime);
      const length = timeScale(duration);

      const g = scoreGroup.element.append("g");
      translate(startX, pitchScale(0.5), g);

      // cluster
      g.append("text")
        .text("\ue123")
        .attr("class", "bravura");

      drawDynamics(
        [
          {
            type: "symbol",
            value: "sffz", // sfffz?
            x: 0
          }
        ],
        length,
        g
      );

      // caesura
      g.append("text")
        .text("\ue4d2")
        .attr("class", "bravura")
        .attr("x", length)
        .attr("dy", "-1em")
        .attr("text-anchor", "end");
    }
  },
  {
    startTime: null,
    duration: seconds(45),
    render: ({ startTime, duration }) => {
      const startX = timeScale(startTime);
      const length = timeScale(duration);

      const g = scoreGroup.element.append("g");
      translate(startX, 0, g);

      // with excessive pressure and air
      translate(
        0,
        pitchScale(0.5),
        g
          .append("text")
          //.text("\ue61b")
          .text("\ue61d")
          .attr("dy", "-1em")
          .attr("class", "bravura")
      );

      // irregular tremolo
      translate(
        0,
        pitchScale(0.5),
        g
          .append("text")
          .text("\uE22B")
          .attr("dy", "-0.5em")
          .attr("class", "bravura")
      );

      // top line
      const line = lineBecomingAir(length, g);
      translate(0, pitchScale(0.5), line);

      const patches = translate(0, pitchScale(0.5), g.append("g"));
      [0.2, 0.4, 0.6].forEach(x => {
        noisePatch(x * length, length * 0.1, patches);
      });

      drawDynamics(
        splitDynamics("n"),
        length,
        translate(0, -50, g.append("g"))
      );

      // bottom line
      pathAlongPath(d3.curveBasis, d3.curveBasis)(
        [
          { x: 0, y: pitchScale(0.5) },
          { x: length * 0.33, y: pitchScale(0.485) },
          { x: length * 0.66, y: pitchScale(0.265) },
          { x: length, y: pitchScale(0.25) }
        ],
        [...new Array(50)],
        (point, i, x, y) => ({ x, y: y + VS.getRandExcl(-1, 1) }),
        g
      );

      const bottomNoise = noisePatch(length * 0.25, length, g);
      translate(0, pitchScale(0.25), bottomNoise);

      [0.2, 0.4, 0.6].forEach(x => {
        g.append("text") // TODO also add flag
          .text("\ue123")
          .attr("x", length * x)
          .attr("y", pitchScale(0.5 - x / 4))
          .attr("dy", "1em")
          .attr("class", "bravura");
      });

      drawDynamics(splitDynamics("p"), length, translate(0, 50, g.append("g")));
    }
  },
  {
    startTime: null,
    duration: seconds(120),
    render: ({ startTime, duration }) => {
      const startX = timeScale(startTime);
      const length = timeScale(duration);

      const g = scoreGroup.element.append("g");
      translate(startX, 0, g);

      // bottom line
      g.append("line")
        .attr("x1", 0)
        .attr("x2", length)
        .attr("y1", pitchScale(0.25))
        .attr("y2", pitchScale(0.25));

      // threads
      const makeThread = (x, y, length, selection) => {
        const group = translate(x, y, selection.append("g"));

        group
          .append("line")
          .attr("x1", 0)
          .attr("x2", length);

        drawDynamics(
          [
            {
              type: "symbol",
              value: "n",
              x: 0
            },
            {
              type: "text",
              value: "cres.",
              x: 0.5
            },
            {
              type: "symbol",
              value: "mf",
              x: 1
            }
          ],
          length,
          group
        );
      };

      for (let i = 0; i < 10; i++) {
        let x = VS.getRandExcl(0.25, 0.5) * length;
        let y = pitchScale(VS.getRandExcl(0, 1));
        makeThread(x, y, length - x, g);
      }
    }
  },
  {
    startTime: null,
    duration: 0,
    render: ({ startTime }) => {
      const startX = timeScale(startTime);

      const g = scoreGroup.element.append("g");
      translate(startX, 0, g);

      g.append("line")
        .attr("y1", 0)
        .attr("y2", pitchRange)
        .attr("stroke-width", 1);

      translate(
        3,
        0,
        g
          .append("line")
          .attr("y1", 0)
          .attr("y2", pitchRange)
          .attr("stroke-width", 2)
      );
    }
  }
];

const startTimes = score.reduce(
  ({ sum, times }, bar) => {
    return {
      sum: sum + bar.duration,
      times: [...times, sum]
    };
  },
  { sum: 0, times: [] }
).times;

score = score.map((bar, i) => {
  return { ...bar, startTime: startTimes[i] };
});

score.forEach((bar, i) => {
  const callback = i < score.length - 1 ? scrollToNextBar : null;
  VS.score.add(bar.startTime, callback, [i, bar.duration]);
});

function renderScore() {
  score.forEach(bar => {
    const { render, ...barData } = bar;
    render(barData);
  });
}

function setScorePosition() {
  const index = VS.score.getPointer();
  centerScoreByIndex(index, 0);
}

function centerScoreByIndex(index, duration) {
  const x = timeScale(score[index].startTime);
  scoreGroup.scrollTo(x, duration);
}

function scrollToNextBar(index, duration) {
  centerScoreByIndex(index + 1, duration);
}

function resize() {
  VS.score.isPlaying() && VS.score.pause();

  const w = parseInt(svg.style("width"), 10);
  const h = parseInt(svg.style("height"), 10);

  const scale = h / page.height();
  page.scale(scale);

  const center = (w / scale) * 0.5;
  indicator.translateX(center);
  scoreGroup.setCenter(center);
  setScorePosition();
}

d3.select(window).on("resize", resize);

d3.select(window).on("load", () => {
  renderScore();
  page.calculateHeight();
  resize();
});

VS.control.hooks.add("stop", setScorePosition);
VS.score.hooks.add("stop", setScorePosition);
VS.control.hooks.add("step", setScorePosition);
VS.control.hooks.add("pause", setScorePosition);

// TODO include stylesheet or inline all styles
// TODO serialize font?
function saveSvg() {
  var svgXML = new XMLSerializer().serializeToString(svg.node());
  var encoded = encodeURI(svgXML);
  var dataURI = `data:image/svg+xml;utf8,${encoded}`;

  var dl = document.createElement("a");
  document.body.appendChild(dl); // This line makes it work in Firefox.
  dl.setAttribute("href", dataURI);
  dl.setAttribute("download", "test.svg");
  dl.click();
  dl.remove();
}
d3.select("#save-svg").on("click", saveSvg);
