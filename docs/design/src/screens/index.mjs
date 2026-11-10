// 화면 목록. 번호 순서가 곧 사용자 흐름이다.
import s01 from './01-landing.mjs';
import { login, join } from './02-login.mjs';
import s03 from './03-signup.mjs';
import s05 from './05-home.mjs';
import { searching, searchingStay } from './06-searching.mjs';
import { result, resultDock, result2 } from './07-result.mjs';
import { places, placesDock } from './09-places.mjs';
import { mandate, checkout, paying, done } from './10-pay.mjs';
import { foundations } from './00-foundations.mjs';
const FLOW = [s01, login, join, s03, s05, searching, searchingStay, result, resultDock, result2, places, placesDock, mandate, checkout, paying, done];
// 디자인 기준의 흐름 표에는 같은 화면의 다른 장(장소 화면의 독 올림)을 빼고 싣는다.
export const SCREENS = [foundations(FLOW.filter(s => s.id !== '09-places-dock')), ...FLOW];
