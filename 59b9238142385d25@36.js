function _1(md){return(
md`# Scope Feature Requests - 239 Entries`
)}

function _chart(d3,data)
{
  const width = Math.min(800, window.innerWidth - 20);
  const height = width;
  const radius = width / 6;

  const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));

  const hierarchy = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

  const root = d3.partition()
      .size([2 * Math.PI, hierarchy.height + 1])(hierarchy);
  root.each(d => d.current = d);

  const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius(d => d.y0 * radius)
      .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

  const svg = d3.create("svg")
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("width", width)
      .attr("height", height)
      .style("font", `${width / 80}px sans-serif`);

  const centerTextTop = svg.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "-0.6em")
    .style("font-size", `${width / 40}px`)
    .style("font-weight", "bold")
    .text("Hover or click a category");

  const centerTextMiddle = svg.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.5em")
    .style("font-size", `${width / 60}px`)
    .style("fill", "#666")
    .text("to explore its values.");

  const centerTextBottom = svg.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "1.8em")
    .style("font-size", `${width / 60}px`)
    .style("fill", "#666")
    .text("Click the center to go back.");

  const path = svg.append("g")
      .selectAll("path")
      .data(root.descendants().slice(1))
      .join("path")
      .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
      .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
      .attr("d", d => arc(d.current))
      .on("mouseenter", (event, d) => {
        centerTextTop.text(d.data.name);
        centerTextMiddle.text(`Value: ${d.value || "No value"}`);
        centerTextBottom.text("");
      })
      .on("mouseleave", () => {
        centerTextTop.text("Hover or click a category");
        centerTextMiddle.text("to explore its values.");
        centerTextBottom.text("Click the center to go back.");
      });

  path.filter(d => d.children)
      .style("cursor", "pointer")
      .on("click", clicked);

  const label = svg.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .join("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", d => +labelVisible(d.current))
      .attr("transform", d => labelTransform(d.current))
      .style("font-size", `${width / 90}px`)
      .call(wrapTextToLines, 20)
      .text(d => d.data.name);

  const parent = svg.append("circle")
      .datum(root)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked);

  function clicked(event, p) {
    parent.datum(p.parent || root);

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    const t = svg.transition().duration(750);

    path.transition(t)
        .tween("data", d => {
          const i = d3.interpolate(d.current, d.target);
          return t => d.current = i(t);
        })
        .filter(function(d) {
          return +this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
        .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
        .attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none")
        .attrTween("d", d => () => arc(d.current));

    label.filter(function(d) {
        return +this.getAttribute("fill-opacity") || labelVisible(d.target);
      }).transition(t)
        .attr("fill-opacity", d => +labelVisible(d.target))
        .attrTween("transform", d => () => labelTransform(d.current));
  }

  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.01;
  }

  function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

  function wrapTextToLines(text, maxChars) {
    text.each(function() {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      let word, line = [], lines = [], lineChars = 0;
      while ((word = words.pop())) {
        if (lineChars + word.length + line.length > maxChars) {
          lines.push(line.join(" "));
          line = [word];
          lineChars = word.length;
        } else {
          line.push(word);
          lineChars += word.length;
        }
      }
      lines.push(line.join(" "));
      text.text(null);
      lines.forEach((line, i) => {
        text.append("tspan")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dy", `${i * 1.1}em`)
            .text(line);
      });
    });
  }

  return svg.node();
}


function _d3(require){return(
require("d3@6")
)}

function _data(){return(
{
  name: "Feature Requests",
  children: [
    {
      name: "Performance",
      children: [
        { name: "No lag", value: 5 },
        { name: "High responsiveness while multitasking", value: 4 },
        { name: "Low CPU and RAM usage", value: 6 },
        { name: "Faster client and load times", value: 8 },
        { name: "Optimized resource usage", value: 5 },
        { name: "Smooth navigation", value: 4 },
        { name: "Speed and stability", value: 10 },
        { name: "Faster Discord experience", value: 12 },
        { name: "Lightweight client", value: 8 },
        { name: "Quick start-up times", value: 6 },
        { name: "Reduced bloat", value: 5 },
        { name: "No Electron", value: 4 },
        { name: "Lower resource consumption", value: 7 }
      ]
    },
    {
      name: "Customization",
      children: [
        {
          name: "Themes and Styling",
          children: [
            { name: "Customizable themes", value: 10 },
            { name: "Flexible layouts", value: 7 },
            { name: "Better theme engine", value: 6 },
            { name: "Custom backgrounds", value: 4 },
            { name: "Glass theme", value: 5 },
            { name: "Full UI customization", value: 8 }
          ]
        },
        {
          name: "Extensions",
          children: [
            { name: "Plugin support", value: 15 },
            { name: "Custom extensions", value: 8 },
            { name: "Custom scripts and add-ons", value: 5 },
            { name: "Plugin/theme integration", value: 6 },
            { name: "Advanced plugin system", value: 7 }
          ]
        }
      ]
    },
    {
      name: "Productivity and Multitasking",
      children: [
        { name: "Multi-tab view", value: 12 },
        { name: "Split screen and multi-channel view", value: 10 },
        { name: "Pinned messages and DMs", value: 6 },
        { name: "Streamlined project management features", value: 4 },
        { name: "Quick server switching", value: 5 },
        { name: "Multiple column views", value: 8 },
        { name: "Custom notification filters", value: 9 },
        { name: "Better multitasking support", value: 7 },
        { name: "Channel tagging and filtering", value: 5 },
        { name: "Improved search and navigation", value: 6 }
      ]
    },
    {
      name: "Accessibility",
      children: [
        { name: "Better search optimization", value: 6 },
        { name: "Custom notification filters", value: 5 },
        { name: "Keyboard shortcuts and hotkeys", value: 10 },
        { name: "Improved layout for faster navigation", value: 7 },
        { name: "Multi-account support", value: 4 },
        { name: "Better organization of DMs and servers", value: 6 }
      ]
    },
    {
      name: "Linux and Wayland Support",
      children: [
        { name: "Wayland screensharing with audio", value: 4 },
        { name: "General Linux support", value: 6 },
        { name: "Better streaming for Linux", value: 5 },
        { name: "Optimized Linux client", value: 4 },
        { name: "Full Wayland support", value: 5 }
      ]
    },
    {
      name: "UI Improvements",
      children: [
        { name: "Sleek and lightweight interface", value: 8 },
        { name: "Compact UI with fewer distractions", value: 7 },
        { name: "Better DMs and organization", value: 5 },
        { name: "Folders and nested categories", value: 6 },
        { name: "Streamlined browsing experience", value: 7 },
        { name: "Improved message management", value: 5 },
        { name: "Tabs for quick navigation", value: 6 },
        { name: "Better notification clarity", value: 4 }
      ]
    },
    {
      name: "Other Features",
      children: [
        { name: "Message bookmarking", value: 5 },
        { name: "Advanced task management", value: 6 },
        { name: "Better streaming experience", value: 8 },
        { name: "Vim keybindings", value: 7 },
        { name: "Picture-in-picture mode", value: 4 },
        { name: "Improved GIF picker", value: 5 },
        { name: "Full command palette", value: 6 }
      ]
    }
  ]
}
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("chart")).define("chart", ["d3","data"], _chart);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("data")).define("data", _data);
  return main;
}
