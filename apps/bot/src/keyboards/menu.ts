import { InlineKeyboard } from "grammy";
import { EmojiId } from "../emoji.js";

/** Telegram URL-кнопки принимают только публичные http(s), не localhost/mailto */
export function isTelegramSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.endsWith(".local") ||
      host.startsWith("192.168.") ||
      host.startsWith("10.")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function addUrlOrCallback(
  kb: InlineKeyboard,
  label: string,
  url: string,
  fallbackCallback: string,
  iconId?: string
): InlineKeyboard {
  if (isTelegramSafeUrl(url)) {
    kb.url(label, url);
  } else {
    kb.text(label, fallbackCallback);
  }
  if (iconId) kb.icon(iconId);
  return kb;
}

function t(
  kb: InlineKeyboard,
  label: string,
  data: string,
  iconId: string
): InlineKeyboard {
  return kb.text(label, data).icon(iconId);
}

export function mainMenuKeyboard(isAdminUser: boolean): InlineKeyboard {
  const kb = new InlineKeyboard();
  t(kb, "Заявка", "nav:pay", EmojiId.money);
  t(kb, "Запись", "nav:dikidi", EmojiId.calendar);
  kb.row();
  t(kb, "Группы", "nav:groups", EmojiId.people);
  t(kb, "События", "nav:events", EmojiId.folder);
  kb.row();
  t(kb, "Обо мне", "nav:about", EmojiId.sparkles);
  t(kb, "Контакты", "nav:contacts", EmojiId.mail);
  if (isAdminUser) {
    kb.row();
    t(kb, "Админ", "admin:home", EmojiId.gear);
  }
  return kb;
}

export function backKeyboard(to = "nav:home"): InlineKeyboard {
  const kb = new InlineKeyboard();
  t(kb, "Назад", to, EmojiId.back);
  t(kb, "Меню", "nav:home", EmojiId.home);
  return kb;
}

export function adminHomeKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  t(kb, "Создать", "admin:event:create", EmojiId.sparkles);
  t(kb, "Список", "admin:events", EmojiId.folder);
  kb.row();
  t(kb, "Брони", "admin:bookings", EmojiId.memo);
  t(kb, "Заявки", "admin:leads", EmojiId.bell);
  kb.row();
  t(kb, "Меню", "nav:home", EmojiId.home);
  return kb;
}
