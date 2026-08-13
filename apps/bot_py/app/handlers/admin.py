import re
from datetime import datetime

from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from app.config import settings
from app.emoji import CHECK, FIRE, FOLDER, GEAR, E
from app.keyboards import admin_menu, back_menu, rows, _btn
from app.nav import drop_user_message, show
from app.states import Flow
from app.store import Store

router = Router()
store = Store(settings.database_path)


def _ok(uid: int) -> bool:
    return settings.is_admin(uid)


@router.callback_query(F.data == "admin:home")
async def admin_home(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        await show(cq, f"{FIRE} Нет доступа.", back_menu(), state)
        return
    await show(cq, f"{GEAR} <b>Админ-панель</b>\nМероприятия, брони и заявки.", admin_menu(), state)


@router.callback_query(F.data == "admin:events")
async def admin_events(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        return
    events = store.list_events()
    if not events:
        await show(cq, "Мероприятий нет.", admin_menu(), state)
        return
    kb = [[_btn(f"{'⏹' if e['status']=='past' else '▶️'} {e['title'][:32]}", f"admin:event:{e['id']}")] for e in events]
    kb.append([_btn("Назад", "admin:home", icon=E.back)])
    from aiogram.types import InlineKeyboardMarkup

    await show(cq, f"{FOLDER} <b>Все мероприятия</b>", InlineKeyboardMarkup(inline_keyboard=kb), state)


@router.callback_query(F.data == "admin:event:create")
async def admin_create_first(cq: CallbackQuery, state: FSMContext) -> None:
    await admin_create(cq, state)


@router.callback_query(F.data.startswith("admin:event:"))
async def admin_event(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        return
    ev = store.get_event(cq.data.rsplit(":", 1)[-1])
    if not ev:
        await show(cq, "Не найдено.", admin_menu(), state)
        return
    toggle = "В архив" if ev["status"] == "upcoming" else "Сделать upcoming"
    kb = rows(
        [_btn(toggle, f"admin:toggle:{ev['id']}")],
        [_btn("Брони", f"admin:bookings:{ev['id']}", icon=E.memo)],
        [_btn("Удалить", f"admin:delete:{ev['id']}", icon=E.fire), _btn("Список", "admin:events", icon=E.back)],
    )
    try:
        date = datetime.fromisoformat(ev["dateIso"].replace("Z", "+00:00")).strftime("%d.%m.%Y %H:%M")
    except Exception:
        date = ev["dateIso"]
    text = (
        f"<b>{ev['title']}</b>\n{date}\n"
        f"{ev['priceRub']} ₽ · {ev['seatsTaken']}/{ev['seatsTotal']}\n"
        f"Статус: {ev['status']}\n\n{ev.get('description') or ''}"
    )
    await show(cq, text, kb, state)


@router.callback_query(F.data.startswith("admin:toggle:"))
async def admin_toggle(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        return
    ev = store.get_event(cq.data.split(":")[-1])
    if not ev:
        return
    status = "past" if ev["status"] == "upcoming" else "upcoming"
    store.update_event(ev["id"], status=status)
    await show(cq, f"Статус «{ev['title']}» → <b>{status}</b>", admin_menu(), state)


@router.callback_query(F.data.startswith("admin:delete:"))
async def admin_delete(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        return
    store.delete_event(cq.data.split(":")[-1])
    await show(cq, f"{CHECK} Удалено.", admin_menu(), state)


@router.callback_query(F.data == "admin:bookings")
async def admin_bookings(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        return
    bookings = store.list_bookings()[:20]
    if not bookings:
        await show(cq, "Бронирований нет.", admin_menu(), state)
        return
    from aiogram.types import InlineKeyboardMarkup

    kb = []
    for b in bookings:
        ev = store.get_event(b["eventId"])
        title = (ev["title"] if ev else "?")[:22]
        kb.append([_btn(f"{b['status']} · {title}", f"admin:booking:{b['id']}")])
    kb.append([_btn("Админ", "admin:home", icon=E.gear)])
    await show(cq, "<b>Последние бронирования</b>", InlineKeyboardMarkup(inline_keyboard=kb), state)


@router.callback_query(F.data.startswith("admin:bookings:"))
async def admin_bookings_event(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        return
    event_id = cq.data.split(":")[-1]
    bookings = store.list_bookings(event_id)
    lines = (
        "\n".join(f"• {b['name']} · {b['phone']} · {b['status']}" for b in bookings)
        or "Пока пусто."
    )
    await show(
        cq,
        f"<b>Брони</b>\n{lines}",
        rows([_btn("К событию", f"admin:event:{event_id}"), _btn("Админ", "admin:home", icon=E.gear)]),
        state,
    )


@router.callback_query(F.data.startswith("admin:booking:"))
async def admin_booking(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        return
    b = store.get_booking(cq.data.split(":")[-1])
    if not b:
        await show(cq, "Не найдено.", admin_menu(), state)
        return
    ev = store.get_event(b["eventId"])
    kb = rows(
        [_btn("Подтвердить", f"admin:bstatus:{b['id']}:confirmed"), _btn("Оплачено", f"admin:bstatus:{b['id']}:paid")],
        [_btn("Отменить", f"admin:bstatus:{b['id']}:cancelled"), _btn("Список", "admin:bookings", icon=E.back)],
    )
    await show(
        cq,
        f"<b>Бронь</b> {b['id'][:8]}\n{ev['title'] if ev else b['eventId']}\n"
        f"{b['name']} · {b['phone']}\n@{b.get('tgUsername') or '—'}\nСтатус: {b['status']}",
        kb,
        state,
    )


@router.callback_query(F.data.startswith("admin:bstatus:"))
async def admin_bstatus(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        return
    _, _, bid, status = cq.data.split(":", 3)
    store.update_booking_status(bid, status)
    await show(cq, f"Статус брони: <b>{status}</b>", admin_menu(), state)


@router.callback_query(F.data == "admin:leads")
async def admin_leads(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        return
    leads = store.list_leads()[:20]
    if not leads:
        await show(cq, "Заявок пока нет.", admin_menu(), state)
        return
    from aiogram.types import InlineKeyboardMarkup

    kb = [
        [_btn(f"{'●' if l['status']=='new' else '○'} {l['name'][:16]} · {l['phone']}", f"admin:lead:{l['id']}")]
        for l in leads
    ]
    kb.append([_btn("Админ", "admin:home", icon=E.gear)])
    await show(cq, "<b>Заявки</b> (сайт и бот)", InlineKeyboardMarkup(inline_keyboard=kb), state)


@router.callback_query(F.data.startswith("admin:lead:"))
async def admin_lead(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        return
    lead = store.get_lead(cq.data.split(":")[-1])
    if not lead:
        await show(cq, "Не найдено.", admin_menu(), state)
        return
    kb = rows(
        [_btn("В работе", f"admin:lstatus:{lead['id']}:in_progress"), _btn("Готово", f"admin:lstatus:{lead['id']}:done")],
        [_btn("Отменить", f"admin:lstatus:{lead['id']}:cancelled"), _btn("Список", "admin:leads", icon=E.back)],
    )
    text = "\n".join(
        x
        for x in [
            f"<b>Заявка</b> {lead['id'][:8]}",
            f"Источник: {lead['source']}",
            f"Услуга: {lead['serviceId']}" if lead.get("serviceId") else "",
            f"{lead['name']} · {lead['phone']}",
            lead.get("comment") or "",
            f"Статус: {lead['status']}",
        ]
        if x
    )
    await show(cq, text, kb, state)


@router.callback_query(F.data.startswith("admin:lstatus:"))
async def admin_lstatus(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        return
    _, _, lid, status = cq.data.split(":", 3)
    store.update_lead_status(lid, status)
    await show(cq, f"Статус заявки: <b>{status}</b>", admin_menu(), state)


@router.callback_query(F.data == "admin:event:create")
async def admin_create(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    if not _ok(cq.from_user.id):
        return
    await state.set_state(Flow.admin_title)
    await show(cq, "<b>Новое мероприятие</b>\nШаг 1/5 — отправьте название:", back_menu("admin:home"), state)


@router.message(Flow.admin_title, F.text)
async def admin_title(message: Message, state: FSMContext) -> None:
    if not _ok(message.from_user.id if message.from_user else 0):
        return
    await drop_user_message(message)
    await state.update_data(title=message.text.strip())
    await state.set_state(Flow.admin_desc)
    await show(message, "Шаг 2/5 — описание:", back_menu("admin:home"), state)


@router.message(Flow.admin_desc, F.text)
async def admin_desc(message: Message, state: FSMContext) -> None:
    if not _ok(message.from_user.id if message.from_user else 0):
        return
    await drop_user_message(message)
    await state.update_data(description=message.text.strip())
    await state.set_state(Flow.admin_date)
    await show(
        message,
        "Шаг 3/5 — дата и время: <code>30.05.2026 18:00</code>",
        back_menu("admin:home"),
        state,
    )


@router.message(Flow.admin_date, F.text)
async def admin_date(message: Message, state: FSMContext) -> None:
    if not _ok(message.from_user.id if message.from_user else 0):
        return
    await drop_user_message(message)
    m = re.match(r"^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$", message.text.strip())
    if not m:
        await show(message, "Неверный формат. Пример: <code>30.05.2026 18:00</code>", back_menu("admin:home"), state)
        return
    dd, mm, yyyy, hh, mi = map(int, m.groups())
    try:
        dt = datetime(yyyy, mm, dd, hh, mi)
    except ValueError:
        await show(message, "Дата не распознана, попробуйте снова.", back_menu("admin:home"), state)
        return
    await state.update_data(date_iso=dt.isoformat())
    await state.set_state(Flow.admin_price)
    await show(message, "Шаг 4/5 — цена в рублях (число):", back_menu("admin:home"), state)


@router.message(Flow.admin_price, F.text)
async def admin_price(message: Message, state: FSMContext) -> None:
    if not _ok(message.from_user.id if message.from_user else 0):
        return
    await drop_user_message(message)
    try:
        price = int(message.text.replace(" ", ""))
        if price < 0:
            raise ValueError
    except ValueError:
        await show(message, "Введите число, например 4500", back_menu("admin:home"), state)
        return
    await state.update_data(price=price)
    await state.set_state(Flow.admin_seats)
    await show(message, "Шаг 5/5 — количество мест:", back_menu("admin:home"), state)


@router.message(Flow.admin_seats, F.text)
async def admin_seats(message: Message, state: FSMContext) -> None:
    if not _ok(message.from_user.id if message.from_user else 0):
        return
    await drop_user_message(message)
    try:
        seats = int(message.text.strip())
        if seats < 1:
            raise ValueError
    except ValueError:
        await show(message, "Введите целое число мест, например 12", back_menu("admin:home"), state)
        return
    data = await state.get_data()
    ev = store.create_event(
        data["title"],
        data["description"],
        data["date_iso"],
        data["price"],
        seats,
        "upcoming",
    )
    await state.set_state(Flow.idle)
    await show(message, f"{CHECK} Создано: <b>{ev['title']}</b>", admin_menu(), state)
