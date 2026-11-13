import { BRANDS, type BrandKey } from './brands';

/** 회사 이름(한글 표기) */
export const brandName = (key: BrandKey): string => BRANDS[key].label;
