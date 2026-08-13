import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
dotenv.config({ path: path.join(root, ".env") });

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const env = {
  botToken: required("BOT_TOKEN", "000000:REPLACE_ME"),
  adminIds: (process.env.ADMIN_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number),
  publicApiUrl: process.env.PUBLIC_API_URL ?? "http://localhost:3001",
  webUrl: process.env.WEB_URL ?? "http://localhost:5173",
  botUsername: process.env.BOT_USERNAME ?? "",
  databasePath:
    process.env.DATABASE_PATH ?? path.join(root, "data", "tatiana.json"),
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? "0.0.0.0",
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "stub",
  yookassaShopId: process.env.YOOKASSA_SHOP_ID ?? "",
  yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY ?? "",
  yookassaReturnUrl:
    process.env.YOOKASSA_RETURN_URL ?? "http://localhost:5173/#contacts",
  dikidiProvider: process.env.DIKIDI_PROVIDER ?? "stub",
  dikidiApiUrl: process.env.DIKIDI_API_URL ?? "https://api.dikidi.ru",
  dikidiToken: process.env.DIKIDI_TOKEN ?? "",
  dikidiCompanyId: process.env.DIKIDI_COMPANY_ID ?? "",
  dikidiBookingUrl: process.env.DIKIDI_BOOKING_URL ?? "https://dikidi.ru/",
};

export function isAdmin(userId?: number): boolean {
  if (!userId) return false;
  if (env.adminIds.length === 0) return false;
  return env.adminIds.includes(userId);
}
