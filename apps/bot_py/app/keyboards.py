from urllib.parse import urlparse

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.emoji import E


def _btn(
    text: str,
    data: str | None = None,
    url: str | None = None,
    icon: str | None = None,
    style: str | None = None,
) -> InlineKeyboardButton:
    kwargs: dict = {"text": text}
    if url:
        kwargs["url"] = url
    else:
        kwargs["callback_data"] = data or text
    if icon:
        kwargs["icon_custom_emoji_id"] = icon
    if style:
        kwargs["style"] = style
    try:
        return InlineKeyboardButton(**kwargs)
    except (TypeError, ValueError):
        kwargs.pop("icon_custom_emoji_id", None)
        kwargs.pop("style", None)
        return InlineKeyboardButton(**kwargs)


def _safe_url(url: str) -> bool:
    try:
        u = urlparse(url)
        host = (u.hostname or "").lower()
        if u.scheme not in {"http", "https"}:
            return False
        if host in {"localhost", "127.0.0.1", "0.0.0.0"} or host.endswith(".local"):
            return False
        if host.startswith("192.168.") or host.startswith("10."):
            return False
        return True
    except Exception:
        return False


def rows(*pairs: list[InlineKeyboardButton]) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=list(pairs))


def main_menu(is_admin: bool) -> InlineKeyboardMarkup:
    kb = [
        [
            _btn("Заявка", "nav:lead", icon=E.money, style="primary"),
            _btn("Запись", "nav:dikidi", icon=E.calendar, style="success"),
        ],
        [
            _btn("Группы", "nav:groups", icon=E.people),
            _btn("События", "nav:events", icon=E.folder),
        ],
        [
            _btn("Обо мне", "nav:about", icon=E.sparkles),
            _btn("Контакты", "nav:contacts", icon=E.mail),
        ],
    ]
    if is_admin:
        kb.append([_btn("Админ", "admin:home", icon=E.gear)])
    return InlineKeyboardMarkup(inline_keyboard=kb)


def back_menu(to: str = "nav:home") -> InlineKeyboardMarkup:
    return rows(
        [
            _btn("← Назад", to, icon=E.back),
            _btn("Меню", "nav:home", icon=E.home, style="primary"),
        ]
    )


def admin_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                _btn("Создать", "admin:event:create", icon=E.sparkles, style="success"),
                _btn("Список", "admin:events", icon=E.folder),
            ],
            [
                _btn("Брони", "admin:bookings", icon=E.memo),
                _btn("Заявки", "admin:leads", icon=E.bell),
            ],
            [_btn("Меню", "nav:home", icon=E.home, style="primary")],
        ]
    )


def grid(
    items: list[tuple[str, str, str | None]],
    footer: list[InlineKeyboardButton] | None = None,
) -> InlineKeyboardMarkup:
    line: list[InlineKeyboardButton] = []
    kb: list[list[InlineKeyboardButton]] = []
    for title, data, icon in items:
        line.append(_btn(title, data, icon=icon))
        if len(line) == 2:
            kb.append(line)
            line = []
    if line:
        kb.append(line)
    if footer:
        kb.append(footer)
    return InlineKeyboardMarkup(inline_keyboard=kb)


def url_or_cb(label: str, url: str, fallback: str, icon: str | None = None, style: str | None = None) -> InlineKeyboardButton:
    if _safe_url(url):
        return _btn(label, url=url, icon=icon, style=style)
    return _btn(label, fallback, icon=icon, style=style)
