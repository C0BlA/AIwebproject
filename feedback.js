// 감정 분석 및 피드백 생성 시스템

// 감정 벡터 분석 함수
function analyzeEmotionTrend(vectorPoints) {
  if (!vectorPoints || vectorPoints.length === 0) {
    return null;
  }

  // 평균 벡터 계산
  const averageVector = calculateAverageVector(vectorPoints);

  return {
    averageVector,
    weeklyData: vectorPoints
  };
}

// 피드백 영역 정의
const feedbackZones = {
  positiveHigh: {  // 제1사분면: 긍정적 + 고각성
    x: { min: 0, max: 12 },
    y: { min: 0, max: 12 },
    feedback: {
      message: "매우 활발하고 긍정적인 감정 상태를 보이고 있습니다.",
      suggestions: [
        "이러한 긍정적인 에너지를 유지하기 위한 활동을 기록해보세요",
        "이 시기의 긍정적인 경험들을 더 자주 만들어보세요",
        "주변 사람들과 긍정적인 에너지를 나누어보세요"
      ]
    }
  },
  positiveLow: {   // 제4사분면: 긍정적 + 저각성
    x: { min: 0, max: 12 },
    y: { min: -12, max: 0 },
    feedback: {
      message: "평온하고 안정적인 긍정적 감정 상태입니다.",
      suggestions: [
        "이러한 평화로운 상태를 유지하는 데 도움이 되는 활동을 기록해보세요",
        "마음의 평화를 찾는 방법들을 더 자주 실천해보세요",
        "명상이나 요가와 같은 활동을 시도해보세요"
      ]
    }
  },
  negativeHigh: {  // 제2사분면: 부정적 + 고각성
    x: { min: -12, max: 0 },
    y: { min: 0, max: 12 },
    feedback: {
      message: "스트레스나 불안감이 높은 상태입니다.",
      suggestions: [
        "스트레스 해소를 위한 활동을 찾아보세요",
        "깊은 호흡 운동이나 명상을 시도해보세요",
        "전문가의 상담을 고려해보세요",
        "규칙적인 운동을 시작해보세요"
      ]
    }
  },
  negativeLow: {   // 제3사분면: 부정적 + 저각성
    x: { min: -12, max: 0 },
    y: { min: -12, max: 0 },
    feedback: {
      message: "우울감이나 무기력감이 있는 상태입니다.",
      suggestions: [
        "활동량을 점진적으로 늘려보세요",
        "일상에서 작은 성취를 만들어보세요",
        "전문가의 상담을 고려해보세요",
        "규칙적인 생활 패턴을 만들어보세요"
      ]
    }
  }
};

// 피드백 생성 함수
function generateFeedback(analysis) {
  if (!analysis) return null;

  const { averageVector } = analysis;
  
  // 벡터 위치에 따른 영역 결정
  const zone = determineZone(averageVector);
  const feedback = feedbackZones[zone].feedback;

  return {
    message: feedback.message,
    suggestions: feedback.suggestions,
    vector: averageVector,
    zone: zone
  };
}

// 벡터 위치에 따른 영역 결정 함수
function determineZone(vector) {
  if (vector.x >= 0 && vector.y >= 0) return 'positiveHigh';
  if (vector.x >= 0 && vector.y < 0) return 'positiveLow';
  if (vector.x < 0 && vector.y >= 0) return 'negativeHigh';
  return 'negativeLow';
}

// 피드백 표시 함수
function displayFeedback(feedback) {
  if (!feedback) return;

  const modal = document.createElement('div');
  modal.className = 'feedback-modal';
  modal.innerHTML = `
    <div class="feedback-content">
      <h3>3주 감정 분석 결과</h3>
      <div class="vector-position">
        <p>감정 벡터 위치: (${feedback.vector.x.toFixed(2)}, ${feedback.vector.y.toFixed(2)})</p>
      </div>
      <p class="feedback-message">${feedback.message}</p>
      <div class="feedback-solutions">
        <h4>제안사항</h4>
        <ul>
          ${feedback.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
        </ul>
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