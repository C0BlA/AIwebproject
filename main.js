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
    console.log("💾 저장된 토큰:", data.token);
    closeLogin();    
    updateAuthUI();
    window.location.reload();
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
  } else {
    authButtons.style.display = 'inline-block';
    userInfo.style.display = 'none';
    welcomeMsg.textContent = '';
  }
}

// 초기 실행 시 로그인 상태 반영
window.addEventListener('load', () => {
  updateAuthUI();
});


//다이어리 저장
async function saveDiary(dateStr) {
  const title = document.getElementById('diary-title-input').value;
  const text = document.getElementById('diary-text-input').value;
  const imageFile = document.getElementById('diary-image-input').files[0];
  const token = localStorage.getItem('token');

  const formData = new FormData();
  formData.append('date', dateStr);
  formData.append('emoji', currentEmoji);
  formData.append('title', title);
  formData.append('text', text);
  if (imageFile) {
    formData.append('image', imageFile);
  }
  // 서버에 저장 요청
  const res = await fetch('http://localhost:3000/api/diaries', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  });
  

  const data = await res.json();
  if (res.ok) {
    alert("다이어리가 저장되었습니다!");
    showDiary(dateStr);  // 저장 후 화면 갱신
  } else {
    alert(data.error || '저장 실패');
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
      container.innerHTML = `
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

// 수정된 내용 저장
async function updateDiary(dateStr) {
  const title = document.getElementById('diary-title-input').value;
  const text = document.getElementById('diary-text-input').value;
  const imageFile = document.getElementById('diary-image-input').files[0];
  const token = localStorage.getItem('token');

  const formData = new FormData();
  formData.append('date', dateStr);
  formData.append('title', title);
  formData.append('text', text);
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
    showDiary(dateStr);
  } else {
    alert(data.error || "수정 실패");
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
              <h2>${data.title}</h2>
              <p>${data.text}</p>
              ${data.imageData ? `<img src="data:image/png;base64,${data.imageData}" alt="이미지" style="max-width: 300px;" />` : ''}
              <div class="diary-buttons">
                <button onclick="editDiary('${dateStr}')">수정</button>
                <button onclick="deleteDiary('${dateStr}')">삭제</button>
              </div>
            `;
          } else {
            container.innerHTML = `
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
    cancelDiary(); 
  } else {
    alert(data.error || "삭제 실패");
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