# Foodia Backend

Foodia의 자연어 음식 추천, 이미지 재료 인식과 웹 레시피 검색을 담당하는 FastAPI + LangGraph 백엔드입니다.
애플리케이션 DB 없이 요청 단위로 그래프를 실행합니다.

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
  검색어 생성 -> OpenAI 웹 검색(만개의레시피 한정) -> 레시피 생성 -> 검증
                                          | 실패(최대 1회)
                                          v
                                    검색어 보정 후 재검색
```

LangGraph의 `TypedDict` 상태, 노드별 부분 상태 반환, 구조화 출력,
조건부 엣지와 단일 검색 패턴을 사용합니다. 사용자 확인은 두 API 사이의
프론트 화면에서 처리하므로 체크포인트 DB는 필요하지 않습니다.

## 실행

Python 3.13을 권장합니다.

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
New-Item .env -ItemType File
```

`.env`에 `OPENAI_API_KEY`를 입력한 뒤 실행합니다. 웹 검색은 OpenAI Responses
API의 `web_search`를 사용하며 `10000recipe.com` 도메인으로 제한됩니다.

```powershell
python -m uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

확인 주소:

- Swagger UI: `http://localhost:8000/docs`
- 상태 확인: `http://localhost:8000/health`

Android 에뮬레이터에서 백엔드 주소는 `http://10.0.2.2:8000`을 사용합니다.
실제 휴대폰에서는 PC와 같은 Wi-Fi에 연결하고 `http://PC의_LAN_IP:8000`을 사용합니다.

## API

### AI 음식 비서

`POST /api/v1/assistant/recommend`

자연어 요청과 앱 로컬 저장소의 좋아하는 음식, 즐겨찾기 맛집, 제외 재료를
전달합니다. 위치 권한이 허용된 경우 현재 날씨도 추천 근거로 사용합니다.

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

결과에는 생성된 레시피와 웹 출처 URL이 함께 포함됩니다. AI 결과는 조리 전
사용자가 알레르기, 식재료 상태, 가열 안전성을 확인해야 합니다.
