# Foodia Remaster Frontend

React Native와 Expo로 만든 Foodia 모바일 프론트엔드입니다.

현재는 백엔드 없이 가짜 JSON 데이터를 사용해 다음 사용자 흐름을 확인할 수 있습니다.

1. 재료 직접 입력 또는 사진 선택
2. AI가 인식한 것으로 가정한 재료 확인 및 수정
3. 제외 재료 입력
4. 레시피 검색 결과 확인
5. 레시피 상세 및 출처 UI 확인

## 실행

```bash
npm install
npm start
```

## 가짜 데이터

- `src/data/mockDetectedIngredients.json`: 이미지 분석 결과
- `src/data/mockRecipes.json`: 웹 검색 레시피 결과
- `src/api/mockApi.js`: 실제 API와 비슷한 비동기 인터페이스

실제 백엔드가 준비되면 화면 코드를 바꾸지 않고 `src/api/mockApi.js`를 실제 API 모듈로 교체하는 것을 목표로 합니다.
