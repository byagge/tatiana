from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Store:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        if not self.path.exists():
            self._write(
                {"events": [], "bookings": [], "payments": [], "leads": []}
            )
        data = self._read()
        data.setdefault("events", [])
        data.setdefault("bookings", [])
        data.setdefault("payments", [])
        data.setdefault("leads", [])
        self._write(data)
        if not data["events"]:
            self._seed()

    def _read(self) -> dict[str, Any]:
        return json.loads(self.path.read_text(encoding="utf-8"))

    def _write(self, data: dict[str, Any]) -> None:
        self.path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def _mutate(self, fn) -> Any:
        with self._lock:
            data = self._read()
            result = fn(data)
            self._write(data)
            return result

    def _seed(self) -> None:
        base = datetime.now(timezone.utc)
        self.create_event(
            "Группа «Треугольник власти»",
            "Однодневная группа: роли, вторичные выгоды и выход в реальную жизнь.",
            (base + timedelta(days=14)).replace(hour=12, minute=0, second=0, microsecond=0).isoformat(),
            4500,
            12,
            "upcoming",
        )
        self.create_event(
            "Вечер ресурсной группы",
            "Закрытая встреча для тех, кто уже в терапии или готов к бережной работе.",
            (base + timedelta(days=30)).replace(hour=5, minute=0, second=0, microsecond=0).isoformat(),
            3000,
            10,
            "upcoming",
        )
        self.create_event(
            "Интенсив по границам",
            "Прошедшее мероприятие: работа с личными границами.",
            (base - timedelta(days=21)).replace(hour=12, minute=0, second=0, microsecond=0).isoformat(),
            4000,
            14,
            "past",
        )

    def list_events(self, status: str | None = None) -> list[dict]:
        data = self._read()
        items = data["events"]
        if status:
            items = [e for e in items if e.get("status") == status]
        return sorted(items, key=lambda e: e.get("dateIso", ""))

    def get_event(self, event_id: str) -> dict | None:
        return next((e for e in self._read()["events"] if e["id"] == event_id), None)

    def create_event(
        self,
        title: str,
        description: str,
        date_iso: str,
        price: int,
        seats: int,
        status: str = "upcoming",
    ) -> dict:
        event = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "dateIso": date_iso,
            "priceRub": price,
            "seatsTotal": seats,
            "seatsTaken": 0,
            "status": status,
            "imageUrl": None,
            "createdAt": _now(),
            "updatedAt": _now(),
        }

        def mut(data):
            data["events"].append(event)
            return event

        return self._mutate(mut)

    def update_event(self, event_id: str, **patch) -> dict | None:
        def mut(data):
            for ev in data["events"]:
                if ev["id"] == event_id:
                    ev.update({k: v for k, v in patch.items() if v is not None})
                    ev["updatedAt"] = _now()
                    return ev
            return None

        return self._mutate(mut)

    def delete_event(self, event_id: str) -> bool:
        def mut(data):
            before = len(data["events"])
            data["events"] = [e for e in data["events"] if e["id"] != event_id]
            data["bookings"] = [b for b in data["bookings"] if b["eventId"] != event_id]
            return len(data["events"]) != before

        return bool(self._mutate(mut))

    def list_bookings(self, event_id: str | None = None) -> list[dict]:
        items = self._read()["bookings"]
        if event_id:
            items = [b for b in items if b["eventId"] == event_id]
        return sorted(items, key=lambda b: b.get("createdAt", ""), reverse=True)

    def get_booking(self, booking_id: str) -> dict | None:
        return next((b for b in self._read()["bookings"] if b["id"] == booking_id), None)

    def create_booking(
        self,
        event_id: str,
        name: str,
        phone: str,
        tg_user_id: int = 0,
        tg_username: str | None = None,
    ) -> dict:
        def mut(data):
            ev = next((e for e in data["events"] if e["id"] == event_id), None)
            if not ev:
                raise ValueError("EVENT_NOT_FOUND")
            if ev["status"] != "upcoming":
                raise ValueError("EVENT_NOT_OPEN")
            if ev["seatsTaken"] >= ev["seatsTotal"]:
                raise ValueError("NO_SEATS")
            booking = {
                "id": str(uuid.uuid4()),
                "eventId": event_id,
                "tgUserId": tg_user_id,
                "tgUsername": tg_username,
                "name": name,
                "phone": phone,
                "status": "pending",
                "paymentId": None,
                "createdAt": _now(),
            }
            ev["seatsTaken"] += 1
            ev["updatedAt"] = _now()
            data["bookings"].append(booking)
            return booking

        return self._mutate(mut)

    def update_booking_status(self, booking_id: str, status: str) -> dict | None:
        def mut(data):
            booking = next((b for b in data["bookings"] if b["id"] == booking_id), None)
            if not booking:
                return None
            prev = booking["status"]
            booking["status"] = status
            if status == "cancelled" and prev != "cancelled":
                ev = next((e for e in data["events"] if e["id"] == booking["eventId"]), None)
                if ev:
                    ev["seatsTaken"] = max(ev["seatsTaken"] - 1, 0)
            return booking

        return self._mutate(mut)

    def list_leads(self) -> list[dict]:
        return sorted(
            self._read()["leads"],
            key=lambda x: x.get("createdAt", ""),
            reverse=True,
        )

    def get_lead(self, lead_id: str) -> dict | None:
        return next((x for x in self._read()["leads"] if x["id"] == lead_id), None)

    def create_lead(
        self,
        name: str,
        phone: str,
        source: str = "web",
        service_id: str | None = None,
        event_id: str | None = None,
        comment: str | None = None,
        tg_user_id: int | None = None,
        tg_username: str | None = None,
    ) -> dict:
        lead = {
            "id": str(uuid.uuid4()),
            "source": source,
            "serviceId": service_id,
            "eventId": event_id,
            "name": name.strip(),
            "phone": phone.strip(),
            "comment": (comment or "").strip() or None,
            "status": "new",
            "tgUserId": tg_user_id,
            "tgUsername": tg_username,
            "createdAt": _now(),
        }

        def mut(data):
            data["leads"].append(lead)
            return lead

        return self._mutate(mut)

    def update_lead_status(self, lead_id: str, status: str) -> dict | None:
        def mut(data):
            lead = next((x for x in data["leads"] if x["id"] == lead_id), None)
            if not lead:
                return None
            lead["status"] = status
            return lead

        return self._mutate(mut)
