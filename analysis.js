// 📁 analysis.js

const emotionVectorMap = {
  "🤩": { x: 0.71, y: 0.71 },
  "😊": { x: 0.87, y: 0.5 },
  "😄": { x: 0.71, y: 0.0 },
  "😌": { x: 1.0, y: 0.0 },
  "🧘": { x: 0.5, y: -0.5 },
  "😴": { x: 0.3, y: -0.71 },
  "😪": { x: -0.3, y: -0.87 },
  "😞": { x: -0.5, y: -0.5 },
  "😢": { x: -0.71, y: 0.0 },
  "😣": { x: -1.0, y: 0.0 },
  "😠": { x: -0.87, y: 0.5 },
  "😰": { x: -0.87, y: 0.5 },
  "😬": { x: -0.71, y: 0.71 }
};

function analyzeEmotionData(diaries) {
  const quadrantCount = { '긍정+고각성': 0, '긍정+비활성': 0, '부정+고각성': 0, '부정+비활성': 0 };
  let totalX = 0, totalY = 0, count = 0;

  for (const diary of diaries) {
    const vec = emotionVectorMap[diary.emotion];
    if (!vec) continue;

    totalX += vec.x;
    totalY += vec.y;
    count++;

    if (vec.x >= 0 && vec.y > 0) quadrantCount["긍정+고각성"]++;
    else if (vec.x >= 0 && vec.y <= 0) quadrantCount["긍정+비활성"]++;
    else if (vec.x < 0 && vec.y > 0) quadrantCount["부정+고각성"]++;
    else if (vec.x < 0 && vec.y <= 0) quadrantCount["부정+비활성"]++;
  }

  return {
    quadrantCount,
    vectorSum: { x: count ? totalX / count : 0, y: count ? totalY / count : 0 }
  };
}

function drawMoodVector(vectorSum, historyPoints = []) {
  const ctx = document.getElementById("moodVectorChart").getContext("2d");

  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: '감정 이동 경로',
          data: historyPoints,
          showLine: true,
          borderColor: 'blue',
          backgroundColor: 'blue',
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 8
        },
        {
          label: '감정 평균 위치',
          data: [vectorSum],
          backgroundColor: 'red',
          pointRadius: 10
        }
      ]
    },
    options: {
      scales: {
        x: {
          min: -1, max: 1,
          title: { display: true, text: 'Valence (긍정 ↔ 부정)' },
          grid: { color: '#ccc' }
        },
        y: {
          min: -1, max: 1,
          title: { display: true, text: 'Arousal (비활성 ↔ 고각성)' },
          grid: { color: '#ccc' }
        }
      },
      plugins: {
        title: { display: true, text: '감정 벡터 이동 경로' },
        legend: { position: 'top' }
      }
    },
    plugins: [{
      id: 'crosshairAxes',
      beforeDraw(chart) {
        const { ctx, chartArea: area, scales } = chart;

        const x0 = scales.x.getPixelForValue(0);
        const y0 = scales.y.getPixelForValue(0);

        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;

        // 수직 축 (y축)
        ctx.beginPath();
        ctx.moveTo(x0, area.top);
        ctx.lineTo(x0, area.bottom);
        ctx.stroke();

        // 수평 축 (x축)
        ctx.beginPath();
        ctx.moveTo(area.left, y0);
        ctx.lineTo(area.right, y0);
        ctx.stroke();

        ctx.restore();
      }
    }]
  });
}


function drawEmotionPieChart(counts) {
  const ctx = document.getElementById("quadrantPieChart").getContext("2d");
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(counts).map(k => `${k} (${counts[k]}개)`),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: Object.keys(counts).map((_, i) => `hsl(${i * 30}, 70%, 70%)`)
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: '감정별 빈도수' },
        datalabels: {
          color: '#000',
          font: { weight: 'bold' },
          formatter: (_, context) => context.chart.data.labels[context.dataIndex]
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function countEmotionLabels(diaries) {
  const count = {};
  for (const diary of diaries) {
    const emo = diary.emotion;
    if (!emo) continue;
    count[emo] = (count[emo] || 0) + 1;
  }
  return count;
}



function generateEmotionHistoryPoints(diaries) {
  const points = [];

  const map = {};
  diaries.forEach(d => { map[d.date] = d.emotion; });

  const today = new Date();
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(today.getDate() - 20); // 총 21일

  for (let i = 0; i < 21; i++) {
    const date = new Date(threeWeeksAgo);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    const emotion = map[dateStr];
    const vec = emotionVectorMap[emotion];
    if (vec) points.push({ x: vec.x, y: vec.y });
  }

  return points;
}



