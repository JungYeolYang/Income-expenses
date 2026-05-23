# Vercel 배포

이 프로젝트는 **Vite(프론트)** + **API(데이터)** 구조입니다. 로컬에서는 `npm run dev`로 API(3001)와 웹(5173)이 함께 뜨지만, Vercel에는 **정적 파일만 올리면 API가 없어** 「서버에 연결할 수 없습니다」 오류가 납니다.

저장소의 `api/` 폴더와 `vercel.json`으로 Vercel **서버리스 API**(`/api/health`, `/api/data`)가 함께 배포되도록 구성되어 있습니다.

## 1. Vercel에 프로젝트 연결

1. [Vercel](https://vercel.com)에서 Git 저장소를 Import
2. Framework Preset: **Vite** (또는 자동 감지)
3. Build Command: `npm run build` (기본값)
4. Output Directory: `dist` (기본값)

## 2. 데이터 영구 저장 (필수)

Vercel 서버리스 환경에서는 로컬용 SQLite 파일(`data/finance.db`)을 그대로 쓸 수 없습니다. **Vercel Blob**에 JSON 형태로 저장합니다.

**방법 A (권장): 프로젝트에서 Blob 만들기**

1. **income-expenses-gamma** 프로젝트 → 왼쪽 **Storage** → **Connect Database** / **Create Database** → **Blob**
2. 이름 입력 후 생성 → 프로젝트에 자동 연결·환경 변수 자동 추가

**방법 B: 이미 만든 `income-expenses-blob` 연결**

1. 팀/계정 상단 **Storage** → **income-expenses-blob** 클릭
2. 상단 탭에서 **Projects**(개요/Overview 옆) 선택
3. **Connect to Project** → **income-expenses-gamma** → Production(필요 시 Preview) 체크 → Connect

연결 후 프로젝트 **Settings → Environment Variables**에  
`BLOB_READ_WRITE_TOKEN` 또는 `BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN` 이 보이면 성공입니다.

4. **Deployments** → **Redeploy** (환경 변수 반영)

Blob을 연결하지 않으면 API는 동작할 수 있으나, 데이터가 인스턴스마다 초기화될 수 있어 **실사용에는 Blob 연결이 필요**합니다.

## 3. 로컬 데이터를 Vercel로 옮기기

1. 로컬에서 앱 실행 후 **백업** 메뉴에서 JSON보내기
2. Vercel에 배포된 사이트 접속 → **백업** → JSON 가져오기

또는 Blob에 첫 저장 전에 로컬 `data/finance.db`가 있다면, 로컬에서보낸 JSON을 가져오는 방식이 가장 안전합니다.

## 4. 배포 후 확인

- `https://<프로젝트>.vercel.app/api/health` → `{"ok":true}`
- 메인 화면에서 월별 입력 등이 로드되면 정상

## 5. 로컬 개발 (변경 없음)

```bash
npm install
npm run dev
```

로컬은 계속 **SQLite** (`data/finance.db`)를 사용합니다. Blob 토큰을 로컬 `.env`에 넣으면 로컬에서도 Blob을 쓸 수 있으나, 일반적으로는 넣지 않아도 됩니다.

## 대안: API만 별도 호스팅

Vercel 대신 [Render](https://render.com), [Railway](https://railway.app) 등에 `npm start`로 Express API를 올리고, Vercel 프론트만 배포한 뒤 `vite.config.ts`의 proxy 대신 `VITE_API_URL`로 API 주소를 지정하는 방식도 가능합니다. (현재 기본 설정은 Vercel Blob + 서버리스 API입니다.)
