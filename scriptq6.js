const marginQ6 = {top: 60, right: 20, bottom: 80, left: 50},
      widthQ6 = 1500 - marginQ6.left - marginQ6.right,
      heightQ6 = 600 - marginQ6.top - marginQ6.bottom;

const svgQ6 = d3.select("#chart-q6")
                .append("svg")
                .attr("width", widthQ6 + marginQ6.left + marginQ6.right)
                .attr("height", heightQ6 + marginQ6.top + marginQ6.bottom)
                .append("g")
                .attr("transform", `translate(${marginQ6.left},${marginQ6.top})`);

const tooltipQ6 = d3.select("#tooltip-q6");

d3.csv("data/data.csv").then(rawData => {
  rawData.forEach(d => {
    d["Thành tiền"] = +d["Thành tiền"];
    d["Số lượng"] = +d["Số lượng"];
    d["SL"] = +d["SL"];
    let date = new Date(d["Thời gian tạo đơn"]);
    if (!isNaN(date.getTime())) {
      d.Tháng = date.getMonth() + 1;
      d.Giờ = date.getHours();
      d.Ngày = date.toISOString().split('T')[0];
    }
  });

  const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00-${i.toString().padStart(2, '0')}:59`);

  const filteredData = rawData.filter(d => d.Giờ >= 8 && d.Giờ <= 23);
  const groupedData = d3.group(filteredData, d => d.Giờ);

  const data = [];
  groupedData.forEach((orders, hour) => {
    const uniqueDays = new Set(orders.map(d => d.Ngày)).size;
    const doanhThuTB = uniqueDays > 0 ? d3.sum(orders, d => d["Thành tiền"]) / uniqueDays : 0;
    const soLuongTB = uniqueDays > 0 ? d3.sum(orders, d => d["SL"]) / uniqueDays : 0;
    data.push({ KhungGiờ: timeSlots[hour], doanhThuTB, soLuongTB, Giờ: hour });
  });

  const x = d3.scaleBand()
              .domain(timeSlots.slice(8, 24))
              .range([0, widthQ6])
              .padding(0.2);

  const y = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.doanhThuTB)])
              .nice()
              .range([heightQ6, 0]);

  const color = d3.scaleOrdinal(d3.schemeTableau10);

  svgQ6.append("g")
       .attr("transform", `translate(0, ${heightQ6})`)
       .call(d3.axisBottom(x).tickSize(0))
       .selectAll("text")
       .attr("transform", "rotate(-45)")
       .style("text-anchor", "end");

  svgQ6.append("g")
       .call(d3.axisLeft(y)
               .ticks(10)
               .tickFormat(d3.format(".1s"))
               .tickSizeOuter(0));

  svgQ6.selectAll(".bar")
       .data(data)
       .enter()
       .append("rect")
       .attr("class", "bar")
       .attr("x", d => x(d.KhungGiờ))
       .attr("y", d => y(d.doanhThuTB))
       .attr("width", x.bandwidth())
       .attr("height", d => heightQ6 - y(d.doanhThuTB))
       .attr("fill", d => color(d.Giờ))
       .on("mouseover", (event, d) => {
         tooltipQ6.style("display", "block")
                  .html(`Khung Giờ: ${d.KhungGiờ}<br>
                         Doanh thu TB: ${d3.format(",.0f")(d.doanhThuTB)} VND<br>
                         Số lượng TB: ${d3.format(",.0f")(d.soLuongTB)} SKUs`)
                  .style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 20) + "px");
       })
       .on("mousemove", event => {
         tooltipQ6.style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 20) + "px");
       })
       .on("mouseout", () => {
         tooltipQ6.style("display", "none");
       });

  svgQ6.selectAll(".label")
       .data(data)
       .enter()
       .append("text")
       .attr("class", "label")
       .attr("x", d => x(d.KhungGiờ) + x.bandwidth() / 2)
       .attr("y", d => y(d.doanhThuTB) - 5)
       .style('font-size','10px')
       .text(d => d3.format(",.0f")(d.doanhThuTB));
});
