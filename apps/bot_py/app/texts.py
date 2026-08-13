from datetime import datetime

from app.content import ABOUT, CONTACT
from app.emoji import (
    CAL,
    CANDLE,
    DIAMOND,
    FOLDER,
    LEAF,
    MAIL,
    MONEY,
    PHONE,
    PIN,
    SPARK,
    STAR,
)


def home() -> str:
    return "\n".join(
        [
            f"{LEAF} <b>{CONTACT['name']}</b>",
            f"{SPARK} <i>{CONTACT['role']}</i>",
            "",
            "Эффективная психотерапия — индивидуально, в группе и через готовые материалы.",
            "",
            f"{STAR} Выберите раздел",
        ]
    )


def about() -> str:
    return "\n".join(
        [
            f"{LEAF} <b>{CONTACT['name']}</b>",
            f"{SPARK} {CONTACT['role']}",
            "",
            ABOUT,
            "",
            f"{PIN} Екатеринбург · онлайн",
        ]
    )


def contacts(web_url: str) -> str:
    return "\n".join(
        [
            f"{LEAF} <b>{CONTACT['name']}</b>",
            f"{SPARK} {CONTACT['role']}",
            "",
            f"{MAIL}  {CONTACT['email']}",
            f"{PHONE}  {CONTACT['phone']}",
            f"{PIN}  {CONTACT['address']}",
            "",
            f"{STAR}  {web_url}",
        ]
    )


def lead_intro() -> str:
    return (
        f"{MONEY} <b>Заявка</b>\n\n"
        "Оставьте имя и телефон — свяжемся и подскажем, как записаться и оплатить.\n\n"
        "Выберите услугу:"
    )


def format_event(ev: dict) -> str:
    try:
        dt = datetime.fromisoformat(ev["dateIso"].replace("Z", "+00:00"))
        date = dt.strftime("%d.%m.%Y %H:%M")
    except Exception:
        date = ev.get("dateIso", "")
    seats = f"{ev.get('seatsTaken', 0)}/{ev.get('seatsTotal', 0)}"
    return "\n".join(
        [
            f"{CANDLE} <b>{ev['title']}</b>",
            f"{CAL} {date}",
            f"{DIAMOND} {ev['priceRub']:,} ₽ · мест {seats}".replace(",", " "),
            "",
            ev.get("description") or "",
        ]
    )
