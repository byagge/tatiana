import { Bot, InlineKeyboard } from "grammy";
import type { Store } from "@tatiana/shared";
import { isAdmin } from "../config.js";
import { adminHomeKeyboard, backKeyboard } from "../keyboards/menu.js";
import { editOrReply } from "../ui.js";
import type { BotContext } from "../handlers/user.js";

export function registerAdminHandlers(bot: Bot<BotContext>, store: Store): void {
  bot.callbackQuery("admin:home", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) {
      await editOrReply(ctx, "Нет доступа.", backKeyboard());
      return;
    }
    await editOrReply(
      ctx,
      "🛠 <b>Админ-панель</b>\nМероприятия, брони и заявки с сайта/бота.",
      adminHomeKeyboard()
    );
  });

  bot.callbackQuery("admin:events", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) return;
    const events = store.listEvents();
    if (!events.length) {
      await editOrReply(ctx, "Мероприятий нет.", adminHomeKeyboard());
      return;
    }
    const kb = new InlineKeyboard();
    for (const e of events) {
      kb.text(
        `${e.status === "past" ? "⏹" : "▶️"} ${e.title.slice(0, 36)}`,
        `admin:event:${e.id}`
      ).row();
    }
    kb.text("← Админ", "admin:home");
    await editOrReply(ctx, "<b>Все мероприятия</b>", kb);
  });

  bot.callbackQuery(/^admin:event:(?!create)(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) return;
    const event = store.getEvent(ctx.match![1]);
    if (!event) {
      await editOrReply(ctx, "Не найдено.", adminHomeKeyboard());
      return;
    }
    const kb = new InlineKeyboard()
      .text(
        event.status === "upcoming" ? "В архив (past)" : "Сделать upcoming",
        `admin:toggle:${event.id}`
      )
      .row()
      .text("Брони этого события", `admin:bookings:${event.id}`)
      .row()
      .text("🗑 Удалить", `admin:delete:${event.id}`)
      .row()
      .text("← Список", "admin:events");
    const date = new Date(event.dateIso).toLocaleString("ru-RU");
    await editOrReply(
      ctx,
      [
        `<b>${event.title}</b>`,
        date,
        `${event.priceRub} ₽ · ${event.seatsTaken}/${event.seatsTotal}`,
        `Статус: ${event.status}`,
        "",
        event.description,
      ].join("\n"),
      kb
    );
  });

  bot.callbackQuery(/^admin:toggle:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) return;
    const event = store.getEvent(ctx.match![1]);
    if (!event) return;
    const status = event.status === "upcoming" ? "past" : "upcoming";
    store.updateEvent(event.id, { status });
    await editOrReply(
      ctx,
      `Статус «${event.title}» → <b>${status}</b>`,
      adminHomeKeyboard()
    );
  });

  bot.callbackQuery(/^admin:delete:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) return;
    store.deleteEvent(ctx.match![1]);
    await editOrReply(ctx, "Удалено.", adminHomeKeyboard());
  });

  bot.callbackQuery("admin:bookings", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) return;
    const bookings = store.listBookings().slice(0, 20);
    if (!bookings.length) {
      await editOrReply(ctx, "Бронирований нет.", adminHomeKeyboard());
      return;
    }
    const kb = new InlineKeyboard();
    for (const b of bookings) {
      const ev = store.getEvent(b.eventId);
      kb.text(
        `${b.status} · ${(ev?.title ?? "?").slice(0, 24)}`,
        `admin:booking:${b.id}`
      ).row();
    }
    kb.text("← Админ", "admin:home");
    await editOrReply(ctx, "<b>Последние бронирования</b>", kb);
  });

  bot.callbackQuery(/^admin:bookings:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) return;
    const eventId = ctx.match![1];
    const bookings = store.listBookings(eventId);
    const lines = bookings.length
      ? bookings
          .map(
            (b) =>
              `• ${b.name} · ${b.phone} · ${b.status} · @${b.tgUsername ?? "—"}`
          )
          .join("\n")
      : "Пока пусто.";
    await editOrReply(
      ctx,
      `<b>Брони</b>\n${lines}`,
      new InlineKeyboard()
        .text("← К событию", `admin:event:${eventId}`)
        .row()
        .text("Админ", "admin:home")
    );
  });

  bot.callbackQuery(/^admin:booking:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) return;
    const b = store.getBooking(ctx.match![1]);
    if (!b) {
      await editOrReply(ctx, "Не найдено.", adminHomeKeyboard());
      return;
    }
    const ev = store.getEvent(b.eventId);
    const kb = new InlineKeyboard()
      .text("Подтвердить", `admin:bstatus:${b.id}:confirmed`)
      .text("Оплачено", `admin:bstatus:${b.id}:paid`)
      .row()
      .text("Отменить", `admin:bstatus:${b.id}:cancelled`)
      .row()
      .text("← Список", "admin:bookings");
    await editOrReply(
      ctx,
      [
        `<b>Бронь</b> ${b.id.slice(0, 8)}`,
        ev?.title ?? b.eventId,
        `${b.name} · ${b.phone}`,
        `@${b.tgUsername ?? "—"} · tg:${b.tgUserId}`,
        `Статус: ${b.status}`,
      ].join("\n"),
      kb
    );
  });

  bot.callbackQuery(/^admin:bstatus:(.+):(pending|paid|cancelled|confirmed)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) return;
    const [, id, status] = ctx.match!;
    store.updateBookingStatus(
      id,
      status as "pending" | "paid" | "cancelled" | "confirmed"
    );
    await editOrReply(
      ctx,
      `Статус брони обновлён: <b>${status}</b>`,
      adminHomeKeyboard()
    );
  });

  bot.callbackQuery("admin:leads", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) return;
    const leads = store.listLeads().slice(0, 20);
    if (!leads.length) {
      await editOrReply(ctx, "Заявок пока нет.", adminHomeKeyboard());
      return;
    }
    const kb = new InlineKeyboard();
    for (const lead of leads) {
      kb.text(
        `${lead.status === "new" ? "●" : "○"} ${lead.name.slice(0, 18)} · ${lead.phone}`,
        `admin:lead:${lead.id}`
      ).row();
    }
    kb.text("← Админ", "admin:home");
    await editOrReply(ctx, "<b>Заявки</b> (сайт и бот)", kb);
  });

  bot.callbackQuery(/^admin:lead:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) return;
    const lead = store.getLead(ctx.match![1]);
    if (!lead) {
      await editOrReply(ctx, "Не найдено.", adminHomeKeyboard());
      return;
    }
    const kb = new InlineKeyboard()
      .text("В работе", `admin:lstatus:${lead.id}:in_progress`)
      .text("Готово", `admin:lstatus:${lead.id}:done`)
      .row()
      .text("Отменить", `admin:lstatus:${lead.id}:cancelled`)
      .row()
      .text("← Список", "admin:leads");
    await editOrReply(
      ctx,
      [
        `<b>Заявка</b> ${lead.id.slice(0, 8)}`,
        `Источник: ${lead.source}`,
        lead.serviceId ? `Услуга: ${lead.serviceId}` : "",
        `${lead.name} · ${lead.phone}`,
        lead.comment ? lead.comment : "",
        `Статус: ${lead.status}`,
      ]
        .filter(Boolean)
        .join("\n"),
      kb
    );
  });

  bot.callbackQuery(/^admin:lstatus:(.+):(new|in_progress|done|cancelled)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) return;
    const [, id, status] = ctx.match!;
    store.updateLeadStatus(id, status as "new" | "in_progress" | "done" | "cancelled");
    await editOrReply(
      ctx,
      `Статус заявки: <b>${status}</b>`,
      adminHomeKeyboard()
    );
  });

  bot.callbackQuery("admin:event:create", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isAdmin(ctx.from?.id)) return;
    ctx.session.adminDraft = { step: "title" };
    await editOrReply(
      ctx,
      "<b>Новое мероприятие</b>\nШаг 1/5 — отправьте название:",
      backKeyboard("admin:home")
    );
  });

  bot.on("message:text", async (ctx, next) => {
    if (!isAdmin(ctx.from?.id)) return next();
    const draft = ctx.session.adminDraft;
    if (!draft?.step) return next();

    const text = ctx.message.text.trim();

    if (draft.step === "title") {
      draft.title = text;
      draft.step = "description";
      await ctx.reply("Шаг 2/5 — описание:");
      return;
    }
    if (draft.step === "description") {
      draft.description = text;
      draft.step = "date";
      await ctx.reply(
        "Шаг 3/5 — дата и время в формате ДД.ММ.ГГГГ ЧЧ:ММ\nнапример: 30.05.2026 18:00"
      );
      return;
    }
    if (draft.step === "date") {
      const m = text.match(
        /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/
      );
      if (!m) {
        await ctx.reply("Неверный формат. Пример: 30.05.2026 18:00");
        return;
      }
      const [, dd, mm, yyyy, hh, mi] = m;
      const d = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh),
        Number(mi)
      );
      if (Number.isNaN(d.getTime())) {
        await ctx.reply("Дата не распознана, попробуйте снова.");
        return;
      }
      draft.dateIso = d.toISOString();
      draft.step = "price";
      await ctx.reply("Шаг 4/5 — цена в рублях (число):");
      return;
    }
    if (draft.step === "price") {
      const price = Number(text.replace(/\s/g, ""));
      if (!Number.isFinite(price) || price < 0) {
        await ctx.reply("Введите число, например 4500");
        return;
      }
      draft.priceRub = Math.round(price);
      draft.step = "seats";
      await ctx.reply("Шаг 5/5 — количество мест:");
      return;
    }
    if (draft.step === "seats") {
      const seats = Number(text);
      if (!Number.isFinite(seats) || seats < 1) {
        await ctx.reply("Введите целое число мест, например 12");
        return;
      }
      const event = store.createEvent({
        title: draft.title!,
        description: draft.description!,
        dateIso: draft.dateIso!,
        priceRub: draft.priceRub!,
        seatsTotal: Math.round(seats),
        status: "upcoming",
      });
      ctx.session.adminDraft = undefined;
      await ctx.reply(
        `Создано: <b>${event.title}</b>\nid: ${event.id}`,
        { parse_mode: "HTML", reply_markup: adminHomeKeyboard() }
      );
    }
  });
}
