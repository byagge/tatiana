import logging

from aiogram import Bot

from app.config import settings
from app.content import service_by_id

log = logging.getLogger("tatiana.notify")


def format_lead(lead: dict) -> str:
    source = "с сайта" if lead.get("source") == "web" else "из бота"
    service = service_by_id(lead["serviceId"]) if lead.get("serviceId") else None
    username = lead.get("tgUsername")
    lines = [
        f"🔔 <b>Новая заявка</b>",
        f"Источник: {source}",
        f"Услуга: {service['title']}" if service else "",
        f"{lead.get('name')} · {lead.get('phone')}",
        f"@{username}" if username else "",
        lead.get("comment") or "",
    ]
    return "\n".join(x for x in lines if x)


async def send_lead_to_admins(bot: Bot | None, lead: dict) -> None:
    if not bot:
        log.warning("бот не запущен — заявка не ушла админу")
        return
    text = format_lead(lead)
    for admin_id in settings.admins:
        try:
            await bot.send_message(admin_id, text, parse_mode="HTML")
        except Exception:
            log.exception("не удалось отправить заявку админу %s", admin_id)
