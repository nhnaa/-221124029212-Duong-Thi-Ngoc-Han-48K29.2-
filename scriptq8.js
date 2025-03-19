const margin = { top: 50, right: 200, bottom: 50, left: 200 },
      width = 1300 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#q8-chart")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("data/data.csv").then(rawData => {
    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

    rawData.forEach(d => {
        d["Thời gian tạo đơn"] = parseDate(d["Thời gian tạo đơn"]);
        d["Tháng"] = d["Thời gian tạo đơn"].getMonth() + 1;
        d["Mã đơn hàng"] = d["Mã đơn hàng"].trim();
        d["Nhóm gộp"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
    });

    const groupByMonthGroup = d3.rollups(
        rawData,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Tháng"],
        d => d["Nhóm gộp"]
    );

    const totalDistinctOrdersByMonth = d3.rollups(
        rawData,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Tháng"]
    );

    const totalOrdersByMonthObj = {};
    totalDistinctOrdersByMonth.forEach(([month, count]) => {
        totalOrdersByMonthObj[month] = count;
    });

    const data = [];

    groupByMonthGroup.forEach(([month, groups]) => {
        const totalInMonth = totalOrdersByMonthObj[month];

        groups.forEach(([groupName, groupCount]) => {
            const probability = groupCount / totalInMonth;

            data.push({
                month: +month,
                group: groupName,
                probability: probability
            });
        });
    });

    const x = d3.scaleLinear()
                .domain([1, 12])
                .range([0, width]);

    const y = d3.scaleLinear()
                .domain([0, 1])
                .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const dataGroup = d3.groups(data, d => d.group);

    const line = d3.line()
                   .x(d => x(d.month))
                   .y(d => y(d.probability));

    // X Axis
    svg.append("g")
       .attr("transform", `translate(0, ${height})`)
       .call(d3.axisBottom(x).ticks(12).tickFormat(d => `Tháng ${d}`));

    // Y Axis
    svg.append("g")
       .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

    // Lines
    svg.selectAll(".line")
       .data(dataGroup)
       .join("path")
       .attr("fill", "none")
       .attr("stroke", d => color(d[0]))
       .attr("stroke-width", 2)
       .attr("d", d => line(d[1]));

    // Legend
    const legend = svg.selectAll(".legend")
                      .data(dataGroup)
                      .join("g")
                      .attr("transform", (d, i) => `translate(${width + 10}, ${i * 16})`);

    legend.append("rect")
          .attr("x", 0)
          .attr("width", 8)
          .attr("height", 8)
          .attr("fill", d => color(d[0]));

    legend.append("text")
          .attr("x", 12)
          .attr("y", 7)
          .style("font-size", "11px")
          .text(d => d[0]);

    // Tooltip
    const tooltip = d3.select("#q8-tooltip");

    const groupedData = d3.group(data, d => d.month);

    svg.selectAll(".dot")
       .data(data)
       .join("circle")
       .attr("cx", d => x(d.month))
       .attr("cy", d => y(d.probability))
       .attr("r", 4)
       .attr("fill", d => color(d.group))
       .on("mouseover", (event, d) => {
           const monthData = groupedData.get(d.month) || [];

           let tooltipContent = `<strong>Tháng ${String(d.month).padStart(2, '0')}</strong><br/>`;
           monthData.forEach(entry => {
               tooltipContent += `
                   <div style="display: flex; align-items: center;">
                       <div style="width: 10px; height: 10px; background: ${color(entry.group)}; border-radius: 50%; margin-right: 5px;"></div>
                       <span>${entry.group} ${Math.round(entry.probability * 100)}%</span>
                   </div>
               `;
           });

           tooltip.style("display", "block")
                  .html(tooltipContent)
                  .style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 28) + "px");
       })
       .on("mouseout", () => {
           tooltip.style("display", "none");
       });
});
