import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase, Store } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const dbPath =
  process.env.DATABASE_PATH ?? path.join(root, "data", "tatiana.json");

const db = openDatabase(dbPath);
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
      "Однодневная группа: роли, вторичные выгоды и выход в реальную жизнь — не «в теории из интернета».",
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
    description:
      "Прошедшее мероприятие: работа с личными границами и коммуникацией.",
    dateIso: past.toISOString(),
    priceRub: 4000,
    seatsTotal: 14,
    status: "past",
  });

  console.log("Seeded demo events into", dbPath);
} else {
  console.log("Events already present, skip seed:", dbPath);
}