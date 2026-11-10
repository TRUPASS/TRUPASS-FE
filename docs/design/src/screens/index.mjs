// 화면 목록. 번호 순서가 곧 사용자 흐름이다.
import s01 from './01-landing.mjs';
import s02 from './02-login.mjs';
import s03 from './03-signup.mjs';
import { tutorial2, tutorial4 } from './04-tutorial.mjs';
import s05 from './05-home.mjs';
import s06 from './06-generating.mjs';
import { result, revise, result2 } from './07-result.mjs';
import { mandate, checkout, paying, done } from './10-pay.mjs';
import { foundations } from './00-foundations.mjs';
const FLOW = [s01, s02, s03, tutorial2, tutorial4, s05, s06, result, revise, result2, mandate, checkout, paying, done];
export const SCREENS = [foundations(FLOW.filter(s => s.id !== '04-tutorial-4')), ...FLOW];
