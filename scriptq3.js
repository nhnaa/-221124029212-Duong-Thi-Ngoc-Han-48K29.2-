const margin = {top: 20, right: 5, bottom: 50, left: 200},
      width = 1300 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

const svg = d3.select("#q3-chart")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#q3-tooltip");

d3.csv("data/data.csv").then(rawData => {
  rawData.forEach(d => {
    d["Thành tiền"] = +d["Thành tiền"];
    d["SL"] = +d["SL"];
    const month = d["Thời gian tạo đơn"].split("-")[1];
    d.Tháng = `Tháng ${month}`;
  });

  const nestedData = d3.rollup(
    rawData,
    v => ({
      doanhThu: d3.sum(v, d => d["Thành tiền"]),
      soLuong: d3.sum(v, d => d["SL"])
    }),
    d => d.Tháng
  );

  const data = Array.from(nestedData, ([Tháng, {doanhThu, soLuong}]) => ({ Tháng, doanhThu, soLuong }));
  data.sort((a, b) => parseInt(a.Tháng.split(" ")[1]) - parseInt(b.Tháng.split(" ")[1]));

  const color = d3.scaleOrdinal(d3.schemeTableau10);

  const x = d3.scaleBand()
              .domain(data.map(d => d.Tháng))
              .range([0, width])
              .padding(0.2);

  const y = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.doanhThu)])
              .nice()
              .range([height, 0]);

  svg.append("g")
     .attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(x))
     .append("text")
     .attr("x", width / 2)
     .attr("y", 40)
     .attr("fill", "black")
     .attr("text-anchor", "middle");

  svg.append("g")
     .call(d3.axisLeft(y)
             .ticks(9)
             .tickFormat(d3.format(".1s"))
             .tickSizeOuter(0));

  svg.selectAll(".bar")
     .data(data)
     .enter()
     .append("rect")
     .attr("class", "bar")
     .attr("x", d => x(d.Tháng))
     .attr("y", d => y(d.doanhThu))
     .attr("width", x.bandwidth())
     .attr("height", d => height - y(d.doanhThu))
     .attr("fill", d => color(d.Tháng))
     .on("mouseover", (event, d) => {
       tooltip.style("display", "block")
              .html(`<strong>${d.Tháng}</strong><br>
                    Doanh số: ${d3.format(",.0f")(d.doanhThu / 1_000_000)} triệu VND <br>
                    Số lượng: ${d.soLuong} SKUs`)
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
     })
     .on("mousemove", event => {
       tooltip.style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
     })
     .on("mouseout", () => {
       tooltip.style("display", "none");
     });

  svg.selectAll(".label")
     .data(data)
     .enter()
     .append("text")
     .attr("x", d => x(d.Tháng) + x.bandwidth() / 2)
     .attr("y", d => y(d.doanhThu) - 5)
     .attr("text-anchor", "middle")
     .style('font-size','12px')
     .text(d => `${d3.format(",.0f")(d.doanhThu / 1_000_000)} triệu VND`);
});
