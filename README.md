# Татьяна Канунникова — сайт + Telegram-бот

Одностраничный лендинг в фирстиле (тёмный premium) и Telegram-бот с single-message navigation: оплата, запись DIKIDI, групповая терапия, мероприятия, админка.

## Структура

```
apps/web          — Vite + React (лендинг)
apps/bot          — Grammy + Express API
packages/shared   — JSON DB, ЮKassa/DIKIDI адаптеры, контент
data/             — JSON БД (создаётся автоматически)
```

Хранилище — JSON (`data/tatiana.json`), без нативных модулей. Интерфейс Store совместим с будущей заменой на SQLite при необходимости.
## Быстрый старт

```bash
cp .env.example .env
# укажите BOT_TOKEN и ADMIN_IDS (ваш Telegram user id)

npm install
npm run seed          # демо-мероприятия
npm run dev:bot       # aiogram + API :3001
npm run dev:web       # сайт :5173 (прокси /api → :3001)
```

Сайт: http://localhost:5173  
API health: http://localhost:3001/api/health

Без `BOT_TOKEN` API всё равно поднимется — бот просто не стартует.

## Переменные окружения

| Ключ | Назначение |
|------|------------|
| `BOT_TOKEN` | токен BotFather |
| `ADMIN_IDS` | Telegram ID админов через запятую |
| `PAYMENT_PROVIDER` | `leads` (заявки, сейчас) / `stub` / `yookassa` |
| `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` | ключи ЮKassa |
| `YOOKASSA_RETURN_URL` | куда вернуть после оплаты |
| `DIKIDI_PROVIDER` | `stub` или `live` |
| `DIKIDI_BOOKING_URL` | публичная ссылка записи |
| `DIKIDI_TOKEN` / `DIKIDI_COMPANY_ID` / `DIKIDI_API_URL` | для live API |
| `DATABASE_PATH` | путь к JSON-хранилищу |
| `PORT` | порт API (3001) |
| `WEB_URL` / `PUBLIC_API_URL` | публичные URL |

### Оплата

Сейчас `PAYMENT_PROVIDER=leads`: вместо ЮKassa — заявка (имя/телефон) на сайте и в боте, уведомление админу. ЮKassa не открывает магазин без боевого домена.

Когда сайт будет на https: `PAYMENT_PROVIDER=yookassa` + shopId/secret, webhook `https://<домен>/api/payments/yookassa/webhook`.

### DIKIDI

Компания `116141` — [Центр Психотерапии](https://dikidi.net/ru/profile/centr_psixoterapii_116141) (Екатеринбург, Белинского 34).  
Онлайн-запись: `https://dikidi.net/116141` (страница Татьяны: master `272169`).  
Старый URL `dikidi.ru/ru/widget/record/?company=116141` показывает «Компания не найдена» — его не использовать.

## Telegram Premium emoji

В боте используются теги как в aiogram:

```html
<tg-emoji emoji-id="5453969572354878595">⭐</tg-emoji>
```

и `icon_custom_emoji_id` на inline-кнопках (Grammy `.icon(...)`).

Чтобы кастомные эмодзи **отображались** (а не только fallback):
1. привяжите к боту username с [Fragment](https://fragment.com/), **или**
2. для иконок кнопок — Premium у владельца бота.

ID можно подставить свои в `apps/bot/src/emoji.ts` (через @idstickerbot / @Emoji_ID_Extractor_bot).

## DIKIDI на сайте

В блоке записи встроен iframe-виджет. В `apps/web/.env`:

```
VITE_DIKIDI_EMBED_URL=https://...   # URL из кабинета DIKIDI (лучший вариант)
# или
VITE_DIKIDI_COMPANY_ID=123456
```

Код виджета: DIKIDI Business → Настройки → Онлайн-запись → Виджет на сайт.

- Оплата услуг (stub/ЮKassa ссылка)
- Запись DIKIDI
- Групповая терапия (бронь + оплата, не DIKIDI)
- Мероприятия (будущие / прошедшие)
- Контакты

**Админ** (`ADMIN_IDS` или `/admin`):

- создание мероприятия (название → описание → дата → цена → места)
- список, перевод upcoming/past, удаление
- бронирования: подтвердить / оплачено / отменить

## Сайт

Секции: Hero → USP → Услуги → Обо мне → Feature → Как это работает → Запись/оплата → Мероприятия → Контакты → Footer.

Цвета фирстиля: `#2F2C27`, `#F4F0ED`, `#CBC4BD`, `#452B29`.  
Шрифты: Playfair Display, Avenir Next Cyr, Geometria.

## API

- `GET /api/health`
- `GET /api/content`
- `GET /api/events?status=upcoming|past`
- `POST /api/bookings`
- `POST /api/payments/create`
- `POST /api/payments/yookassa/webhook`

## Production

```bash
npm run build
npm run start:bot
# статику apps/web/dist раздать через nginx/CDN; /api проксировать на бот
```
