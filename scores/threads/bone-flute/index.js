import drone from "../drone";

const main = d3.select(".main");
const wrapper = main.append("g");

drone(wrapper);

function textureOfBones(selection) {
  for (let i = 0; i < 666; i++) {
    selection
      .append("text")
      .text("\u2620")
      .attr("dx", `${Math.random() * 33}em`)
      .attr("dy", `${Math.random() * 2}em`);
  }
}

textureOfBones(wrapper.append("g").attr("transform", "translate(0, 100)"));

function boneFlute(selection) {
  const lineCloud = VS.lineCloud()
    .duration(1)
    .phrase([{ pitch: 0, duration: 1 }, { pitch: 0, duration: 0 }])
    .curve(d3.curveLinear)
    .width(50)
    .height(50);

  selection.call(lineCloud, { n: 6 });
}

boneFlute(wrapper);