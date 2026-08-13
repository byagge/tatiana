from aiogram.fsm.state import State, StatesGroup


class Flow(StatesGroup):
    idle = State()
    lead_name = State()
    lead_phone = State()
    book_name = State()
    book_phone = State()
    admin_title = State()
    admin_desc = State()
    admin_date = State()
    admin_price = State()
    admin_seats = State()
