const margin = { top: 50, right: 50, bottom: 60, left: 70 },
      width = 1000 - margin.left - margin.right,
      height = 700 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

d3.csv("data/data.csv").then(rawData => {
    const purchasesByCustomer = d3.rollups(
        rawData,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Mã khách hàng"]
    );

    const distribution = d3.rollups(
        purchasesByCustomer,
        v => v.length,
        d => d[1]
    );

    const data = distribution.map(([purchaseCount, customerCount]) => ({
        purchaseCount: +purchaseCount,
        customerCount: +customerCount
    })).sort((a, b) => a.purchaseCount - b.purchaseCount);

    const x = d3.scaleBand()
        .domain(data.map(d => d.purchaseCount))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.customerCount)])
        .nice()
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px");

    svg.append("g")
        .call(d3.axisLeft(y).ticks(6))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Số Khách Hàng");

    svg.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.purchaseCount))
        .attr("y", d => y(d.customerCount))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.customerCount))
        .attr("fill", "#4e79a7")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <strong>Đã mua ${d.purchaseCount} lần</strong><br/>
                Số lượng KH: ${d3.format(",")(d.customerCount)}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });
});
