  
  // 로그인
  function openLogin() {
    document.getElementById('login-modal').style.display = 'flex';
  }
  function closeLogin() {
    document.getElementById('login-modal').style.display = 'none';
  }

  async function login() {
    const username = document.getElementById('login-id').value;
    const password = document.getElementById('login-pw').value;

    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    console.log("🚀 로그인 응답:", data);

    if (res.ok) {
      alert("로그인 성공");
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', username);
      updateAuthUI(); // UI 상태 업데이트
      updateRecentDiaries(); // 로그인하자마자 최근 다이어리 불러오기
      closeLogin(); // 모달 닫기
      
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const dateStr = today.toISOString().slice(0, 10);

      // 캘린더 다시 그린 뒤 오늘 날짜 자동 선택
      await generateCalendar(month, year);
      showDiary(dateStr);
      } else {
          alert(data.error || '로그인 실패');
        }
      }


  //회원가입
  function openRegister() {
    document.getElementById('register-modal').style.display = 'flex';
  }
  function closeRegister() {
    document.getElementById('register-modal').style.display = 'none';
  }

  async function register() {
    const username = document.getElementById('register-id').value;
    const password = document.getElementById('register-pw').value;

    if (!username || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    const res = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
      alert("회원가입 성공! 이제 로그인해주세요.");
      closeRegister();
    } else {
      alert(data.error || "회원가입 실패");
    }
  }

  //로그아웃
    function logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      updateAuthUI();
      window.location.reload();
    }

  // 사용자 인증 UI 업데이트
  function updateAuthUI() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');

    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const welcomeMsg = document.getElementById('welcome-msg');

    if (token && username) {
      authButtons.style.display = 'none';
      userInfo.style.display = 'inline-block';
      welcomeMsg.textContent = `환영합니다, ${username}`;
      updateRecentDiaries(); 

      // 로그인된 경우에만 다이어리 불러오기
      fetch('http://localhost:3000/api/diaries', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      })
        .then(res => res.json())
        .then(data => {
          const list = document.getElementById('recent-diary-list');
          list.innerHTML = '';
          data.forEach(diary => {
            const li = document.createElement('li');

            const link = document.createElement('a');
            link.href = '#'; 
            link.textContent = `${diary.date}: ${diary.title} (${diary.emotion || '날씨 없음'})`;
            link.onclick = (e) => {
              e.preventDefault(); 
              showDiary(diary.date); 
            };

            li.appendChild(link);
            list.appendChild(li);
          });
        })
        .catch(err => {
          console.error('다이어리 불러오기 실패:', err);
        });

    } else {
      authButtons.style.display = 'inline-block';
      userInfo.style.display = 'none';
      welcomeMsg.textContent = '';
    }
  }

  // 초기 실행 시 로그인 상태 반영
  window.addEventListener('load', async () => {
  updateAuthUI();

  const token = localStorage.getItem('token');
  if (token) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const dateStr = today.toISOString().slice(0, 10);

    await generateCalendar(month, year);
    showDiary(dateStr);
  }
});



const emotionMap = {
  1: [ { label: "들뜬 🤩", value: "🤩" }, { label: "행복한 😊", value: "😊" } ],
  2: [ { label: "긴장한 😬", value: "😬" }, { label: "불쾌한 😠", value: "😠" }, { label: "압박스러운 😰", value: "😰" } ],
  3: [ { label: "지친 😪", value: "😪" }, { label: "우울한 😞", value: "😞" }, { label: "슬픈 😢", value: "😢" }, { label: "속상한 😣", value: "😣" } ],
  4: [ { label: "평화로운 🧘", value: "🧘" }, { label: "편안한 😴", value: "😴" }, { label: "익숙한 😌", value: "😌" }, { label: "즐거운 😄", value: "😄" } ]
};

function onQuadrantChange(quadrant) {
  const select = document.getElementById('emotion-detail');
  select.innerHTML = '';
  if (emotionMap[quadrant]) {
    emotionMap[quadrant].forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });
  }
}

function getSelectedEmotion() {
  return document.getElementById('emotion-detail')?.value || '';
}

async function saveDiary(dateStr) {
  const title = document.getElementById('diary-title-input').value;
  const text = document.getElementById('diary-text-input').value;
  const imageFile = document.getElementById('diary-image-input').files[0];
  const emotion = getSelectedEmotion();
  const token = localStorage.getItem('token');

  const formData = new FormData();
  formData.append('date', dateStr);
  formData.append('title', title);
  formData.append('text', text);
  formData.append('emotion', emotion);
  if (imageFile) formData.append('image', imageFile);

  const res = await fetch('http://localhost:3000/api/diaries', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  });

  const data = await res.json();
  if (res.ok) {
    alert("다이어리가 저장되었습니다!");
    showDiary(dateStr);
    updateRecentDiaries();
    const cell = document.querySelector(`[data-date="${dateStr}"]`);
    if (cell) {
      cell.innerHTML = `<span style="font-size:20px;">${emotion}</span><br>${parseInt(dateStr.split('-')[2])}`;
    }
  }
}

