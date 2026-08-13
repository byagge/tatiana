import re

from aiogram import F, Router
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from app.config import settings
from app.content import SERVICES, service_by_id
from app.emoji import (
    CAL,
    CANDLE,
    CHECK,
    DIAMOND,
    FIRE,
    FOLDER,
    GEAR,
    LEAF,
    MEMO,
    MONEY,
    PEOPLE,
    PHONE,
    SPARK,
    E,
)
from app.keyboards import (
    admin_menu,
    back_menu,
    grid,
    main_menu,
    rows,
    url_or_cb,
    _btn,
)
from app.nav import drop_user_message, show
from app.notify import send_lead_to_admins
from app.states import Flow
from app.store import Store
from app.texts import about, contacts, format_event, home, lead_intro

router = Router()
store = Store(settings.database_path)


def _admin(uid: int | None) -> bool:
    return settings.is_admin(uid)


async def _idle(state: FSMContext) -> None:
    await state.set_state(Flow.idle)


def _clean_name(text: str) -> str | None:
    name = text.strip()
    if len(name) < 2 or name.startswith("/") or not any(ch.isalpha() for ch in name):
        return None
    return name


def _clean_phone(text: str) -> str | None:
    raw = text.strip()
    digits = re.sub(r"\D", "", raw)
    if len(digits) < 10:
        return None
    return raw


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    await state.clear()
    await state.update_data(
        screen_chat=data.get("screen_chat"),
        screen_msg=data.get("screen_msg"),
    )
    await show(
        message,
        home(),
        main_menu(_admin(message.from_user.id if message.from_user else None)),
        state,
        fresh=True,
    )


@router.message(Command("menu"))
async def cmd_menu(message: Message, state: FSMContext) -> None:
    await state.set_state(Flow.idle)
    await drop_user_message(message)
    await show(
        message,
        home(),
        main_menu(_admin(message.from_user.id if message.from_user else None)),
        state,
        fresh=True,
    )


@router.message(Command("admin"))
async def cmd_admin(message: Message, state: FSMContext) -> None:
    if not _admin(message.from_user.id if message.from_user else None):
        await show(message, f"{FIRE} Нет доступа.", back_menu(), state)
        return
    await show(message, f"{GEAR} <b>Админ-панель</b>\nМероприятия, брони и заявки.", admin_menu(), state)


