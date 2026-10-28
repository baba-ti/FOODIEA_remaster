# Foodia Backend

- FastAPI + LangGraph 기반 Foodia 백엔드
- 자연어 음식 추천, 이미지 재료 인식, 웹 레시피 검색 담당
- 애플리케이션 DB 없이 요청 단위 그래프 실행

## 처리 흐름

```text
POST /api/v1/assistant/recommend
  사용자 요청 + 취향 + 즐겨찾기 + 날짜 + 날씨
        -> Assistant Agent
        -> Recipe Agent(웹 검색 1회 -> 생성 -> 규칙 기반 검증)
        -> 개인화 추천 결과

POST /api/v1/ingredients/analyze
  이미지 검증 -> GPT 비전 재료 탐지 -> 명칭 정규화 -> 결과

사용자가 앱에서 재료를 확인/수정

POST /api/v1/recipes/search
  검색어 생성 -> OpenAI 웹 검색 -> 레시피 생성 -> 검증
                                          | 실패(최대 1회)
                                          v
                                    검색어 보정 후 재검색
```

- LangGraph `TypedDict` 상태와 노드별 부분 상태 반환 사용
- 구조화 출력, 조건부 엣지, 단일 검색 패턴 적용
- 두 API 사이의 프론트 화면에서 사용자 확인 처리
- 체크포인트 DB 불필요

## 실행

- 권장 Python 버전: 3.13

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
New-Item .env -ItemType File
```

- 실행 전 `.env`에 `OPENAI_API_KEY` 설정
- 웹 검색: OpenAI Responses API의 `web_search` 사용
- 검색 도메인: `10000recipe.com`으로 제한

```powershell
python -m uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

- 확인 주소:

- Swagger UI: `http://localhost:8000/docs`
- 상태 확인: `http://localhost:8000/health`

- Android 에뮬레이터 백엔드 주소: `http://10.0.2.2:8000`
- 실제 휴대폰 연결 조건: PC와 동일한 Wi-Fi 사용
- 실제 휴대폰 백엔드 주소: `http://PC의_LAN_IP:8000`

## API

### AI 음식 비서

`POST /api/v1/assistant/recommend`

- 전달 정보: 자연어 요청, 앱 로컬 저장소의 좋아하는 음식·즐겨찾기 맛집·제외 재료
- 위치 권한 허용 시 현재 날씨를 추천 근거로 활용

### 이미지 재료 분석

`POST /api/v1/ingredients/analyze` (`multipart/form-data`)

- 필드 이름: `image`
- 허용 형식: JPEG, PNG, WebP
- 기본 최대 크기: 10 MB

### 레시피 검색

`POST /api/v1/recipes/search`

```json
{
  "ingredients": ["달걀", "양파", "감자"],
  "excluded_ingredients": [],
  "preferences": ["한식"],
  "servings": 2,
  "max_cooking_minutes": 30,
  "max_results": 3
}
```

- 결과 구성: 생성된 레시피와 웹 출처 URL
- 조리 전 사용자 확인 항목: 알레르기, 식재료 상태, 가열 안전성