async function showDiary(dateStr) {
  // 미래 날짜 체크
  const selectedDate = new Date(dateStr);
  const today = new Date();
  today.setHours(24, 0, 0, 0); // 시간을 24:00:00으로 설정하여 날짜만 비교

  if (selectedDate > today) {
    alert('미래의 날짜는 선택할 수 없습니다.');
    return;
  }

  const container = document.getElementById('diary-container');
  const token = localStorage.getItem('token');

  const res = await fetch(`http://localhost:3000/api/diaries/${dateStr}`, {
    headers: { Authorization: 'Bearer ' + token }
  });

  if (res.status === 404) {
    container.innerHTML = `
      <h4>${dateStr}</h4>
      <div id="emotion-selection">
        <div>
          <label><input type="radio" name="quadrant" value="1" onchange="onQuadrantChange(1)"> 🤩</label>
          <label><input type="radio" name="quadrant" value="2" onchange="onQuadrantChange(2)"> 😬</label>
          <label><input type="radio" name="quadrant" value="3" onchange="onQuadrantChange(3)"> 😪</label>
          <label><input type="radio" name="quadrant" value="4" onchange="onQuadrantChange(4)"> 🧘</label>
        </div>
        <select id="emotion-detail"><option>먼저 분면을 선택하세요</option></select>
      </div>
      <input type="text" id="diary-title-input" placeholder="제목을 입력하세요" />
      <textarea id="diary-text-input" rows="5" placeholder="내용을 입력하세요"></textarea>
      <input type="file" id="diary-image-input" accept="image/*" />
      <div class="diary-buttons">
        <button onclick="saveDiary('${dateStr}')">저장</button>
        <button onclick="cancelDiary('${dateStr}')">취소</button>
      </div>
    `;
  } else {
    const data = await res.json();
    container.innerHTML = `
      <h4>${dateStr}</h4>
      <h2>오늘의 감정: ${data.emotion}</h2>
      <h2>${data.title}</h2>
      <p>${data.text}</p>
      ${data.imageData ? `<img src="data:image/png;base64,${data.imageData}" alt="이미지" style="max-width:300px;" />` : ''}
      <div class="diary-buttons">
        <button onclick="editDiary('${dateStr}')">수정</button>
        <button onclick="deleteDiary('${dateStr}')">삭제</button>
      </div>
    `;
  }
}

function editDiary(dateStr) {
  fetch(`http://localhost:3000/api/diaries/${dateStr}`, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  }).then(res => res.json()).then(data => {
    const container = document.getElementById('diary-container');

    container.innerHTML = `
      <h3>${dateStr}</h3>
      <div id="emotion-selection">
        <div>
          <label><input type="radio" name="quadrant" value="1" onchange="onQuadrantChange(1)"> 😊</label>
          <label><input type="radio" name="quadrant" value="2" onchange="onQuadrantChange(2)"> 😬</label>
          <label><input type="radio" name="quadrant" value="3" onchange="onQuadrantChange(3)"> 😪</label>
          <label><input type="radio" name="quadrant" value="4" onchange="onQuadrantChange(4)"> 🧘</label>
        </div>
        <select id="emotion-detail">
          <option value="${data.emotion}" selected>${data.emotion}</option>
        </select>
      </div>
      <input type="text" id="diary-title-input" value="${data.title}" />
      <textarea id="diary-text-input" rows="5">${data.text}</textarea>
      ${data.imageData ? `<img src="data:image/png;base64,${data.imageData}" style="max-width:300px;" />` : ''}
      <input type="file" id="diary-image-input" accept="image/*" />
      <div class="diary-buttons">
        <button onclick="updateDiary('${dateStr}')">저장</button>
        <button onclick="cancelDiary('${dateStr}')">취소</button>
      </div>
    `;
  });
}

async function updateDiary(dateStr) {
  const title = document.getElementById('diary-title-input').value;
  const text = document.getElementById('diary-text-input').value;
  const imageFile = document.getElementById('diary-image-input').files[0];
  const emotion = getSelectedEmotion();
  const token = localStorage.getItem('token');

  const formData = new FormData();
  formData.append('title', title);
  formData.append('text', text);
  formData.append('emotion', emotion);
  if (imageFile) formData.append('image', imageFile);

  const res = await fetch(`http://localhost:3000/api/diaries/${dateStr}`, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + token },
    body: formData
  });

  const data = await res.json();
  const diaryDataByDate = {};
  if (res.ok) {
    alert("수정 완료!");
    diaryDataByDate[dateStr] = data.diary;
    showDiary(dateStr);
  }
}

