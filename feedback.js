// 감정 분석 및 피드백 생성 시스템

// 감정 벡터 분석 함수
function analyzeEmotionTrend(vectorPoints) {
  if (!vectorPoints || vectorPoints.length === 0) {
    return null;
  }

  // 가중치 설정 (최근 데이터에 더 높은 가중치)
  const weights = [0.5, 0.7, 1.0];
  
  // 주차별 데이터 분리
  const weeklyData = [[], [], []];
  vectorPoints.forEach((point, index) => {
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

  const averageVector = {
    x: weightedSum.x / totalWeight,
    y: weightedSum.y / totalWeight
  };

  // 감정 변화 추이 분석
  const trend = {
    direction: calculateTrendDirection(weeklyData),
    intensity: calculateTrendIntensity(weeklyData),
    consistency: calculateEmotionConsistency(weeklyData)
  };

  return {
    averageVector,
    trend,
    weeklyData
  };
}

// 감정 변화 방향 계산
function calculateTrendDirection(weeklyData) {
  const weeklyAverages = weeklyData.map(week => {
    const sum = week.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });
    return {
      x: sum.x / week.length,
      y: sum.y / week.length
    };
  });

  // x축(Valence) 변화 확인
  const valenceChange = weeklyAverages[2].x - weeklyAverages[0].x;
  
  if (Math.abs(valenceChange) < 0.5) return 'stable';
  return valenceChange > 0 ? 'improving' : 'declining';
}

// 감정 변화 강도 계산
function calculateTrendIntensity(weeklyData) {
  const weeklyAverages = weeklyData.map(week => {
    const sum = week.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });
    return {
      x: sum.x / week.length,
      y: sum.y / week.length
    };
  });

  const maxChange = Math.max(
    Math.abs(weeklyAverages[2].x - weeklyAverages[0].x),
    Math.abs(weeklyAverages[2].y - weeklyAverages[0].y)
  );

  return maxChange;
}

// 감정 일관성 계산
function calculateEmotionConsistency(weeklyData) {
  const weeklyVariances = weeklyData.map(week => {
    const avg = week.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });
    
    avg.x /= week.length;
    avg.y /= week.length;

    const variance = week.reduce((acc, point) => {
      return acc + Math.pow(point.x - avg.x, 2) + Math.pow(point.y - avg.y, 2);
    }, 0) / week.length;

    return variance;
  });

  return 1 - (weeklyVariances.reduce((a, b) => a + b, 0) / weeklyVariances.length);
}

// 피드백 생성 함수
function generateFeedback(analysis) {
  if (!analysis) return null;

  const { averageVector, trend } = analysis;
  
  // 기본 피드백 카테고리
  const feedbackCategories = {
    positive: {
      highEnergy: [
        "매우 활발하고 긍정적인 에너지가 느껴집니다!",
        "이런 에너지를 유지하시면 좋을 것 같아요.",
        "당신의 긍정적인 에너지가 주변 사람들에게도 좋은 영향을 미칠 거예요."
      ],
      lowEnergy: [
        "평온하고 만족스러운 시간을 보내고 계시네요.",
        "이런 안정적인 감정 상태가 계속되길 바랍니다.",
        "마음의 평화를 잘 유지하고 계시네요."
      ]
    },
    negative: {
      highEnergy: [
        "스트레스나 불안이 있으신가요?",
        "이런 감정을 해소할 수 있는 방법을 찾아보는 건 어떨까요?",
        "지금의 감정을 이해하고 받아들이는 것이 중요해요."
      ],
      lowEnergy: [
        "우울감이나 무기력함이 느껴집니다.",
        "이런 감정을 나누고 싶으시다면 언제든 이야기해주세요.",
        "지금은 힘든 시기일 수 있지만, 곧 좋아질 거예요."
      ]
    }
  };

  // 해결 방안
  const solutions = {
    stress: [
      "짧은 산책이나 스트레칭을 해보세요.",
      "좋아하는 음악을 들어보는 건 어떨까요?",
      "친구나 가족과 대화를 나누어보세요.",
      "깊은 호흡 운동을 해보세요.",
      "취미 활동을 시작해보세요."
    ],
    depression: [
      "규칙적인 운동을 시작해보세요.",
      "일기 쓰기를 통해 감정을 정리해보세요.",
      "전문가의 도움을 받아보는 것도 좋은 방법입니다.",
      "충분한 수면을 취하세요.",
      "건강한 식습관을 유지하세요."
    ]
  };

  // 감정 상태에 따른 피드백 선택
  const isPositive = averageVector.x > 0;
  const isHighEnergy = averageVector.y > 0;
  
  const category = isPositive ? 'positive' : 'negative';
  const energy = isHighEnergy ? 'highEnergy' : 'lowEnergy';
  
  const feedback = {
    message: feedbackCategories[category][energy][Math.floor(Math.random() * 3)],
    solutions: isPositive ? [] : solutions[isHighEnergy ? 'stress' : 'depression'].slice(0, 3),
    trend: trend,
    vector: averageVector
  };

  return feedback;
}

// 피드백 표시 함수
function displayFeedback(feedback) {
  if (!feedback) return;

  const modal = document.createElement('div');
  modal.className = 'feedback-modal';
  modal.innerHTML = `
    <div class="feedback-content">
      <h3>3주 감정 분석 결과</h3>
      <p class="feedback-message">${feedback.message}</p>
      ${feedback.solutions.length > 0 ? `
        <div class="feedback-solutions">
          <h4>추천 해결 방안</h4>
          <ul>
            ${feedback.solutions.map(solution => `<li>${solution}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      <div class="feedback-trend">
        <p>감정 변화 추이: ${feedback.trend.direction === 'improving' ? '개선 중' : 
                          feedback.trend.direction === 'declining' ? '하락 중' : '안정적'}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()">닫기</button>
    </div>
  `;

  document.body.appendChild(modal);
}

// 3주 감정 분석 실행 함수
async function runEmotionAnalysis() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("http://localhost:3000/api/diaries/recent", {
      headers: { Authorization: "Bearer " + token }
    });
    const diaries = await res.json();

    const today = new Date();
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(today.getDate() - 20);

    const filtered = diaries
      .filter(d => new Date(d.date) >= threeWeeksAgo)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const vectorPoints = generateEmotionHistoryPoints(filtered);
    const analysis = analyzeEmotionTrend(vectorPoints);
    const feedback = generateFeedback(analysis);
    
    displayFeedback(feedback);
  } catch (error) {
    console.error('감정 분석 중 오류 발생:', error);
  }
} 