# Foodia Remaster Frontend

React Native와 Expo로 만든 Foodia 모바일 프론트엔드입니다.

FastAPI + LangGraph 백엔드와 연결되어 다음 사용자 흐름을 제공합니다.

1. 재료 직접 입력 또는 사진 선택
2. OpenAI Vision이 인식한 재료 확인 및 수정
3. 제외 재료 입력
4. 개인 취향·즐겨찾기·날씨·날짜 기반 AI 메뉴 추천
5. 만개의레시피 웹 검색 및 검증 결과 확인
6. 레시피 상세 및 출처 UI 확인

## 실행

```bash
npm install
npx expo run:android
```

백엔드는 별도 터미널에서 먼저 실행합니다.

```powershell
cd ..\backend
.\.venv\Scripts\python.exe -m uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

Android 에뮬레이터는 기본적으로 `http://10.0.2.2:8000`에 연결합니다.
