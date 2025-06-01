// 예시 데이터
const weatherData = [
  { week: "3주 전", data: { sunny: 4, cloudy: 2, rainy: 1, none: 0 } },
  { week: "2주 전", data: { sunny: 3, cloudy: 1, rainy: 2, none: 1 } },
  { week: "1주 전", data: { sunny: 5, cloudy: 2, rainy: 0, none: 0 } }
];

const emotionVectors = [
  { x: 0.6, y: 0.7, week: 1 },
  { x: -0.2, y: 0.3, week: 2 },
  { x: 0.1, y: 0.5, week: 3 },
  // 추가 가능
];

// 1. 다중 원형 파이차트
function drawMultiRingPieChart(data) {
  const width = 400, height = 400, radius = Math.min(width, height) / 2;
  const svg = d3.select("#weather-multiring-chart")
    .append("svg").attr("viewBox", `0 0 ${width} ${height}`)
    .append("g").attr("transform", `translate(${width / 2},${height / 2})`);

  const color = d3.scaleOrdinal()
    .domain(["sunny", "cloudy", "rainy"])
    .range(["#FFD54F", "#90A4AE", "#4FC3F7"]);

  const arc = d3.arc();
  const pie = d3.pie().value(d => d.value).sort(null);
  const ringWidth = 30;

  data.forEach((weekData, i) => {
    const inner = i * ringWidth;
    const outer = inner + ringWidth;
    const entries = Object.entries(weekData.data)
      .filter(([key]) => key !== "none")
      .map(([key, value]) => ({ name: key, value }));

    svg.selectAll(`.arc${i}`)
      .data(pie(entries))
      .join("path")
      .attr("class", `arc${i}`)
      .attr("d", arc.innerRadius(inner).outerRadius(outer))
      .attr("fill", d => color(d.data.name));
  });
}

// 2. 감정 벡터 시각화
function drawEmotionVectorPlot(vectors) {
  const width = 400, height = 400;
  const svg = d3.select("#emotion-vector-plot")
    .append("svg").attr("viewBox", `0 0 ${width} ${height}`)
    .append("g").attr("transform", `translate(${width / 2},${height / 2})`);

  const scale = d3.scaleLinear().domain([-1, 1]).range([-150, 150]);

  svg.append("circle").attr("r", 150).attr("fill", "#f0f0f0");

  svg.append("line").attr("x1", scale(-1)).attr("x2", scale(1)).attr("y1", 0).attr("y2", 0).attr("stroke", "#bbb");
  svg.append("line").attr("x1", 0).attr("x2", 0).attr("y1", scale(-1)).attr("y2", scale(1)).attr("stroke", "#bbb");

  svg.selectAll(".dot")
    .data(vectors)
    .join("circle")
    .attr("cx", d => scale(d.x))
    .attr("cy", d => scale(-d.y))
    .attr("r", 5)
    .attr("fill", "steelblue");

  const sumX = d3.mean(vectors, d => d.x);
  const sumY = d3.mean(vectors, d => d.y);

  svg.append("line")
    .attr("x1", 0).attr("y1", 0)
    .attr("x2", scale(sumX)).attr("y2", scale(-sumY))
    .attr("stroke", "red").attr("stroke-width", 2);
}

// 실행
drawMultiRingPieChart(weatherData);
drawEmotionVectorPlot(emotionVectors);
