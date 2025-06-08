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
    vectorSum: { x: totalX, y: totalY }
  };
}

// 평균 벡터 계산 함수
function calculateAverageVector(historyPoints) {
  const weights = [0.5, 0.7, 1.0];  // 3주 전: 0.5, 2주 전: 0.7, 1주 전: 1.0
  
  // 주차별 데이터 분리
  const weeklyData = [[], [], []];
  historyPoints.forEach((point, index) => {
    const weekIndex = Math.floor(index / 7);
    if (weekIndex < 3) {
      weeklyData[weekIndex].push(point);
    }
  });

  // 가중 평균 벡터 계산
  let weightedSum = { x: 0, y: 0 };
  let totalWeight = 0;

  weeklyData.forEach((week, index) => {
    const weight = weights[index];
    const weekSum = week.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });

    weightedSum.x += (weekSum.x / week.length) * weight;
    weightedSum.y += (weekSum.y / week.length) * weight;
    totalWeight += weight;
  });

  return {
    x: weightedSum.x / totalWeight,
    y: weightedSum.y / totalWeight
  };
}

function drawMoodVector(_, historyPoints = []) {
  const ctx = document.getElementById("moodVectorChart").getContext("2d");

  const weekColors = ["#99c2ff", "#aadfaa", "#ffc2c2"];
  const weights = [0.5, 0.7, 1.0];
  const scaleFactor = 5;  

  // 주차별 점수 분리
  const weekData = [[], [], []];
  const originalWeekData = [[], [], []];  // 가중치 없는 원본도 따로 유지

  for (let i = 0; i < historyPoints.length; i++) {
    const reverseIndex = historyPoints.length - 1 - i;
    const weekIndex = 2 - Math.floor(reverseIndex / 7);
    if (weekIndex >= 0 && weekIndex < 3) {
      const p = historyPoints[i];
      const weight = weights[weekIndex];

      weekData[weekIndex].push({
        ...p,
        x: p.x * weight * scaleFactor,
        y: p.y * weight * scaleFactor
      });

      originalWeekData[weekIndex].push({ ...p });
    }
  }

  // 평균 벡터 계산
  const averageVector = calculateAverageVector(historyPoints);

  // 주차별 누적 벡터 합 계산 (가중치 × 확대 없이)
  const stepPoints = [{ x: 0, y: 0 }];
  let running = { x: 0, y: 0 };
  const stepLines = [];

  for (let i = 0; i < originalWeekData.length; i++) {
    const sum = originalWeekData[i].reduce((acc, p) => ({
      x: acc.x + p.x,
      y: acc.y + p.y
    }), { x: 0, y: 0 });

    const nextPoint = {
      x: running.x + sum.x,
      y: running.y + sum.y
    };
    stepLines.push({
      label: `${3 - i}주 전 벡터 합`,
      data: [running, nextPoint],
      showLine: true,
      fill: false,
      borderColor: weekColors[i],
      backgroundColor: weekColors[i],
      pointRadius: 0,
      tension: 0
    });
    stepPoints.push(nextPoint);
    running = nextPoint;
  }

  // 평균 벡터 표시를 위한 데이터셋 추가
  const averageVectorDataset = {
    label: '평균 감정 벡터',
    data: [{
      x: averageVector.x * scaleFactor,
      y: averageVector.y * scaleFactor
    }],
    pointRadius: 8,
    pointBackgroundColor: '#ff0000',
    pointBorderColor: 'rgb(255, 0, 0)',
    pointBorderWidth: 2,
    pointStyle: 'circle',
    showLine: false
  };

  // 평균 벡터를 중심으로 하는 원 표시
  const circleDataset = {
    label: '평균 벡터 영역',
    data: [{
      x: averageVector.x * scaleFactor,
      y: averageVector.y * scaleFactor
    }],
    pointRadius: 15,
    pointBackgroundColor: 'rgba(255, 0, 0, 0.1)',
    pointBorderColor: 'rgba(255, 0, 0, 0.3)',
    pointBorderWidth: 1,
    pointStyle: 'circle',
    showLine: false
  };

  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        ...weekData.map((week, i) => ({
          label: `${3 - i}주 전 (가중 반영)`,
          data: week,
          pointRadius: 5,
          backgroundColor: weekColors[i],
          pointStyle: ['circle', 'rect', 'triangle'][i],
          showLine: false
        })),
        ...stepLines,
        circleDataset,
        averageVectorDataset
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: -12, max: 12,
          title: { display: true, text: 'Valence (긍정 ↔ 부정)' },
          grid: { color: '#ccc' }
        },
        y: {
          min: -12, max: 12,
          title: { display: true, text: 'Arousal (비활성 ↔ 고각성)' },
          grid: { color: '#ccc' }
        }
      },
      plugins: {
        title: {
          display: true,
          text: '감정 벡터 이동 경로 (일일 가중 반영, 주차 벡터 합)'
        },
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function (context) {
              const point = context.raw;
              if (point.date && point.emotion) {
                return `📅 ${point.date}  ${point.emotion}  📝 ${point.title || ''}`;
              }
              if (context.dataset.label === '평균 감정 벡터') {
                return `평균 벡터: (${averageVector.x.toFixed(2)}, ${averageVector.y.toFixed(2)})`;
              }
              return `x: ${(point.x / scaleFactor).toFixed(2)}, y: ${(point.y / scaleFactor).toFixed(2)}`;
            }
          }
        }
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

        ctx.beginPath();
        ctx.moveTo(x0, area.top);
        ctx.lineTo(x0, area.bottom);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(area.left, y0);
        ctx.lineTo(area.right, y0);
        ctx.stroke();

        ctx.restore();
      }
    }]
  });

  return averageVector;  // 평균 벡터 반환
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
  const map = {};
  diaries.forEach(d => {
    const date = new Date(d.date).toISOString().slice(0, 10);
    map[date] = { emotion: d.emotion, title: d.title || '' };
  });

 
  const points = diaries
    .sort((a, b) => new Date(a.date) - new Date(b.date))  
    .map(d => {
      const dateStr = new Date(d.date).toISOString().slice(0, 10);
      const info = map[dateStr];
      const vec = emotionVectorMap[info.emotion];
      return vec ? {
        x: vec.x,
        y: vec.y,
        date: dateStr,
        emotion: info.emotion,
        title: info.title
      } : null;
    })
    .filter(Boolean); 

  return points;
}