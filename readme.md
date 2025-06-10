    감정 다이어리 (Emotion Diary)
개인의 감정 상태를 기록하고, 최근 3주간의 감정 데이터를 분석하여 시각화 및 피드백을 제공하는 감정 기반 다이어리 웹 애플리케이션입니다.

 주요 기능
회원가입 / 로그인
    JWT 기반 인증을 통한 사용자 식별

    감정 다이어리 작성

    날짜별 다이어리 작성 및 감정 선택 (이모지 기반)

    텍스트 및 이미지 첨부 가능

    다이어리 수정 및 삭제 기능 포함

    감정 시각화 및 분석

    최근 3주 감정 데이터를 바탕으로 분석

    감정 분포 파이차트 및 감정 벡터 이동 그래프 제공

    평균 감정 벡터 기반 피드백 메시지 자동 생성

    캘린더 기반 UI

    일자별 감정 이모지 표시

    클릭 시 해당 날짜의 다이어리 확인 및 작성

    음악 플레이어 포함

 기술 스택

    영역	기술
    프론트엔드	HTML, CSS, JavaScript, Chart.js
    백엔드	Node.js, Express.js
    데이터베이스	MongoDB (Mongoose ODM)
    인증	JWT (JSON Web Token)
    파일 업로드	multer
    감정 분석 로직	사분면 기반 감정 벡터 계산 및 피드백 알고리즘
    배포 환경	로컬 실행 기준 (http://localhost:3000)


 실행 방법

    MongoDB 실행 (로컬 환경)

    패키지 설치


    npm install express mongoose bcrypt jsonwebtoken cors multer
    서버 실행

    node server.js
    브라우저 접속

    http://localhost:3000
   