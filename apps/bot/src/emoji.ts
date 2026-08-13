/**
 * Telegram Premium / custom emoji — как html.custom_emoji в aiogram:
 * <tg-emoji emoji-id="...">fallback</tg-emoji>
 *
 * На кнопках: .icon(custom_emoji_id) (Grammy).
 * Чтобы кастомные эмодзи реально рисовались у бота, нужен username с Fragment
 * и/или Premium у владельца для иконок кнопок. Fallback-юникод всегда виден.
 */

export const EmojiId = {
  star: "5453969572354878595",
  sparkles: "5472164875883040707",
  check: "5206607081334906820",
  fire: "5427312738794255486",
  heart: "5312536426987476021",
  calendar: "5372981976804366741",
  people: "5357404860566235955",
  money: "5416081784641168838",
  mail: "5445352227585742666",
  gear: "5237699328843200968",
  home: "5357315181644569056",
  back: "5200279623259528695",
  phone: "5373098001641114172",
  pin: "5373098173457520483",
  leaf: "5312249394876404761",
  candle: "5312385857614253935",
  diamond: "5472055110707956662",
  bell: "5471952986970267163",
  memo: "5350452584551281312",
  folder: "5309777569991532542",
} as const;

export type EmojiKey = keyof typeof EmojiId;

/** Как aiogram: html.custom_emoji(text, custom_emoji_id) */
export function pe(fallback: string, id: string): string {
  return `<tg-emoji emoji-id="${id}">${fallback}</tg-emoji>`;
}

export function e(key: EmojiKey, fallback: string): string {
  return pe(fallback, EmojiId[key]);
}
