import { Bot, session } from "grammy";
import path from "node:path";
import {
  openDatabase,
  Store,
  createPaymentProvider,
  createDikidiClient,
} from "@tatiana/shared";
import { env } from "./config.js";
import { createApi } from "./api.js";
import {
  registerUserHandlers,
  type BotContext,
  type SessionData,
} from "./handlers/user.js";
import { registerAdminHandlers } from "./admin/handlers.js";

async function main() {
  const db = openDatabase(path.resolve(env.databasePath));
  const store = new Store(db);

  if (store.countEvents() === 0) {
    const inTwoWeeks = new Date();
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
    inTwoWeeks.setHours(18, 0, 0, 0);
    const inMonth = new Date();
    inMonth.setDate(inMonth.getDate() + 30);
    inMonth.setHours(11, 0, 0, 0);
    const past = new Date();
    past.setDate(past.getDate() - 21);
    past.setHours(18, 0, 0, 0);
    store.createEvent({
      title: "Группа «Треугольник власти»",
      description:
        "Однодневная группа: роли, вторичные выгоды и выход в реальную жизнь.",
      dateIso: inTwoWeeks.toISOString(),
      priceRub: 4500,
      seatsTotal: 12,
      status: "upcoming",
    });
    store.createEvent({
      title: "Вечер ресурсной группы",
      description:
        "Закрытая встреча для тех, кто уже в терапии или готов к бережной групповой работе.",
      dateIso: inMonth.toISOString(),
      priceRub: 3000,
      seatsTotal: 10,
      status: "upcoming",
    });
    store.createEvent({
      title: "Интенсив по границам",
      description: "Прошедшее мероприятие: работа с личными границами.",
      dateIso: past.toISOString(),
      priceRub: 4000,
      seatsTotal: 14,
      status: "past",
    });
    console.log("Seeded demo events");
  }

  const payments = createPaymentProvider({
    PAYMENT_PROVIDER: env.paymentProvider,
    YOOKASSA_SHOP_ID: env.yookassaShopId,
    YOOKASSA_SECRET_KEY: env.yookassaSecretKey,
  });
  const dikidi = createDikidiClient({
    DIKIDI_PROVIDER: env.dikidiProvider,
    DIKIDI_API_URL: env.dikidiApiUrl,
    DIKIDI_TOKEN: env.dikidiToken,
    DIKIDI_COMPANY_ID: env.dikidiCompanyId,
    DIKIDI_BOOKING_URL: env.dikidiBookingUrl,
  });

  const app = createApi(store, payments);
  app.listen(env.port, env.host, () => {
    console.log(`API http://${env.host}:${env.port}`);
  });

  const tokenOk =
    Boolean(env.botToken) &&
    !env.botToken.includes("REPLACE") &&
    !env.botToken.startsWith("123456:");
  if (!tokenOk) {
    console.warn(
      "BOT_TOKEN не задан или тестовый — API работает, бот не запущен. Укажите токен в .env"
    );
    return;
  }

  const bot = new Bot<BotContext>(env.botToken);
  bot.use(
    session({
      initial: (): SessionData => ({}),
    })
  );

  registerUserHandlers(bot, store, payments, dikidi);
  registerAdminHandlers(bot, store);

  bot.catch((err) => {
    console.error("Bot error", err);
  });

  try {
    await bot.start({
      onStart: (info) => console.log(`Bot @${info.username} started`),
    });
  } catch (e) {
    console.error("Не удалось запустить бота (API продолжает работать):", e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
