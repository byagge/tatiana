from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.content import CONTACT, SERVICES
from app.notify import send_lead_to_admins
from app.store import Store

store = Store(settings.database_path)


class LeadIn(BaseModel):
    name: str
    phone: str
    comment: str | None = None
    serviceId: str | None = None
    eventId: str | None = None
    source: str | None = "web"


class BookingIn(BaseModel):
    eventId: str
    name: str
    phone: str
    tgUserId: int | None = 0
    tgUsername: str | None = None


def create_api(lifespan=None) -> FastAPI:
    app = FastAPI(title="Tatiana API", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health():
        return {
            "ok": True,
            "payment": settings.payment_provider,
            "dikidi": settings.dikidi_provider,
            "companyId": settings.dikidi_company_id,
            "engine": "aiogram",
        }

    @app.get("/api/content")
    def content():
        return {
            "contact": {
                **CONTACT,
                "telegramBot": f"https://t.me/{settings.bot_username}" if settings.bot_username else "",
            },
            "services": SERVICES,
            "dikidiBookingUrl": settings.dikidi_url,
            "webUrl": settings.web_url,
        }

    @app.get("/api/events")
    def events(status: str | None = None):
        if status in {"upcoming", "past"}:
            return store.list_events(status)
        return store.list_events()

    @app.get("/api/events/{event_id}")
    def event_one(event_id: str):
        ev = store.get_event(event_id)
        if not ev:
            raise HTTPException(404, "NOT_FOUND")
        return ev

    @app.post("/api/bookings", status_code=201)
    def bookings(body: BookingIn):
        try:
            return store.create_booking(
                body.eventId,
                body.name,
                body.phone,
                body.tgUserId or 0,
                body.tgUsername,
            )
        except ValueError as e:
            code = str(e)
            status = 409 if code == "NO_SEATS" else 404 if code == "EVENT_NOT_FOUND" else 400
            raise HTTPException(status, code) from e

    @app.post("/api/leads", status_code=201)
    async def leads(body: LeadIn, request: Request):
        if not body.name or not body.phone:
            raise HTTPException(400, "MISSING_FIELDS")
        lead = store.create_lead(
            name=body.name,
            phone=body.phone,
            source="bot" if body.source == "bot" else "web",
            service_id=body.serviceId,
            event_id=body.eventId,
            comment=body.comment,
        )
        await send_lead_to_admins(getattr(request.app.state, "bot", None), lead)
        return {"id": lead["id"], "status": lead["status"]}

    @app.get("/api/leads")
    def leads_list():
        return store.list_leads()

    @app.post("/api/payments/create")
    def payments_create():
        raise HTTPException(status_code=409, detail="PAYMENTS_DISABLED")

    @app.post("/api/payments/yookassa/webhook")
    def yookassa_webhook():
        return {"ok": True}

    return app