@router.callback_query(F.data == "nav:home")
async def nav_home(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    await _idle(state)
    await show(cq, home(), main_menu(_admin(cq.from_user.id)), state)


@router.callback_query(F.data == "nav:about")
async def nav_about(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    await _idle(state)
    kb = rows(
        [_btn("Запись", "nav:dikidi", icon=E.calendar), _btn("Заявка", "nav:lead", icon=E.money)],
        [_btn("Назад", "nav:home", icon=E.back), _btn("Контакты", "nav:contacts", icon=E.mail)],
    )
    await show(cq, about(), kb, state)


@router.callback_query(F.data == "nav:lead")
async def nav_lead(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    await _idle(state)
    items = [(s["title"], f"lead:{s['id']}", E.diamond) for s in SERVICES]
    await show(
        cq,
        lead_intro(),
        grid(items, [_btn("Назад", "nav:home", icon=E.back), _btn("Меню", "nav:home", icon=E.home)]),
        state,
    )


@router.callback_query(F.data.startswith("lead:"))
async def lead_pick(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    sid = cq.data.split(":", 1)[1]
    service = service_by_id(sid)
    if not service:
        await show(cq, f"{FIRE} Услуга не найдена.", back_menu("nav:lead"), state)
        return
    await state.set_state(Flow.lead_name)
    await state.update_data(service_id=sid)
    text = (
        f"{SPARK} <b>{service['title']}</b>\n"
        f"{DIAMOND} {service['price']:,} ₽\n\n"
        f"{service['description']}\n\n"
        "Как вас зовут?"
    ).replace(",", " ")
    await show(cq, text, back_menu("nav:lead"), state)


@router.callback_query(F.data == "nav:dikidi")
async def nav_dikidi(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    await _idle(state)
    url = settings.dikidi_url
    kb = rows(
        [url_or_cb("Открыть запись", url, "nav:home", E.calendar, style="success")],
        [_btn("Назад", "nav:home", icon=E.back), _btn("Группы", "nav:groups", icon=E.people)],
    )
    await show(
        cq,
        f"{CAL} <b>Индивидуальная запись</b>\n"
        "Онлайн и офлайн через DIKIDI.\n\n"
        f"{CHECK} Компания подключена — запись откроется в виджете.",
        kb,
        state,
    )


@router.callback_query(F.data == "nav:groups")
async def nav_groups(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    await _idle(state)
    events = store.list_events("upcoming")
    if not events:
        await show(
            cq,
            f"{PEOPLE} <b>Групповая терапия</b>\n\nПока нет открытых групп. {LEAF}",
            back_menu(),
            state,
        )
        return
    items = [
        (f"{ev['title'][:26]} · {ev['seatsTotal'] - ev['seatsTaken']}", f"group:{ev['id']}", E.people)
        for ev in events
    ]
    await show(
        cq,
        f"{PEOPLE} <b>Групповая терапия</b>\n\nЗапись здесь, не через DIKIDI. Выберите группу:",
        grid(items, [_btn("Назад", "nav:home", icon=E.back), _btn("Меню", "nav:home", icon=E.home)]),
        state,
    )


@router.callback_query(F.data.startswith("group:"))
async def group_one(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    ev = store.get_event(cq.data.split(":", 1)[1])
    if not ev or ev.get("status") != "upcoming":
        await show(cq, f"{FIRE} Мероприятие недоступно.", back_menu("nav:groups"), state)
        return
    kb = rows(
        [_btn("Забронировать", f"book:{ev['id']}", icon=E.check), _btn("К группам", "nav:groups", icon=E.back)]
    )
    await show(cq, format_event(ev), kb, state)


@router.callback_query(F.data.startswith("book:"))
async def book_start(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    event_id = cq.data.split(":", 1)[1]
    ev = store.get_event(event_id)
    if not ev:
        await show(cq, f"{FIRE} Не найдено.", back_menu("nav:groups"), state)
        return
    await state.set_state(Flow.book_name)
    await state.update_data(event_id=event_id)
    await show(
        cq,
        f"{MEMO} Бронь: <b>{ev['title']}</b>\n\nКак вас зовут?",
        back_menu("nav:groups"),
        state,
    )


@router.callback_query(F.data == "nav:events")
async def nav_events(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    await _idle(state)
    kb = rows(
        [_btn("Предстоящие", "events:upcoming", icon=E.calendar), _btn("Прошедшие", "events:past", icon=E.folder)],
        [_btn("Назад", "nav:home", icon=E.back), _btn("Меню", "nav:home", icon=E.home)],
    )
    await show(cq, f"{FOLDER} <b>Мероприятия</b>\n\nВыберите список:", kb, state)


@router.callback_query(F.data.in_({"events:upcoming", "events:past"}))
async def events_list(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    await _idle(state)
    kind = "upcoming" if cq.data.endswith("upcoming") else "past"
    events = store.list_events(kind)
    if not events:
        text = (
            f"{LEAF} Пока нет предстоящих мероприятий."
            if kind == "upcoming"
            else f"{FOLDER} Архив пока пуст."
        )
        await show(cq, text, back_menu("nav:events"), state)
        return
    lines = []
    for ev in events:
        try:
            from datetime import datetime

            d = datetime.fromisoformat(ev["dateIso"].replace("Z", "+00:00")).strftime("%d.%m.%Y")
        except Exception:
            d = ""
        lines.append(f"• <b>{ev['title']}</b>\n  {d} · {ev['priceRub']} ₽")
    items = []
    if kind == "upcoming":
        items = [(ev["title"][:28], f"group:{ev['id']}", E.calendar) for ev in events]
    title = f"{CAL} Предстоящие" if kind == "upcoming" else f"{FOLDER} Прошедшие"
    await show(
        cq,
        f"<b>{title}</b>\n\n" + "\n\n".join(lines),
        grid(items, [_btn("Назад", "nav:events", icon=E.back), _btn("Меню", "nav:home", icon=E.home)]),
        state,
    )


@router.callback_query(F.data == "nav:contacts")
async def nav_contacts(cq: CallbackQuery, state: FSMContext) -> None:
    await cq.answer()
    await _idle(state)
    kb = rows(
        [
            url_or_cb("Канал", "https://t.me/Tatiayna_Kann", "nav:home", E.bell),
            _btn("Телефон", "contact:phone", icon=E.phone),
        ],
        [_btn("Почта", "contact:email", icon=E.mail), _btn("Сайт", "contact:site", icon=E.star)],
        [_btn("Назад", "nav:home", icon=E.back), _btn("Меню", "nav:home", icon=E.home)],
    )
    await show(cq, contacts(settings.web_url), kb, state)


@router.callback_query(F.data == "contact:phone")
async def contact_phone(cq: CallbackQuery) -> None:
    await cq.answer("+7 927 086-77-71", show_alert=True)


@router.callback_query(F.data == "contact:email")
async def contact_email(cq: CallbackQuery) -> None:
    await cq.answer("stvekb@gmail.com", show_alert=True)


@router.callback_query(F.data == "contact:site")
async def contact_site(cq: CallbackQuery) -> None:
    await cq.answer(f"Сайт: {settings.web_url}", show_alert=True)


@router.message(Flow.lead_name, F.text)
async def lead_name(message: Message, state: FSMContext) -> None:
    await drop_user_message(message)
    name = _clean_name(message.text or "")
    if not name:
        await show(
            message,
            f"{FIRE} Напишите имя — минимум 2 буквы.",
            back_menu("nav:lead"),
            state,
        )
        return
    await state.update_data(name=name)
    await state.set_state(Flow.lead_phone)
    await show(message, f"{PHONE} Телефон для связи (например +7…):", back_menu("nav:lead"), state)


@router.message(Flow.lead_phone, F.text)
async def lead_phone(message: Message, state: FSMContext) -> None:
    await drop_user_message(message)
    phone = _clean_phone(message.text or "")
    if not phone:
        await show(
            message,
            f"{FIRE} Укажите телефон с кодом, например +7 927 000-00-00.",
            back_menu("nav:lead"),
            state,
        )
        return
    data = await state.get_data()
    name = data.get("name")
    if not name:
        await state.set_state(Flow.lead_name)
        await show(message, "Как вас зовут?", back_menu("nav:lead"), state)
        return
    sid = data.get("service_id") or "personal"
    lead = store.create_lead(
        name=name,
        phone=phone,
        source="bot",
        service_id=sid,
        tg_user_id=message.from_user.id if message.from_user else None,
        tg_username=message.from_user.username if message.from_user else None,
    )
    service = service_by_id(sid)
    await _idle(state)
    uid = message.from_user.id if message.from_user else None
    text = (
        f"{CHECK} <b>Заявка принята</b>\n"
        f"{service['title'] if service else ''}\n"
        f"{name}, {phone}\n\n"
        "Свяжемся и подскажем, как оплатить."
    )
    await show(message, text, main_menu(_admin(uid)), state)
    await send_lead_to_admins(message.bot, lead)


@router.message(Flow.book_name, F.text)
async def book_name(message: Message, state: FSMContext) -> None:
    await drop_user_message(message)
    name = _clean_name(message.text or "")
    if not name:
        await show(
            message,
            f"{FIRE} Напишите имя — минимум 2 буквы.",
            back_menu("nav:groups"),
            state,
        )
        return
    await state.update_data(name=name)
    await state.set_state(Flow.book_phone)
    await show(message, f"{PHONE} Телефон для связи (например +7…):", back_menu("nav:groups"), state)


@router.message(Flow.book_phone, F.text)
async def book_phone(message: Message, state: FSMContext) -> None:
    await drop_user_message(message)
    phone = _clean_phone(message.text or "")
    if not phone:
        await show(
            message,
            f"{FIRE} Укажите телефон с кодом, например +7 927 000-00-00.",
            back_menu("nav:groups"),
            state,
        )
        return
    data = await state.get_data()
    name = data.get("name")
    if not name:
        await state.set_state(Flow.book_name)
        await show(message, "Как вас зовут?", back_menu("nav:groups"), state)
        return
    event_id = data.get("event_id")
    await state.set_state(Flow.idle)
    try:
        ev = store.get_event(event_id)
        if not ev:
            raise ValueError("EVENT_NOT_FOUND")
        booking = store.create_booking(
            event_id,
            name,
            phone,
            tg_user_id=message.from_user.id if message.from_user else 0,
            tg_username=message.from_user.username if message.from_user else None,
        )
        lead = store.create_lead(
            name=name,
            phone=phone,
            source="bot",
            service_id="group",
            event_id=event_id,
            comment=f"Бронь группы {ev['title']}",
            tg_user_id=message.from_user.id if message.from_user else None,
            tg_username=message.from_user.username if message.from_user else None,
        )
        text = (
            f"{CHECK} <b>Заявка на группу принята</b>\n"
            f"{CANDLE} {ev['title']}\n"
            f"{PEOPLE} {name}, {phone}\n"
            f"{DIAMOND} {ev['priceRub']} ₽\n\n"
            "Свяжемся и подтвердим участие."
        )
        uid = message.from_user.id if message.from_user else None
        await show(message, text, main_menu(_admin(uid)), state)
        await send_lead_to_admins(message.bot, lead)
    except ValueError as err:
        code = str(err)
        msg = {
            "NO_SEATS": f"{FIRE} Мест больше нет.",
            "EVENT_NOT_OPEN": f"{FIRE} Запись закрыта.",
        }.get(code, f"{FIRE} Не удалось создать бронь.")
        await show(message, msg, main_menu(_admin(message.from_user.id if message.from_user else None)), state)
