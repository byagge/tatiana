import { Bot, InlineKeyboard } from "grammy";
import type { Context, SessionFlavor } from "grammy";
import {
  SERVICES,
  CONTACT,
  type Store,
  type PaymentProvider,
  type DikidiClient,
  type EventRecord,
} from "@tatiana/shared";
import { env, isAdmin } from "../config.js";
import {
  addUrlOrCallback,
  backKeyboard,
  mainMenuKeyboard,
} from "../keyboards/menu.js";
import { editOrReply, showHome } from "../ui.js";
import { e, EmojiId } from "../emoji.js";

export interface SessionData {
  adminDraft?: {
    step?: "title" | "description" | "date" | "price" | "seats";
    title?: string;
    description?: string;
    dateIso?: string;
    priceRub?: number;
    seatsTotal?: number;
  };
  bookingDraft?: {
    eventId?: string;
    step?: "name" | "phone";
    name?: string;
  };
  leadDraft?: {
    serviceId?: string;
    step?: "name" | "phone";
    name?: string;
  };
}

export type BotContext = Context & SessionFlavor<SessionData>;

function formatEvent(ev: EventRecord): string {
  const date = new Date(ev.dateIso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const seats = `${ev.seatsTaken}/${ev.seatsTotal}`;
  return [
    `${e("candle", "🕯")} <b>${ev.title}</b>`,
    `${e("calendar", "🗓")} ${date}`,
    `${e("diamond", "💎")} ${ev.priceRub.toLocaleString("ru-RU")} ₽ · мест ${seats}`,
    "",
    ev.description,
  ].join("\n");
}


export function registerUserHandlers(
  bot: Bot<BotContext>,
  store: Store,
  _payments: PaymentProvider,
  dikidi: DikidiClient
): void {
  bot.command("start", async (ctx) => {
    ctx.session = {};
    await showHome(ctx, true);
  });

  bot.command("menu", async (ctx) => showHome(ctx, true));

  bot.command("admin", async (ctx) => {
    if (!isAdmin(ctx.from?.id)) {
      await ctx.reply(`${e("fire", "⛔️")} Нет доступа.`);
      return;
    }
    const { adminHomeKeyboard } = await import("../keyboards/menu.js");
    await editOrReply(
      ctx,
      `${e("gear", "🛠")} <b>Админ-панель</b>\nУправление мероприятиями и бронированиями.`,
      adminHomeKeyboard()
    );
  });

  bot.callbackQuery(/^stubpay:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery({
      text: "Тестовая оплата (stub). ЮKassa ещё не подключена — в бою здесь будет ссылка.",
      show_alert: true,
    });
  });

  bot.callbackQuery("nav:home", async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session = {};
    await showHome(ctx);
  });

  bot.callbackQuery("nav:about", async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard();
    kb.text("Запись", "nav:dikidi").icon(EmojiId.calendar);
    kb.text("Заявка", "nav:pay").icon(EmojiId.money);
    kb.row();
    kb.text("Назад", "nav:home").icon(EmojiId.back);
    kb.text("Контакты", "nav:contacts").icon(EmojiId.mail);
    await editOrReply(
      ctx,
      [
        `${e("leaf", "🌿")} <b>${CONTACT.name}</b>`,
        `${e("sparkles", "✨")} ${CONTACT.role}`,
        "",
        "Психолог, психотерапевт и супервизор. Работаю бережно и по делу — индивидуально, в группе и через готовые материалы.",
        "",
        `${e("pin", "📍")} Екатеринбург · онлайн по всему миру`,
      ].join("\n"),
      kb
    );
  });

  bot.callbackQuery("nav:pay", async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard();
    SERVICES.forEach((s, i) => {
      kb.text(s.title, `pay:${s.id}`).icon(EmojiId.diamond);
      if (i % 2 === 1) kb.row();
    });
    if (SERVICES.length % 2 === 1) kb.row();
    kb.text("Назад", "nav:home").icon(EmojiId.back);
    kb.text("Меню", "nav:home").icon(EmojiId.home);
    await editOrReply(
      ctx,
      `${e("money", "📩")} <b>Заявка</b>\n\nСейчас оставьте заявку — свяжемся и подскажем оплату.\n\nВыберите услугу:`,
      kb
    );
  });

  bot.callbackQuery(/^pay:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const id = ctx.match![1];
    const service = SERVICES.find((s) => s.id === id);
    if (!service) {
      await editOrReply(ctx, `${e("fire", "😕")} Услуга не найдена.`, backKeyboard());
      return;
    }
    ctx.session.leadDraft = { serviceId: service.id, step: "name" };
    await editOrReply(
      ctx,
      [
        `${e("sparkles", "✨")} <b>${service.title}</b>`,
        `${e("diamond", "💎")} ${service.priceRub.toLocaleString("ru-RU")} ₽`,
        "",
        service.description,
        "",
        "Как вас зовут?",
      ].join("\n"),
      backKeyboard("nav:pay")
    );
  });

  bot.callbackQuery("nav:dikidi", async (ctx) => {
    await ctx.answerCallbackQuery();
    const url = dikidi.getBookingUrl();
    let slotsText = "";
    try {
      const from = new Date().toISOString();
      const to = new Date(Date.now() + 7 * 864e5).toISOString();
      const slots = await dikidi.listSlots(from, to);
      if (slots.length) {
        slotsText =
          `\n\n${e("calendar", "🕰")} Ближайшие слоты:\n` +
          slots
            .slice(0, 3)
            .map(
              (s) =>
                `• ${new Date(s.startIso).toLocaleString("ru-RU")} — ${s.specialistName}`
            )
            .join("\n");
      }
    } catch {
      slotsText = `\n\n<i>Слоты временно недоступны</i>`;
    }
    const kb = new InlineKeyboard();
    addUrlOrCallback(kb, "Открыть DIKIDI", url, "nav:home", EmojiId.calendar);
    kb.row();
    kb.text("Назад", "nav:home").icon(EmojiId.back);
    kb.text("Группы", "nav:groups").icon(EmojiId.people);
    const note =
      dikidi.name === "live"
        ? `\n\n${e("check", "✅")} Запись откроется в DIKIDI (компания подключена).`
        : `\n\n${e("sparkles", "🧪")} <i>DIKIDI stub.</i>`;
    await editOrReply(
      ctx,
      `${e("calendar", "📅")} <b>Индивидуальная запись</b>\nОнлайн и офлайн через DIKIDI.${slotsText}${note}`,
      kb
    );
  });

  bot.callbackQuery("nav:groups", async (ctx) => {
    await ctx.answerCallbackQuery();
    const events = store.listEvents("upcoming");
    if (!events.length) {
      await editOrReply(
        ctx,
        `${e("people", "👥")} <b>Групповая терапия</b>\n\nПока нет открытых групп. Загляните позже ${e("leaf", "🌿")}`,
        backKeyboard()
      );
      return;
    }
    const kb = new InlineKeyboard();
    events.forEach((ev, i) => {
      const left = ev.seatsTotal - ev.seatsTaken;
      kb.text(`${ev.title.slice(0, 28)} · ${left}`, `group:${ev.id}`).icon(
        EmojiId.people
      );
      if (i % 2 === 1) kb.row();
    });
    if (events.length % 2 === 1) kb.row();
    kb.text("Назад", "nav:home").icon(EmojiId.back);
    kb.text("Меню", "nav:home").icon(EmojiId.home);
    await editOrReply(
      ctx,
      `${e("people", "👥")} <b>Групповая терапия</b>\n\nЗапись здесь (не через DIKIDI). Выберите группу:`,
      kb
    );
  });

  bot.callbackQuery(/^group:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const event = store.getEvent(ctx.match![1]);
    if (!event || event.status !== "upcoming") {
      await editOrReply(
        ctx,
        `${e("fire", "😕")} Мероприятие недоступно.`,
        backKeyboard("nav:groups")
      );
      return;
    }
    const kb = new InlineKeyboard();
    kb.text("Забронировать", `book:${event.id}`).icon(EmojiId.check);
    kb.text("К группам", "nav:groups").icon(EmojiId.back);
    await editOrReply(ctx, formatEvent(event), kb);
  });

  bot.callbackQuery(/^book:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const eventId = ctx.match![1];
    const event = store.getEvent(eventId);
    if (!event) {
      await editOrReply(
        ctx,
        `${e("fire", "😕")} Не найдено.`,
        backKeyboard("nav:groups")
      );
      return;
    }
    ctx.session.bookingDraft = { eventId, step: "name" };
    await editOrReply(
      ctx,
      `${e("memo", "📝")} Бронь: <b>${event.title}</b>\n\nКак вас зовут?`,
      backKeyboard("nav:groups")
    );
  });

  bot.callbackQuery("nav:events", async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard();
    kb.text("Предстоящие", "events:upcoming").icon(EmojiId.calendar);
    kb.text("Прошедшие", "events:past").icon(EmojiId.folder);
    kb.row();
    kb.text("Назад", "nav:home").icon(EmojiId.back);
    kb.text("Меню", "nav:home").icon(EmojiId.home);
    await editOrReply(
      ctx,
      `${e("folder", "🗓")} <b>Мероприятия</b>\n\nВыберите список:`,
      kb
    );
  });

  bot.callbackQuery(/^events:(upcoming|past)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const kind = ctx.match![1] as "upcoming" | "past";
    const events = store.listEvents(kind);
    if (!events.length) {
      await editOrReply(
        ctx,
        kind === "upcoming"
          ? `${e("leaf", "🕊")} Пока нет предстоящих мероприятий.`
          : `${e("folder", "🗂")} Архив пока пуст.`,
        backKeyboard("nav:events")
      );
      return;
    }
    const lines = events.map((ev) => {
      const d = new Date(ev.dateIso).toLocaleDateString("ru-RU");
      return `• <b>${ev.title}</b>\n  ${d} · ${ev.priceRub} ₽`;
    });
    const kb = new InlineKeyboard();
    if (kind === "upcoming") {
      events.forEach((ev, i) => {
        kb.text(ev.title.slice(0, 28), `group:${ev.id}`).icon(EmojiId.calendar);
        if (i % 2 === 1) kb.row();
      });
      if (events.length % 2 === 1) kb.row();
    }
    kb.text("Назад", "nav:events").icon(EmojiId.back);
    kb.text("Меню", "nav:home").icon(EmojiId.home);
    await editOrReply(
      ctx,
      `<b>${kind === "upcoming" ? `${e("calendar", "🔜")} Предстоящие` : `${e("folder", "🗂")} Прошедшие`}</b>\n\n${lines.join("\n\n")}`,
      kb
    );
  });

  bot.callbackQuery("nav:contacts", async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard();
    addUrlOrCallback(kb, "Канал", CONTACT.telegram, "nav:home", EmojiId.bell);
    kb.text("Телефон", "contact:phone").icon(EmojiId.phone);
    kb.row();
    kb.text("Почта", "contact:email").icon(EmojiId.mail);
    kb.text("Сайт", "contact:site").icon(EmojiId.star);
    kb.row();
    kb.text("Назад", "nav:home").icon(EmojiId.back);
    kb.text("Меню", "nav:home").icon(EmojiId.home);

    await editOrReply(
      ctx,
      [
        `${e("leaf", "🌿")} <b>${CONTACT.name}</b>`,
        `${e("sparkles", "✨")} ${CONTACT.role}`,
        "",
        `${e("mail", "✉️")}  ${CONTACT.email}`,
        `${e("phone", "📞")}  ${CONTACT.phone}`,
        `${e("pin", "📍")}  ${CONTACT.address}`,
        "",
        `${e("star", "🌐")}  ${env.webUrl}`,
      ].join("\n"),
      kb
    );
  });

  bot.callbackQuery("contact:phone", async (ctx) => {
    await ctx.answerCallbackQuery({ text: CONTACT.phone, show_alert: true });
  });

  bot.callbackQuery("contact:email", async (ctx) => {
    await ctx.answerCallbackQuery({ text: CONTACT.email, show_alert: true });
  });

  bot.callbackQuery("contact:site", async (ctx) => {
    await ctx.answerCallbackQuery({
      text: `Сайт: ${env.webUrl}`,
      show_alert: true,
    });
  });

  bot.on("message:text", async (ctx, next) => {
    const lead = ctx.session.leadDraft;
    if (lead?.step) {
      const text = ctx.message.text.trim();
      if (lead.step === "name") {
        lead.name = text;
        lead.step = "phone";
        await ctx.reply(
          `${e("phone", "📱")} Телефон для связи (например +7…):`,
          { parse_mode: "HTML", reply_markup: backKeyboard("nav:pay") }
        );
        return;
      }
      if (lead.step === "phone") {
        const serviceId = lead.serviceId ?? "personal";
        const name = lead.name!;
        const phone = text;
        ctx.session.leadDraft = undefined;
        const rec = store.createLead({
          source: "bot",
          name,
          phone,
          serviceId,
          tgUserId: ctx.from?.id ?? null,
          tgUsername: ctx.from?.username ?? null,
        });
        const service = SERVICES.find((s) => s.id === serviceId);
        await ctx.reply(
          [
            `${e("check", "✅")} <b>Заявка принята</b>`,
            service ? service.title : "",
            `${name}, ${phone}`,
            "",
            "Свяжемся и подскажем, как оплатить. ЮKassa подключится после публикации сайта.",
          ]
            .filter(Boolean)
            .join("\n"),
          {
            parse_mode: "HTML",
            reply_markup: mainMenuKeyboard(isAdmin(ctx.from?.id)),
          }
        );
        for (const adminId of env.adminIds) {
          try {
            await ctx.api.sendMessage(
              adminId,
              `${e("bell", "🔔")} Заявка ${rec.id.slice(0, 8)}\n${service?.title ?? serviceId}\n${name} · ${phone} · @${ctx.from?.username ?? "—"}`,
              { parse_mode: "HTML" }
            );
          } catch {
            /* ignore */
          }
        }
        return;
      }
    }

    const draft = ctx.session.bookingDraft;
    if (!draft?.step) return next();

    const text = ctx.message.text.trim();
    if (draft.step === "name") {
      draft.name = text;
      draft.step = "phone";
      await ctx.reply(
        `${e("phone", "📱")} Телефон для связи (например +7…):`,
        {
          parse_mode: "HTML",
          reply_markup: backKeyboard("nav:groups"),
        }
      );
      return;
    }

    if (draft.step === "phone") {
      const eventId = draft.eventId!;
      const name = draft.name!;
      const phone = text;
      ctx.session.bookingDraft = undefined;
      try {
        const event = store.getEvent(eventId);
        if (!event) throw new Error("EVENT_NOT_FOUND");

        const booking = store.createBooking({
          eventId,
          tgUserId: ctx.from!.id,
          tgUsername: ctx.from?.username ?? null,
          name,
          phone,
        });
        store.createLead({
          source: "bot",
          name,
          phone,
          eventId,
          serviceId: "group",
          tgUserId: ctx.from?.id ?? null,
          tgUsername: ctx.from?.username ?? null,
          comment: `Бронь группы ${event.title}`,
        });

        await ctx.reply(
          [
            `${e("check", "✅")} <b>Заявка на группу принята</b>`,
            `${e("memo", "🔖")} № ${booking.id.slice(0, 8)}`,
            `${e("candle", "🕯")} ${event.title}`,
            `${e("people", "👤")} ${name}, ${phone}`,
            `${e("diamond", "💎")} ${event.priceRub.toLocaleString("ru-RU")} ₽`,
            "",
            "Свяжемся и подтвердим участие. Оплату подскажем отдельно.",
          ].join("\n"),
          {
            parse_mode: "HTML",
            reply_markup: mainMenuKeyboard(isAdmin(ctx.from?.id)),
          }
        );

        for (const adminId of env.adminIds) {
          try {
            await ctx.api.sendMessage(
              adminId,
              `${e("bell", "🔔")} Новая бронь на «${event.title}»\n${name} · ${phone} · @${ctx.from?.username ?? "—"}\nid: ${booking.id}`,
              { parse_mode: "HTML" }
            );
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        console.error("booking error", err);
        const code = String(err);
        const msg = code.includes("NO_SEATS")
          ? `${e("fire", "😔")} К сожалению, мест больше нет.`
          : code.includes("EVENT_NOT_OPEN")
            ? `${e("fire", "🔒")} Запись на это мероприятие закрыта.`
            : `${e("fire", "😕")} Не удалось создать бронь. Попробуйте позже.`;
        await ctx.reply(msg, {
          parse_mode: "HTML",
          reply_markup: mainMenuKeyboard(isAdmin(ctx.from?.id)),
        });
      }
    }
  });
}
