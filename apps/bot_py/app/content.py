SERVICES = [
    {
        "id": "personal",
        "title": "Личная консультация",
        "description": "Индивидуальная онлайн или офлайн-сессия. Разбираем ваш запрос грамотно и бережно.",
        "price": 6000,
    },
    {
        "id": "group",
        "title": "Групповые",
        "description": "Закрытые группы и тематические встречи. Запись через бота.",
        "price": 3000,
    },
    {
        "id": "supervision",
        "title": "Супервизия",
        "description": "Супервизия для специалистов: поддержка практики и взгляд со стороны.",
        "price": 3000,
    },
    {
        "id": "course",
        "title": "Видео-курсы",
        "description": "Готовые материалы для самостоятельной работы в удобном темпе.",
        "price": 3000,
        "price_from": True,
    },
]

CONTACT = {
    "name": "Татьяна Канунникова",
    "role": "Психотерапевт | супервизор",
    "tagline": "Эффективная психотерапия",
    "email": "stvekb@gmail.com",
    "phone": "+7 927 086-77-71",
    "address": "Екатеринбург, ул. Белинского, 34",
    "telegram": "https://t.me/Tatiayna_Kann",
}

ABOUT = (
    "Психолог, психотерапевт и супервизор. Работаю бережно и по делу — "
    "индивидуально, в группе и через готовые материалы."
)


def format_price(service: dict) -> str:
    amount = f"{service['price']:,}".replace(",", " ")
    if service.get("price_from"):
        return f"от {amount} ₽"
    return f"{amount} ₽"


def service_by_id(sid: str) -> dict | None:
    return next((s for s in SERVICES if s["id"] == sid), None)