async function deleteDiary(dateStr) {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  const token = localStorage.getItem('token');

  const res = await fetch(`http://localhost:3000/api/diaries/${dateStr}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token }
  });

  const data = await res.json();
  if (res.ok) {
    alert("삭제 완료");
    showDiary(dateStr);
    updateRecentDiaries();
    const cell = document.querySelector(`[data-date="${dateStr}"]`);
    if (cell) {
      cell.innerHTML = `<br>${parseInt(dateStr.split('-')[2])}`;
    }
    delete diaryDataByDate[dateStr];
  } else {
    alert(data.error || "삭제 실패");
  }
}

async function cancelDiary(dateStr) {
  const token = localStorage.getItem('token');
  const container = document.getElementById('diary-container');

  const res = await fetch(`http://localhost:3000/api/diaries/${dateStr}`, {
    headers: { Authorization: 'Bearer ' + token }
  });

  const data = await res.json();

  if (res.ok) {
    container.innerHTML = `
      <h4>${dateStr}</h4>
      <h2>오늘의 감정: ${data.emotion}</h2>
      <h2>${data.title}</h2>
      <p>${data.text}</p>
      ${data.imageData ? `<img src="data:image/png;base64,${data.imageData}" alt="이미지" style="max-width: 300px;" />` : ''}
      <div class="diary-buttons">
        <button onclick="editDiary('${dateStr}')">수정</button>
        <button onclick="deleteDiary('${dateStr}')">삭제</button>
      </div>
    `;
  } else {
    showDiary(dateStr);
  }
}

async function updateRecentDiaries() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('http://localhost:3000/api/diaries/recent', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const diaries = await res.json();
    const recentList = document.getElementById('recent-diary-list');
    recentList.innerHTML = '';
    diaries.slice(0, 5).forEach(diary => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = `${diary.date}: ${diary.title} (${diary.emotion || '감정 없음'})`;
      link.onclick = (e) => {
        e.preventDefault();
        showDiary(diary.date);
      };
      li.appendChild(link);
      recentList.appendChild(li);
    });
  } catch (err) {
    console.error('최근 다이어리 불러오기 실패:', err);
  }
}


  //선택한 날씨 데이터 가져오기
  async function fetchMonthlyDiaries(year, month) {
  diaryDataByDate = {}; // 초기화

  const token = localStorage.getItem('token');
  const res = await fetch(`http://localhost:3000/api/diaries/month?year=${year}&month=${String(month + 1).padStart(2, '0')}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    console.error("다이어리 데이터 불러오기 실패:", res.status);
    return;
  }

  const diaries = await res.json();

  diaries.forEach(diary => {
    diaryDataByDate[diary.date] = diary;  // 여기서 전체 diary 객체 저장!
  });
}

function togglePlayer() {
  const player = document.querySelector('.footer-player');
  const toggleBtn = document.querySelector('.player-toggle-btn');
  player.classList.toggle('hidden');
  toggleBtn.textContent = player.classList.contains('hidden') ? '🎵 음악 플레이어' : '▼ 음악 플레이어';
}

document.getElementById('analyzeMoodBtn').addEventListener('click', async () => {
  const token = localStorage.getItem("token");
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

  const emotionCounts = countEmotionLabels(filtered);
  const vectorPoints = generateEmotionHistoryPoints(filtered);

  // 기존 차트 표시
  const container = document.getElementById("diary-container");
  const startDate = new Date(filtered[0].date).toLocaleDateString();
  const endDate = new Date(filtered[filtered.length - 1].date).toLocaleDateString();
  
  container.innerHTML = `
    <h2>최근 3주 감정 분석</h2>
    <p style="color: #666; margin-bottom: 15px;">분석 기간: ${startDate} ~ ${endDate}</p>
    <div style="margin-bottom: 10px;">
      <button id="toggleChartBtn" onclick="toggleMoodChart()">다른 분석 보러가기</button>
    </div>
    <canvas id="quadrantPieChart" width="250" height="250" style="display: block; width: 100%; height: 100%;"></canvas>
    <canvas id="moodVectorChart" width="250" height="250" style="display: none; width: 100%; height: 100%;"></canvas>
  `;

  drawEmotionPieChart(emotionCounts);
  drawMoodVector(null, vectorPoints);

  // 피드백 시스템 실행
  runEmotionAnalysis();
});





