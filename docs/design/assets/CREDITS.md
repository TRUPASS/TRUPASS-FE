# 이미지 · 아이콘 · 지도 출처

목업에 쓴 외부 자료의 출처와 라이선스다. 실제 서비스에서는 연동 API가 주는 자료로 대체한다.

## 지도

- `assets/map/*.jpg` — 지도 데이터 © OpenStreetMap contributors (ODbL), 타일 그림 CC BY-SA 2.0.
  `tools/fetch-map.py` 가 표준 타일을 이어 붙이고 채도를 낮췄다. 화면에도 저작자 표시를 넣었다.

## 아이콘 · 글꼴

- 아이콘: IBM Carbon Icons (`@carbon/icons`), Apache License 2.0. `src/lib/icons.mjs` 에 쓰는 것만 담았다.
- 글꼴: IBM Plex Sans KR, SIL Open Font License 1.1 (Google Fonts 제공).
- Google 로그인 버튼의 G 마크는 Google 의 상표이며 로그인 버튼 용도로만 썼다.

## 사진 (Wikimedia Commons)

모두 4:3으로 잘라 400×300으로 줄였다(변경 있음). 음식점·숙소는 가상의 이름이며 사진은 예시다.

| 파일 | 쓰임 | 원본 | 작성자 | 라이선스 |
| --- | --- | --- | --- | --- |
| `photos/shoto.jpg` | 시부야구립 쇼토 미술관 | [Shoto Museum of Art 2010.jpg](https://commons.wikimedia.org/wiki/File:Shoto_Museum_of_Art_2010.jpg) | Wiiii | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `photos/ota.jpg` | 오타 기념 미술관 | [Ota-Memorial-Museum-Harajuku-01.jpg](https://commons.wikimedia.org/wiki/File:Ota-Memorial-Museum-Harajuku-01.jpg) | Rs1421 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `photos/nezu.jpg` | 네즈 미술관 정원 | [Nezu Museum Garden view1 201805.jpg](https://commons.wikimedia.org/wiki/File:Nezu_Museum_Garden_view1_201805.jpg) | Wpcpey | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/crossing.jpg` | 시부야 스크램블 교차로 | [Shibuya scramble crossing during Halloween 2023, actually less crowded than usual, high police presence 2.jpg](https://commons.wikimedia.org/wiki/File:Shibuya_scramble_crossing_during_Halloween_2023,_actually_less_crowded_than_usual,_high_police_presence_2.jpg) | Syced | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| `photos/sky.jpg` | 시부야 스카이 | [Shibuya Scramble Square - SHIBUYA SKY 10.jpg](https://commons.wikimedia.org/wiki/File:Shibuya_Scramble_Square_-_SHIBUYA_SKY_10.jpg) | Kakidai | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/omotesando.jpg` | 오모테산도 | [Omotesando Avenue at sunset from pedestrian bridge, Jingumae, Shibuya, Tokyo.jpg](https://commons.wikimedia.org/wiki/File:Omotesando_Avenue_at_sunset_from_pedestrian_bridge,_Jingumae,_Shibuya,_Tokyo.jpg) | gog.creator | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| `photos/nmwa.jpg` | 국립서양미술관 | [2018 National Museum of Western Art, Tokyo 5.jpg](https://commons.wikimedia.org/wiki/File:2018_National_Museum_of_Western_Art,_Tokyo_5.jpg) | Kakidai | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/tobikan.jpg` | 도쿄도 미술관 | [Tokyo Metropolitan Art Museum 01 (15133033473).jpg](https://commons.wikimedia.org/wiki/File:Tokyo_Metropolitan_Art_Museum_01_(15133033473).jpg) | Joe Mabel on Flickr as Joe Mabel from Seattle, US | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `photos/tnm.jpg` | 도쿄 국립박물관 본관 | [Tokyo National Museum, Honkan 2010.jpg](https://commons.wikimedia.org/wiki/File:Tokyo_National_Museum,_Honkan_2010.jpg) | Wiiii | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `photos/shinobazu.jpg` | 시노바즈 연못 | [Shinobazu Pond @ Ueno Park (14041716455).jpg](https://commons.wikimedia.org/wiki/File:Shinobazu_Pond_@_Ueno_Park_(14041716455).jpg) | Guilhem Vellut from Annecy, France | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/toshogu.jpg` | 우에노 도쇼구 | [Toshogu Shrine @ Ueno Park (14038495292).jpg](https://commons.wikimedia.org/wiki/File:Toshogu_Shrine_@_Ueno_Park_(14038495292).jpg) | Guilhem Vellut from Annecy, France | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/zoo.jpg` | 우에노 동물원 정문 | [Ueno Park Zoo entrance 01 (15567623690).jpg](https://commons.wikimedia.org/wiki/File:Ueno_Park_Zoo_entrance_01_(15567623690).jpg) | Joe Mabel on Flickr as Joe Mabel from Seattle, US | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `photos/sushi.jpg` | 스시 (가상 음식점 예시 사진) | [Shimaaji (Striped jack) Nigiri.jpg](https://commons.wikimedia.org/wiki/File:Shimaaji_(Striped_jack)_Nigiri.jpg) | Zheng Zhou | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/ramen.jpg` | 라멘 (가상 음식점 예시 사진) | [Shio ramen from Ryukyu Ramen Tondou, Shin-Yokohama.jpg](https://commons.wikimedia.org/wiki/File:Shio_ramen_from_Ryukyu_Ramen_Tondou,_Shin-Yokohama.jpg) | Yuet Man Lee | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/kissa.jpg` | 카페 (가상 음식점 예시 사진) | [Doutor Coffee Shop. (53208125399).jpg](https://commons.wikimedia.org/wiki/File:Doutor_Coffee_Shop._(53208125399).jpg) | MIKI Yoshihito | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/soba.jpg` | 소바 (가상 음식점 예시 사진) | [Zaru soba by spinachdip.jpg](https://commons.wikimedia.org/wiki/File:Zaru_soba_by_spinachdip.jpg) | spinachdip from Minamikiso, Nagano | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| `photos/tonkatsu.jpg` | 돈카츠 (가상 음식점 예시 사진) | [Tonkatsu teishoku of Katsuraku.jpg](https://commons.wikimedia.org/wiki/File:Tonkatsu_teishoku_of_Katsuraku.jpg) | ノボホショコロトソ | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| `photos/yakitori.jpg` | 야키토리 (가상 음식점 예시 사진) | [Yakitori skewers, Ten Chi, Montparnasse, Paris 003.jpg](https://commons.wikimedia.org/wiki/File:Yakitori_skewers,_Ten_Chi,_Montparnasse,_Paris_003.jpg) | Guilhem Vellut from Paris, France | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `photos/room_a.jpg` | 객실 (가상 숙소 예시 사진) | [Osaka hotel.jpg](https://commons.wikimedia.org/wiki/File:Osaka_hotel.jpg) | Aspiringshortlot | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/room_b.jpg` | 객실 (가상 숙소 예시 사진) | [Kyoto Yura Hotel MGallery Deluxe Room Twin 20201102-001.jpg](https://commons.wikimedia.org/wiki/File:Kyoto_Yura_Hotel_MGallery_Deluxe_Room_Twin_20201102-001.jpg) | J o | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/room_c.jpg` | 객실 (가상 숙소 예시 사진) | [Imperial Hotel Osaka regular floor standard twin room 20120630-001.jpg](https://commons.wikimedia.org/wiki/File:Imperial_Hotel_Osaka_regular_floor_standard_twin_room_20120630-001.jpg) | J o | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `photos/room_d.jpg` | 객실 (가상 숙소 예시 사진) | [Hotel Sunroute Ariake Standard Single bedroom 20110603-001.jpg](https://commons.wikimedia.org/wiki/File:Hotel_Sunroute_Ariake_Standard_Single_bedroom_20110603-001.jpg) | J o | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `photos/room_e.jpg` | 숙소 외관 (가상 숙소 예시 사진) | [Dormy Inn Premium Shibuya Jingumae Hot Spring.jpg](https://commons.wikimedia.org/wiki/File:Dormy_Inn_Premium_Shibuya_Jingumae_Hot_Spring.jpg) | Syced | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| `photos/room_f.jpg` | 숙소 외관 (가상 숙소 예시 사진) | [JR上野駅前 - panoramio.jpg](https://commons.wikimedia.org/wiki/File:JR%E4%B8%8A%E9%87%8E%E9%A7%85%E5%89%8D_-_panoramio.jpg) | 伊部リコ | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) |
