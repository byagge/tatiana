"""Одно сообщение на чат: только edit_text, без фото и лишних запросов."""

from __future__ import annotations

import logging

from aiogram import Bot
from aiogram.exceptions import TelegramBadRequest
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, InlineKeyboardMarkup, Message

log = logging.getLogger("tatiana.nav")


def _not_modified(err: TelegramBadRequest) -> bool:
    return "not modified" in str(err).lower()


async def show(
    target: Message | CallbackQuery,
    text: str,
    markup: InlineKeyboardMarkup,
    state: FSMContext,
    *,
    fresh: bool = False,
) -> None:
    bot: Bot = target.bot  # type: ignore[assignment]
    message = target.message if isinstance(target, CallbackQuery) else target
    if message is None:
        return

    data = await state.get_data()
    chat_id = data.get("screen_chat") or message.chat.id
    msg_id = data.get("screen_msg")

    async def remember(chat: int, mid: int) -> None:
        await state.update_data(screen_chat=chat, screen_msg=mid)

    if not fresh:
        edit_id = message.message_id if isinstance(target, CallbackQuery) else msg_id
        if edit_id:
            try:
                await bot.edit_message_text(
                    text,
                    chat_id=message.chat.id if isinstance(target, CallbackQuery) else chat_id,
                    message_id=edit_id,
                    reply_markup=markup,
                    parse_mode="HTML",
                    disable_web_page_preview=True,
                )
                await remember(
                    message.chat.id if isinstance(target, CallbackQuery) else chat_id,
                    edit_id,
                )
                return
            except TelegramBadRequest as err:
                if _not_modified(err):
                    await remember(
                        message.chat.id if isinstance(target, CallbackQuery) else chat_id,
                        edit_id,
                    )
                    return

    if msg_id:
        try:
            await bot.delete_message(chat_id, msg_id)
        except TelegramBadRequest:
            pass

    sent = await bot.send_message(
        message.chat.id,
        text,
        reply_markup=markup,
        parse_mode="HTML",
        disable_web_page_preview=True,
    )
    await remember(sent.chat.id, sent.message_id)


async def drop_user_message(message: Message) -> None:
    try:
        await message.delete()
    except TelegramBadRequest:
        pass
