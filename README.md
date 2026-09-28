![Spider Quotes 도시의 밤 배경](assets/city-1.svg)

# Spider Quotes

책임과 용기, 친절을 주제로 새로 쓴 오리지널 한국어 문장을 읽고 즐겨찾기에 담는 모바일 우선 PWA입니다. 바닐라 HTML·CSS·JavaScript와 정적 JSON 카탈로그만 사용합니다.

## 실행

ES Modules와 Service Worker를 사용하므로 `file://` 대신 로컬 웹 서버로 실행합니다.

```powershell
python -m http.server 8080
```

브라우저에서 `http://localhost:8080/`을 엽니다. HTTPS 호스팅에서는 오프라인 캐시와 설치 기능을 사용할 수 있습니다.

## 기능

- 날짜에 따라 안정적으로 정해지는 오늘의 문장
- 문장·태그 검색과 주제별 필터
- 브라우저에 저장되는 즐겨찾기와 시스템/밝게/어둡게 테마
- 상세 문장 보기와 Web Share API 또는 클립보드 공유
- 네트워크가 없어도 재방문할 수 있는 PWA 앱 셸과 문장 데이터
- 배경용 오리지널 도시 야경 SVG 4종
- README 상단에 앱 배경 그래픽 적용

## 이번 작업과 오류 수정

- 기존 「오늘의 한 줄」 기록 화면을 오늘·모아보기·즐겨찾기·상세·설정으로 구성한 명언집 화면으로 교체했습니다.
- 제공된 30개 문장 중 `approved-for-use` 상태의 오리지널 문장만 정적 카탈로그에서 노출합니다. 작품의 대사나 공식 이미지는 앱에 포함하지 않습니다.
- URL 해시로 화면을 전환하고, 날짜 해시로 오늘 문장을 고정해 같은 날짜에는 새로고침 후에도 같은 문장을 보여 줍니다.
- 서비스 워커 캐시를 Spider Quotes 자산으로 교체하고, 새 버전 설치 후 즉시 활성화되도록 해 구버전 화면이 남는 문제를 줄였습니다.
- 브라우저가 `localhost:8080`에 연결되지 않던 문제는 서버가 실행되지 않은 상태에서 생겼습니다. 기존 `tools/serve.ps1`은 이 실행 환경에서 `HttpListener`를 지원하지 않아 실행되지 않았으며, Python 정적 서버 명령으로 대체했습니다.
- 실행 중 오류를 피하려면 프로젝트 루트에서 `python -m http.server 8080`을 실행한 뒤 `http://localhost:8080/`을 엽니다. 서비스 워커까지 확인하려면 HTTPS 배포 환경을 사용하세요.

## 콘텐츠와 권리

`data/quotes.json`은 제공된 JSON의 문장을 사용합니다. 카탈로그에는 `rightsStatus: "approved-for-use"` 및 `contentType: "original"`인 항목만 있으며, 기존 작품의 대사·번역·공식 캐릭터 아트는 포함하지 않습니다. 앱은 스파이더맨 권리자와 제휴하거나 승인받은 공식 앱이 아닙니다. 공개 배포 전에 각 콘텐츠와 명칭의 이용 조건을 별도로 확인하세요.

## 주요 파일

- `index.html`: 오늘, 모아보기, 즐겨찾기, 상세, 설정 화면
- `src/spider-quotes.js`: 해시 라우팅과 화면 기능
- `styles/spider-quotes.css`: 반응형 스타일과 다크/라이트 테마
- `data/quotes.json`: 정적 오리지널 문장 카탈로그
- `assets/city-1.svg` ~ `assets/city-4.svg`: 앱 배경 그래픽
- `service-worker.js`: 앱 셸·카탈로그·그래픽의 오프라인 캐시
