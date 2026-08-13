import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { InputFile, type Context } from "grammy";
import { CONTACT } from "@tatiana/shared";
import { isAdmin } from "./config.js";
import { mainMenuKeyboard } from "./keyboards/menu.js";
import { e } from "./emoji.js";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

const BANNER_CANDIDATES = [
  path.join(root, "apps/web/public/images/page8_X1_1001x1201.jpg"),
  path.join(root, "apps/web/public/logos/sign-white.png"),
  path.join(root, "apps/bot/assets/banner.jpg"),
];

export function resolveBannerPath(): string | null {
  for (const p of BANNER_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  return null;
}

export function homeText(): string {
  return [
    `${e("leaf", "🌿")} <b>${CONTACT.name}</b>`,
    `${e("sparkles", "✨")} <i>${CONTACT.role}</i>`,
    "",
    "Эффективная психотерапия — индивидуально, в группе и через готовые материалы.",
    "",
    `${e("star", "⭐")} Выберите раздел ниже`,
  ].join("\n");
}

function extras(reply_markup?: ReturnType<typeof mainMenuKeyboard>) {
  return {
    parse_mode: "HTML" as const,
    reply_markup,
    link_preview_options: { is_disabled: true },
  };
}

function messageHasPhoto(ctx: Context): boolean {
  const msg = ctx.callbackQuery?.message;
  return Boolean(msg && "photo" in msg && msg.photo && msg.photo.length > 0);
}

/** Single-message navigation: edits caption/text or replies with banner */
export async function editOrReply(
  ctx: Context,
  text: string,
  reply_markup?: ReturnType<typeof mainMenuKeyboard>
): Promise<void> {
  const opts = extras(reply_markup);

  if (ctx.callbackQuery?.message) {
    try {
      if (messageHasPhoto(ctx)) {
        await ctx.editMessageCaption({ caption: text, ...opts });
      } else {
        await ctx.editMessageText(text, opts);
      }
      return;
    } catch {
      /* fall through */
    }
  }

  await ctx.reply(text, opts);
}

export async function showHome(ctx: Context, withBanner = false): Promise<void> {
  const uid = ctx.from?.id;
  const markup = mainMenuKeyboard(isAdmin(uid));
  const text = homeText();
  const opts = extras(markup);

  if (ctx.callbackQuery?.message && !withBanner) {
    try {
      if (messageHasPhoto(ctx)) {
        await ctx.editMessageCaption({ caption: text, ...opts });
      } else {
        await ctx.editMessageText(text, opts);
      }
      return;
    } catch {
      /* fall through to send fresh */
    }
  }

  const banner = resolveBannerPath();
  if (banner) {
    await ctx.replyWithPhoto(new InputFile(createReadStream(banner)), {
      caption: text,
      ...opts,
    });
    return;
  }

  await ctx.reply(text, opts);
}
