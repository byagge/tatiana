import asyncio
import logging
from contextlib import asynccontextmanager

import uvicorn
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

from app.api import create_api
from app.config import settings
from app.handlers import admin, user

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("tatiana")


def build_dispatcher() -> Dispatcher:
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(admin.router)
    dp.include_router(user.router)
    return dp


@asynccontextmanager
async def lifespan(app):
    if not settings.bot_token or "REPLACE" in settings.bot_token:
        log.warning("BOT_TOKEN не задан — только API")
        yield
        return

    bot = Bot(
        settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = build_dispatcher()
    app.state.bot = bot
    task = asyncio.create_task(dp.start_polling(bot))
    me = await bot.get_me()
    log.info("Bot @%s started (aiogram, single-message nav)", me.username)
    try:
        yield
    finally:
        await dp.stop_polling()
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
        await bot.session.close()


app = create_api(lifespan=lifespan)


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )
