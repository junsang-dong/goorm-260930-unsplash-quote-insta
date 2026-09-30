export const RATIOS = {
  '1:1': { w: 1080, h: 1080, marginYRatio: 0.1 },
  '4:5': { w: 1080, h: 1350, marginYRatio: 0.1 },
  '9:16': { w: 1080, h: 1920, marginYRatio: 0.14 },
}

export const MARGIN_X_RATIO = 0.1
export const AUTHOR_SIZE_RATIO = 0.45
export const AUTHOR_GAP_RATIO = 1.2
export const CREDIT_SIZE = 20
export const CREDIT_OPACITY = 0.7
export const CREDIT_MARGIN = 32

export const FONTS = ['Noto Sans KR', 'Noto Serif KR', 'Gowun Batang', 'Nanum Myeongjo']

export function orientationForRatio(ratio) {
  return ratio === '1:1' ? 'squarish' : 'portrait'
}

export const DEFAULT_RATIO = '4:5'

export const DEFAULT_STYLE = {
  fontFamily: 'Noto Serif KR',
  fontSize: 56,
  lineHeight: 1.5,
  align: 'center',
  vAlign: 'middle',
  textColor: 'auto',
  overlayMode: 'auto',
  overlayOpacity: 0.4,
  overlayType: 'solid',
  showAuthor: true,
  showCredit: true,
  offsetX: 0,
  offsetY: 0,
}
