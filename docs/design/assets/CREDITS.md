# 이미지 · 아이콘 · 지도 출처

목업에 쓴 외부 자료의 출처와 라이선스다. 실제 서비스에서는 연동 API가 주는 자료로 대체한다.

## 지도

- `assets/map/*.jpg` — 지도 데이터 © OpenStreetMap contributors (ODbL), 타일 그림 CC BY-SA 2.0.
  `tools/fetch-map.py` 가 표준 타일을 이어 붙이고 채도를 낮췄다. 화면에도 저작자 표시를 넣었다.

## 아이콘 · 글꼴

- 아이콘: IBM Carbon Icons (`@carbon/icons`), Apache License 2.0. `src/lib/icons.mjs` 에 쓰는 것만 담았다.
- 글꼴: Outfit(라틴 · 숫자)과 Gothic A1(한글), 둘 다 SIL Open Font License 1.1 (Google Fonts 제공).

## 회사 마크

- 요금 조회처 · 지도 · 후기 사이트의 마크: [Simple Icons](https://simpleicons.org) 16.35.0, CC0 1.0. `tools/gen-brands.mjs` 가 화면에 쓰는 여덟 개(Trip.com · Expedia · Booking.com · Hotels.com · Google Maps · Tripadvisor · Tabelog · Naver)만 `src/lib/brands.mjs` 에 담았다.
- 마크와 이름의 상표권은 각 회사에 있다. 화면에 적은 회사는 연동을 가정한 예시이며 실제 제휴 관계가 아니다. 같은 내용을 랜딩과 앱 화면의 푸터에 적었다.
- 작은 크기(14~16px)에서도 알아볼 수 있도록 그리는 방법만 조정했다. 가로로 긴 Trip.com 워드마크는 글자가 있는 띠만 잘라 넓게 쓰고, 색이 옅은 Tripadvisor · Tabelog · Naver 는 회사 색 바탕 위에 마크를 올렸다. 마크의 모양은 바꾸지 않았다. 실제 서비스에서는 각 회사의 브랜드 가이드에 맞는 공식 자료로 바꾼다.
- 항공사 로고: `assets/brands/koreanair.svg` 는 [Korean Air 2025.svg](https://commons.wikimedia.org/wiki/File:Korean_Air_2025.svg)(Korean Air, Lippincott 디자인), `assets/brands/jejuair.svg` 는 [Jeju Air Logo.svg](https://commons.wikimedia.org/wiki/File:Jeju_Air_Logo.svg)(Jeju Air, 벡터화 Jeromi Mikhael)이다. 둘 다 Wikimedia Commons 에 퍼블릭 도메인(저작권 보호 대상이 아닌 단순한 로고)으로 올라 있고, 상표로 보호된다. `tools/fetch-airline-logos.py` 가 받아서 화면에 필요 없는 정의(mask · id · class)만 걷어 냈다. 모양과 색은 원본 그대로다.
- Google 로그인 버튼의 G 마크는 Google 의 상표이며 로그인 버튼 용도로만 썼다.

## 배경 사진 (Wikimedia Commons)

랜딩의 하늘 · 숫자 · 항공 · 숙소 · 체험 구간과 로그인 · 새 검색 화면의 창에 쓴 사진이다. `tools/make-bg.py` 가 가로 1920~2400으로 줄이고 밝기를 조금 손봤다(변경 있음).

| 파일 | 쓰임 | 원본 | 작성자 | 라이선스 |
| --- | --- | --- | --- | --- |
| `bg/hero.jpg` | 랜딩 첫 화면의 하늘 · 로그인 화면의 창 | [Summer above the clouds (Unsplash).jpg](https://commons.wikimedia.org/wiki/File:Summer_above_the_clouds_(Unsplash).jpg) | Liane Metzler | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| `bg/deck.webp` | 스크롤하면 아래에서 올라오는 구름층 (아래쪽만 잘라 위 가장자리를 투명하게 녹임) | [Above The Clouds (Unsplash).jpg](https://commons.wikimedia.org/wiki/File:Above_The_Clouds_(Unsplash).jpg) | Aaron Burden | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| `bg/flight.jpg` | 항공 구간 · 새 검색 화면의 창 | [Wing with morning sunrise sky.jpg](https://commons.wikimedia.org/wiki/File:Wing_with_morning_sunrise_sky.jpg) | Michael | 퍼블릭 도메인 |
| `bg/stats.jpg` | 숫자 구간의 하늘 (위 사진에서 날개가 없는 왼쪽 위만 자름) | 위와 같음 | Michael | 퍼블릭 도메인 |
| `bg/hotel.jpg` | 숙소 구간 | [Kyoto Yura Hotel MGallery Deluxe Room Twin 20201102-001.jpg](https://commons.wikimedia.org/wiki/File:Kyoto_Yura_Hotel_MGallery_Deluxe_Room_Twin_20201102-001.jpg) | J o | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) — 줄인 사진도 같은 조건으로 쓴다 |
| `bg/exp.jpg` | 체험 구간 | [Orange hallway leading to Kyoto Prefecture (Unsplash).jpg](https://commons.wikimedia.org/wiki/File:Orange_hallway_leading_to_Kyoto_Prefecture_(Unsplash).jpg) | Peter Gabas | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |

## 지구본 (06 검색 중)

- 국가 경계: Natural Earth(퍼블릭 도메인)를 world-atlas 2.0.2 가 TopoJSON 으로 묶은 자료. `tools/gen-geo.mjs` 가 110m 전체와 동아시아 5개국의 50m 경계만 `assets/geo/world.js` 로 옮겼다.
- 투영 · 그리기: d3-geo 3.1.2, d3-array 3.2.4, topojson-client 3.1.0 (모두 ISC License, Mike Bostock). `assets/vendor/` 에 배포판 그대로 들어 있다.

## 사진 (Wikimedia Commons)

모두 4:3으로 잘라 400×300(후기 썸네일은 200×150)으로 줄였다(변경 있음). 음식점·숙소는 가상의 이름이며 사진은 예시다.
후기 썸네일은 화면에서 '웹 검색으로 찾은 후기'의 자리를 보여 주기 위한 예시이며 실제 후기 사진이 아니다.

| 파일 | 쓰임 | 원본 | 작성자 | 라이선스 |
| --- | --- | --- | --- | --- |
| `photos/nmwa.jpg` | 국립서양미술관 | [2018 National Museum of Western Art, Tokyo 5.jpg](https://commons.wikimedia.org/wiki/File:2018_National_Museum_of_Western_Art,_Tokyo_5.jpg) | Kakidai | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/tobikan.jpg` | 도쿄도 미술관 | [Tokyo Metropolitan Art Museum 01 (15133033473).jpg](https://commons.wikimedia.org/wiki/File:Tokyo_Metropolitan_Art_Museum_01_(15133033473).jpg) | Joe Mabel on Flickr as Joe Mabel from Seattle, US | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `photos/tnm.jpg` | 도쿄 국립박물관 본관 | [Tokyo National Museum, Honkan 2010.jpg](https://commons.wikimedia.org/wiki/File:Tokyo_National_Museum,_Honkan_2010.jpg) | Wiiii | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `photos/shinobazu.jpg` | 시노바즈 연못 | [Shinobazu Pond @ Ueno Park (14041716455).jpg](https://commons.wikimedia.org/wiki/File:Shinobazu_Pond_@_Ueno_Park_(14041716455).jpg) | Guilhem Vellut from Annecy, France | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/toshogu.jpg` | 우에노 도쇼구 | [Toshogu Shrine @ Ueno Park (14038495292).jpg](https://commons.wikimedia.org/wiki/File:Toshogu_Shrine_@_Ueno_Park_(14038495292).jpg) | Guilhem Vellut from Annecy, France | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/zoo.jpg` | 우에노 동물원 정문 | [Ueno Park Zoo entrance 01 (15567623690).jpg](https://commons.wikimedia.org/wiki/File:Ueno_Park_Zoo_entrance_01_(15567623690).jpg) | Joe Mabel on Flickr as Joe Mabel from Seattle, US | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `photos/soba.jpg` | 소바 (가상 음식점 예시 사진) | [Zaru soba by spinachdip.jpg](https://commons.wikimedia.org/wiki/File:Zaru_soba_by_spinachdip.jpg) | spinachdip from Minamikiso, Nagano | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| `photos/tonkatsu.jpg` | 돈카츠 (가상 음식점 예시 사진) | [Tonkatsu teishoku of Katsuraku.jpg](https://commons.wikimedia.org/wiki/File:Tonkatsu_teishoku_of_Katsuraku.jpg) | ノボホショコロトソ | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| `photos/yakitori.jpg` | 야키토리 (가상 음식점 예시 사진) | [Yakitori skewers, Ten Chi, Montparnasse, Paris 003.jpg](https://commons.wikimedia.org/wiki/File:Yakitori_skewers,_Ten_Chi,_Montparnasse,_Paris_003.jpg) | Guilhem Vellut from Paris, France | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/room_a.jpg` | 객실 (가상 숙소 예시 사진) | [Osaka hotel.jpg](https://commons.wikimedia.org/wiki/File:Osaka_hotel.jpg) | Aspiringshortlot | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/room_b.jpg` | 객실 (가상 숙소 예시 사진) | [Kyoto Yura Hotel MGallery Deluxe Room Twin 20201102-001.jpg](https://commons.wikimedia.org/wiki/File:Kyoto_Yura_Hotel_MGallery_Deluxe_Room_Twin_20201102-001.jpg) | J o | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/room_c.jpg` | 객실 (가상 숙소 예시 사진) | [Imperial Hotel Osaka regular floor standard twin room 20120630-001.jpg](https://commons.wikimedia.org/wiki/File:Imperial_Hotel_Osaka_regular_floor_standard_twin_room_20120630-001.jpg) | J o | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `photos/room_d.jpg` | 객실 (가상 숙소 예시 사진) | [Hotel Sunroute Ariake Standard Single bedroom 20110603-001.jpg](https://commons.wikimedia.org/wiki/File:Hotel_Sunroute_Ariake_Standard_Single_bedroom_20110603-001.jpg) | J o | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/room_e.jpg` | 숙소 외관 (가상 숙소 예시 사진, 간판이 있던 윗부분은 잘라 냄) | [Dormy Inn Premium Shibuya Jingumae Hot Spring.jpg](https://commons.wikimedia.org/wiki/File:Dormy_Inn_Premium_Shibuya_Jingumae_Hot_Spring.jpg) | Syced | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| `photos/rv_nmwa_1.jpg` | 국립서양미술관 · 후기 썸네일 | [Tokyo National Museum of Western Art seen from the west.jpg](https://commons.wikimedia.org/wiki/File:Tokyo_National_Museum_of_Western_Art_seen_from_the_west.jpg) | Ymblanter | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/rv_nmwa_2.jpg` | 국립서양미술관 · 후기 썸네일 | [National Museum of Western Art, Tokyo 7.jpg](https://commons.wikimedia.org/wiki/File:National_Museum_of_Western_Art,_Tokyo_7.jpg) | Kakidai | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/rv_tobikan_1.jpg` | 도쿄도 미술관 · 후기 썸네일 | [Tokyo Metropolitan Art Museum 02 (15133033203).jpg](https://commons.wikimedia.org/wiki/File:Tokyo_Metropolitan_Art_Museum_02_(15133033203).jpg) | Joe Mabel on Flickr as Joe Mabel from Seattle, US | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `photos/rv_tobikan_2.jpg` | 도쿄도 미술관 · 후기 썸네일 | [Tokyo metropolitan art museum01 1920.jpg](https://commons.wikimedia.org/wiki/File:Tokyo_metropolitan_art_museum01_1920.jpg) | 663highland | [CC BY 2.5](https://creativecommons.org/licenses/by/2.5) |
| `photos/rv_tnm_1.jpg` | 도쿄 국립박물관 · 후기 썸네일 | [Tokyo National Museum Honkan (52504030334).jpg](https://commons.wikimedia.org/wiki/File:Tokyo_National_Museum_Honkan_(52504030334).jpg) | Dick Thomas Johnson from Tokyo, Japan | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/rv_tnm_2.jpg` | 도쿄 국립박물관 · 후기 썸네일 | [Tokyo National Museum Honkan (52504310993).jpg](https://commons.wikimedia.org/wiki/File:Tokyo_National_Museum_Honkan_(52504310993).jpg) | Dick Thomas Johnson from Tokyo, Japan | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/rv_shinobazu_1.jpg` | 시노바즈 연못 · 후기 썸네일 | ["Pelican" Island on Shinobazu pond, Ueno Zoo.jpg](https://commons.wikimedia.org/wiki/File:%22Pelican%22_Island_on_Shinobazu_pond,_Ueno_Zoo.jpg) | Syced | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| `photos/rv_shinobazu_2.jpg` | 시노바즈 연못 · 후기 썸네일 | [Shinobazu pond 2.jpg](https://commons.wikimedia.org/wiki/File:Shinobazu_pond_2.jpg) | Syced | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| `photos/rv_toshogu_1.jpg` | 우에노 도쇼구 · 후기 썸네일 | [Toshogu Shrine @ Ueno Park (14038511931).jpg](https://commons.wikimedia.org/wiki/File:Toshogu_Shrine_@_Ueno_Park_(14038511931).jpg) | Guilhem Vellut from Annecy, France | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/rv_toshogu_2.jpg` | 우에노 도쇼구 · 후기 썸네일 | [Toshogu Shrine @ Ueno Park (14042155404).jpg](https://commons.wikimedia.org/wiki/File:Toshogu_Shrine_@_Ueno_Park_(14042155404).jpg) | Guilhem Vellut from Annecy, France | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/rv_zoo_1.jpg` | 우에노 동물원 · 후기 썸네일 | [Ueno Zoo main entrance 2003.jpg](https://commons.wikimedia.org/wiki/File:Ueno_Zoo_main_entrance_2003.jpg) | Photocapy | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| `photos/rv_zoo_2.jpg` | 우에노 동물원 · 후기 썸네일 | [Entrance to Ueno Zoo (9409818400).jpg](https://commons.wikimedia.org/wiki/File:Entrance_to_Ueno_Zoo_(9409818400).jpg) | Rob Young from United Kingdom | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/rv_soba_1.jpg` | 소바 · 후기 썸네일 (가상 음식점 예시 사진) | [Zaru soba at kiraku, mitaka (24542703737).jpg](https://commons.wikimedia.org/wiki/File:Zaru_soba_at_kiraku,_mitaka_(24542703737).jpg) | nakashi from Chofu, Tokyo, JAPAN | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| `photos/rv_soba_2.jpg` | 소바 · 후기 썸네일 (가상 음식점 예시 사진) | [Japanese Zaru Soba.JPG](https://commons.wikimedia.org/wiki/File:Japanese_Zaru_Soba.JPG) | STRONGlk7 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `photos/rv_tonkatsu_1.jpg` | 돈카츠 · 후기 썸네일 (가상 음식점 예시 사진) | [Tonkatsu Teishoku in Hamada, Shimane 01.jpg](https://commons.wikimedia.org/wiki/File:Tonkatsu_Teishoku_in_Hamada,_Shimane_01.jpg) | ノボホショコロトソ | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| `photos/rv_tonkatsu_2.jpg` | 돈카츠 · 후기 썸네일 (가상 음식점 예시 사진) | [NGO Kita Machikadoya Kamiiida 20220728-01.jpg](https://commons.wikimedia.org/wiki/File:NGO_Kita_Machikadoya_Kamiiida_20220728-01.jpg) | 円周率３パーセント | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/act_arch.jpg` | 추천 활동 · 우에노 공원 건축 산책 | [Tokyo National Museum of Western Art seen from the south.jpg](https://commons.wikimedia.org/wiki/File:Tokyo_National_Museum_of_Western_Art_seen_from_the_south.jpg) | Ymblanter | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/act_ameyoko.jpg` | 추천 활동 · 아메요코 상점가 | [Ameyoko Shopping Streets, Ueno (53416667926).jpg](https://commons.wikimedia.org/wiki/File:Ameyoko_Shopping_Streets,_Ueno_(53416667926).jpg) | Stephen Kelly from San Francisco, CA, USA | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/act_pond.jpg` | 추천 활동 · 시노바즈 연못 보트 | [Pink swanboat hosting a real bird on its head, on Shinobazu Pond, Ueno Park, Tokyo.jpg](https://commons.wikimedia.org/wiki/File:Pink_swanboat_hosting_a_real_bird_on_its_head,_on_Shinobazu_Pond,_Ueno_Park,_Tokyo.jpg) | Basile Morin | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
