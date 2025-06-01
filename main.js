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
            link.textContent = `${diary.date}: ${diary.title} (${diary.weather || '날씨 없음'})`;
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



  //다이어리 저장
  async function saveDiary(dateStr) {
    console.log("✅ saveDiary 호출됨", dateStr); 
    const title = document.getElementById('diary-title-input').value;
    const text = document.getElementById('diary-text-input').value;
    const imageFile = document.getElementById('diary-image-input').files[0];
    const token = localStorage.getItem('token');

     console.log("📌 받은 토큰:", token); 
    // const weather = document.querySelector('input[name="weather"]:checked')?.value;
    const weather = getSelectedWeather();

    const formData = new FormData();
    formData.append('date', dateStr);
    formData.append('title', title);
    formData.append('text', text);
    formData.append('weather', weather || ''); 
    if (imageFile) {
      formData.append('image', imageFile);
    }

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

      // 캘린더에 날씨 바로 반영!
      const cell = document.querySelector(`[data-date="${dateStr}"]`);
      if (cell) {
        cell.innerHTML = `
          <span style="font-size:20px;">${weather}</span><br>
          ${parseInt(dateStr.split('-')[2], 10)}
        `;
      }
    }

  }


  //다이어리 불러오기
  async function showDiary(dateStr) {
    const container = document.getElementById('diary-container');
    const token = localStorage.getItem('token');

    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/diaries/${dateStr}`, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      const data = await res.json();

      if (res.ok) {
        container.innerHTML = `
          <h4>${dateStr}</h4>
          <h2>오늘의 기분: ${data.weather}</h2>
          <h2>${data.title}</h2>
          <p>${data.text}</p>
          ${data.imageData ? `<img src="data:image/png;base64,${data.imageData}" alt="이미지" style="max-width: 300px;" />` : ''}
          <div class="diary-buttons">
            <button onclick="editDiary('${dateStr}')">수정</button>
            <button onclick="deleteDiary('${dateStr}')">삭제</button>
          </div>
        `;
      } else {
        
        // 저장된 다이어리가 없는 경우
        container.innerHTML = `
          <div id="weather-selection">
            <h4>${dateStr}</h4>
            <label>
              <input type="radio" name="weather" value="☀️" />
              ☀️맑음
            </label>
            <label>
              <input type="radio" name="weather" value="☁️" />
              ☁️흐림
            </label>
            <label>
              <input type="radio" name="weather" value="☔" />
              ☔비
            </label>
            <label>
              <input type="radio" name="weather" value="🌩️" />
              🌩️번개
            </label>
            <label>
              <input type="radio" name="weather" value="❄️" />
              ❄️눈
            </label>
          </div>

          <input type="text" id="diary-title-input" placeholder="제목을 입력하세요" />
          <textarea id="diary-text-input" rows="5" placeholder="내용을 입력하세요"></textarea>
          <input type="file" id="diary-image-input" accept="image/*" />

          <div class="diary-buttons">
            <button onclick="saveDiary('${dateStr}')">저장</button>
            <button onclick="cancelDiary()">취소</button>
          </div>
        `;

      }
    } catch (err) {
      alert("다이어리 로드 실패");
    }
  }


  //다이어리 수정
  function editDiary(dateStr) {
    const container = document.getElementById('diary-container');

    fetch(`http://localhost:3000/api/diaries/${dateStr}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    })
      .then(res => res.json())
      .then(data => {
        const weatherOptions = [
          { emoji: "☀️", label: "맑음" },
          { emoji: "☁️", label: "흐림" },
          { emoji: "☔", label: "비" },
          { emoji: "🌩️", label: "번개" },
          { emoji: "❄️", label: "눈" }
        ];

        const weatherHTML = `
          <div id="weather-selection">
            ${weatherOptions.map(opt => `
              <label>
                <input type="radio" name="weather" value="${opt.emoji}" ${data.weather === opt.emoji ? "checked" : ""} />
                ${opt.emoji} ${opt.label}
              </label>
            `).join('')}
          </div>
        `;

        container.innerHTML = `
          <h3>${dateStr}</h3>
          ${weatherHTML}
          <input type="text" id="diary-title-input" value="${data.title}" />
          <textarea id="diary-text-input" rows="5">${data.text}</textarea>
          ${data.imageData 
            ? `<img src="data:image/png;base64,${data.imageData}" style="max-width: 300px;" alt="기존 이미지" />`
            : ''
          }

          <p>이미지 변경:</p>
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
    const token = localStorage.getItem('token');
    const weather = document.querySelector('input[name="weather"]:checked')?.value;

    const formData = new FormData();
    formData.append('date', dateStr);
    formData.append('title', title);
    formData.append('text', text);
    formData.append('weather', weather || '');
    if (imageFile) {
      formData.append('image', imageFile); 
    }

    const res = await fetch(`http://localhost:3000/api/diaries/${dateStr}`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      alert("다이어리 수정 완료!");
      diaryDataByDate[dateStr] = data.diary;
      showDiary(dateStr);
      const cell = document.querySelector(`[data-date="${dateStr}"]`);
      if (cell) {
        cell.innerHTML = `
          <span style="font-size:20px;">${weather}</span><br>
          ${parseInt(dateStr.split('-')[2], 10)}
        `;
      } else {
      alert(data.error || "수정 실패");
      }
    }
  }




  //다이어리 수정 취소
  async function cancelDiary(dateStr) {
        const token = localStorage.getItem('token');
        const container = document.getElementById('diary-container');
        try {
            const res = await fetch(`http://localhost:3000/api/diaries/${dateStr}`, {
            headers: {
              'Authorization': 'Bearer ' + token
            }
            });

            const data = await res.json();

            if (res.ok) {
              container.innerHTML = `
                 <h4>${dateStr}</h4>
                <h2>오늘의 기분: ${data.weather}</h2>
                <h2>${data.title}</h2>
                <p>${data.text}</p>
                ${data.imageData ? `<img src="data:image/png;base64,${data.imageData}" alt="이미지" style="max-width: 300px;" />` : ''}
                <div class="diary-buttons">
                  <button onclick="editDiary('${dateStr}')">수정</button>
                  <button onclick="deleteDiary('${dateStr}')">삭제</button>
                </div>
              `;
            } else {
              //작성된 다이어리 없는 경우
              container.innerHTML = `
              <div id="weather-selection">
                <h4>${dateStr}</h4>
                <label><input type="radio" name="weather" value="☀️" /> ☀️맑음</label>
                <label><input type="radio" name="weather" value="☁️" /> ☁️흐림</label>
                <label><input type="radio" name="weather" value="☔" /> ☔비</label>
                <label><input type="radio" name="weather" value="🌩️" /> 🌩️번개</label>
                <label><input type="radio" name="weather" value="❄️" /> ❄️눈</label>
              </div>
                <input type="text" id="diary-title-input" placeholder="제목을 입력하세요" />
                <textarea id="diary-text-input" rows="5" placeholder="내용을 입력하세요"></textarea>
                <input type="file" id="diary-image-input" accept="image/*" />
                <div class="diary-buttons">
                  <button onclick="saveDiary('${dateStr}')">저장</button>
                  <button onclick="cancelDiary()">취소</button>
                </div>
              `;
            }
        } catch (err) {
          alert("다이어리 로드 실패");
          }
  }


  //다이어리 삭제
  async function deleteDiary(dateStr) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`http://localhost:3000/api/diaries/${dateStr}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const data = await res.json();
    if (res.ok) {
      alert("삭제 완료");
      // cancelDiary();
      showDiary(dateStr);
      updateRecentDiaries(); 
      const cell = document.querySelector(`[data-date="${dateStr}"]`);
      if (cell) {
        cell.innerHTML = `
          <br>${parseInt(dateStr.split('-')[2], 10)}
        `;
      }
      delete diaryDataByDate[dateStr];
    } else {
      alert(data.error || "삭제 실패");
    }
  }

  //최근 다이어리
  async function updateRecentDiaries() {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:3000/api/diaries/recent', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (!res.ok) {
        throw new Error(` 최근 다이어리 불러오기 실패 (${res.status})`);
      }

      const diaries = await res.json();

      const recentList = document.getElementById('recent-diary-list');
      recentList.innerHTML = '';

      diaries.slice(0, 5).forEach(diary => { //5개까지만
        const li = document.createElement('li');

        const link = document.createElement('a');
        link.href = '#';
        link.textContent = `${diary.date}: ${diary.title} (${diary.weather || '날씨 없음'})`;

        link.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = `/index.html?date=${diary.date}`;
        });

        li.appendChild(link);
        recentList.appendChild(li);
      });

      } catch (err) {
        console.error('updateRecentDiaries 오류:', err);
      }
    }


async function loadEmojiArray() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3000/api/diaries/recent/21`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    const emojiArray = data.map(entry => entry.weather || '❓');

    if (emojiArray.length !== 21) {
      console.warn(`⛔ 이모지 개수 부족 (${emojiArray.length}/21). 채워 넣습니다.`);
      while (emojiArray.length < 21) {
        emojiArray.unshift('❓');
      }
    }

    return emojiArray;
  } catch (error) {
    console.error('loadEmojiArray 에러:', error);
    // 실패했을 때 21개 ❓ 배열을 반환하도록 안전장치
    return Array(21).fill('❓');
  }
}




  // 오늘-기준 1주일 데이터 저장용 (날짜 → {temp, humid, emoji})
  const moodWeek = {};
  // 1주일 기준으로 분석
  const DAYS_IN_WEEK = 7;

  function plotMoodPoint(dateKey, temp, humid, emoji) {
    const canvas = document.getElementById("moodCanvas");
    const ctx = canvas.getContext("2d");

    // 온도 0~40, 습도 0~100을 캔버스 좌표로 변환
    const x = 40 + (temp / 40) * (canvas.width - 60);
    const y = canvas.height - 40 - (humid / 100) * (canvas.height - 60);

    // 이모지를 텍스트로 찍기
    ctx.font = "24px sans-serif";
    ctx.fillText(emoji, x - 12, y + 8);

    // 데이터 저장/갱신
    moodWeek[dateKey] = { temp, humid, emoji };

    // 1주일(7개) 채워졌으면 분석 실행
    if (Object.keys(moodWeek).length === DAYS_IN_WEEK) {
      analyzeWeek();
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
      diaryDataByDate[diary.date] = diary;  // 전체 diary 객체 저장
    });

    // ✅ 3주치 데이터만 추출 (최신 주차 포함해서 총 21일치)
    const today = new Date();
    const weatherEmojis = [];

    for (let i = 20; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const diary = diaryDataByDate[dateStr];
      if (diary && diary.weatherEmoji) {
        weatherEmojis.push(diary.weatherEmoji);
      } else {
        weatherEmojis.push(null); // 값 없을 땐 null로
      }
    }

    try {
      const processedVectors = processWeatherVectors(weatherEmojis, emojiToVector);
      drawWeatherRadialChart(weatherEmojis);
      drawEmotionLineGraph(processedVectors);
    } catch (err) {
      console.error("감정 분석 실패:", err.message);
    }
  }
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("로그인이 필요합니다.");
    return;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  try {
    const res = await fetch(`http://localhost:3000/api/diaries/month?year=${year}&month=${String(month + 1).padStart(2, '0')}`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (!res.ok) throw new Error("데이터 요청 실패");

    const data = await res.json();
    const weatherEmojis = [];

    // 최근 3주간 날짜 기준으로 정렬
    const todayStr = today.toISOString().split('T')[0];
    const byDate = {};
    data.forEach(d => byDate[d.date] = d);

    for (let i = 20; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const diary = byDate[dateStr];
      if (diary && diary.weather) {
        weatherEmojis.push(diary.weather);
      } else {
        weatherEmojis.push(null);
      }
    }

    const vectors = processWeatherVectors(weatherEmojis, emojiToVector);
    drawWeatherRadialChart(weatherEmojis);
    drawEmotionLineGraph(vectors);

  } catch (err) {
    console.error("분석 실패:", err);
  }
});




