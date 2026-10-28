# Foodia Remaster Frontend

- React Native + Expo 기반 Foodia 모바일 프론트엔드

- FastAPI + LangGraph 백엔드 연동

## 사용자 흐름

1. 재료 직접 입력 또는 사진 선택
2. OpenAI Vision이 인식한 재료 확인 및 수정
3. 제외 재료 입력
4. 개인 취향·즐겨찾기·날씨·날짜 기반 AI 메뉴 추천
5. 웹 검색 및 검증 결과 확인
6. 레시피 상세 및 출처 UI 확인

## 실행

```bash
npm install
npx expo run:android
```

- 별도 터미널에서 백엔드 우선 실행

```powershell
cd ..\backend
.\.venv\Scripts\python.exe -m uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

- Android 에뮬레이터 기본 연결 주소: `http://10.0.2.2:8000`
