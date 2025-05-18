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
  if (res.ok) {
    alert("로그인 성공");
    localStorage.setItem('token', data.token);
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
