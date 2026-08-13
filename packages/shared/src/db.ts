import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
  BookingRecord,
  BookingStatus,
  EventRecord,
  EventStatus,
  LeadRecord,
  LeadStatus,
  PaymentRecord,
  PaymentStatus,
} from "./types.js";

interface DbShape {
  events: EventRecord[];
  bookings: BookingRecord[];
  payments: PaymentRecord[];
  leads: LeadRecord[];
}

function emptyDb(): DbShape {
  return { events: [], bookings: [], payments: [], leads: [] };
}

export class JsonDatabase {
  private data: DbShape;

  constructor(private readonly filePath: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (fs.existsSync(filePath)) {
      this.data = JSON.parse(fs.readFileSync(filePath, "utf8")) as DbShape;
      this.data.events ??= [];
      this.data.bookings ??= [];
      this.data.payments ??= [];
      this.data.leads ??= [];
    } else {
      this.data = emptyDb();
      this.persist();
    }
  }

  private persist(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf8");
  }

  get snapshot(): DbShape {
    return this.data;
  }

  write(mutator: (db: DbShape) => void): void {
    mutator(this.data);
    this.persist();
  }
}

/** @deprecated name kept for openDatabase(path) API compatibility */
export function openDatabase(dbPath: string): JsonDatabase {
  const normalized = dbPath.endsWith(".db")
    ? dbPath.replace(/\.db$/i, ".json")
    : dbPath.endsWith(".json")
      ? dbPath
      : `${dbPath}.json`;
  return new JsonDatabase(normalized);
}

export class Store {
  constructor(private readonly db: JsonDatabase) {}

  listEvents(status?: EventStatus): EventRecord[] {
    const list = this.db.snapshot.events;
    const filtered = status ? list.filter((e) => e.status === status) : list;
    return [...filtered].sort((a, b) => a.dateIso.localeCompare(b.dateIso));
  }

  getEvent(id: string): EventRecord | null {
    return this.db.snapshot.events.find((e) => e.id === id) ?? null;
  }

  createEvent(input: {
    title: string;
    description: string;
    dateIso: string;
    priceRub: number;
    seatsTotal: number;
    status?: EventStatus;
    imageUrl?: string | null;
  }): EventRecord {
    const now = new Date().toISOString();
    const event: EventRecord = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      dateIso: input.dateIso,
      priceRub: input.priceRub,
      seatsTotal: input.seatsTotal,
      seatsTaken: 0,
      status: input.status ?? "upcoming",
      imageUrl: input.imageUrl ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.db.write((db) => {
      db.events.push(event);
    });
    return event;
  }

  updateEvent(
    id: string,
    patch: Partial<{
      title: string;
      description: string;
      dateIso: string;
      priceRub: number;
      seatsTotal: number;
      status: EventStatus;
      imageUrl: string | null;
    }>
  ): EventRecord | null {
    let updated: EventRecord | null = null;
    this.db.write((db) => {
      const idx = db.events.findIndex((e) => e.id === id);
      if (idx < 0) return;
      const current = db.events[idx];
      updated = {
        ...current,
        title: patch.title ?? current.title,
        description: patch.description ?? current.description,
        dateIso: patch.dateIso ?? current.dateIso,
        priceRub: patch.priceRub ?? current.priceRub,
        seatsTotal: patch.seatsTotal ?? current.seatsTotal,
        status: patch.status ?? current.status,
        imageUrl:
          patch.imageUrl !== undefined ? patch.imageUrl : current.imageUrl,
        updatedAt: new Date().toISOString(),
      };
      db.events[idx] = updated;
    });
    return updated;
  }

  deleteEvent(id: string): boolean {
    let changed = false;
    this.db.write((db) => {
      const before = db.events.length;
      db.events = db.events.filter((e) => e.id !== id);
      db.bookings = db.bookings.filter((b) => b.eventId !== id);
      changed = db.events.length !== before;
    });
    return changed;
  }

  listBookings(eventId?: string): BookingRecord[] {
    const list = this.db.snapshot.bookings;
    const filtered = eventId ? list.filter((b) => b.eventId === eventId) : list;
    return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getBooking(id: string): BookingRecord | null {
    return this.db.snapshot.bookings.find((b) => b.id === id) ?? null;
  }

  createBooking(input: {
    eventId: string;
    tgUserId: number;
    tgUsername?: string | null;
    name: string;
    phone: string;
    paymentId?: string | null;
  }): BookingRecord {
    const event = this.getEvent(input.eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    if (event.status !== "upcoming") throw new Error("EVENT_NOT_OPEN");
    if (event.seatsTaken >= event.seatsTotal) throw new Error("NO_SEATS");

    const booking: BookingRecord = {
      id: randomUUID(),
      eventId: input.eventId,
      tgUserId: input.tgUserId,
      tgUsername: input.tgUsername ?? null,
      name: input.name,
      phone: input.phone,
      status: "pending",
      paymentId: input.paymentId ?? null,
      createdAt: new Date().toISOString(),
    };

    this.db.write((db) => {
      const ev = db.events.find((e) => e.id === input.eventId);
      if (!ev) throw new Error("EVENT_NOT_FOUND");
      if (ev.seatsTaken >= ev.seatsTotal) throw new Error("NO_SEATS");
      ev.seatsTaken += 1;
      ev.updatedAt = new Date().toISOString();
      db.bookings.push(booking);
    });

    return booking;
  }

  updateBookingStatus(id: string, status: BookingStatus): BookingRecord | null {
    let updated: BookingRecord | null = null;
    this.db.write((db) => {
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) return;
      const prev = booking.status;
      if (prev === status) {
        updated = booking;
        return;
      }
      booking.status = status;
      if (status === "cancelled" && prev !== "cancelled") {
        const ev = db.events.find((e) => e.id === booking.eventId);
        if (ev) {
          ev.seatsTaken = Math.max(ev.seatsTaken - 1, 0);
          ev.updatedAt = new Date().toISOString();
        }
      }
      updated = booking;
    });
    return updated;
  }

  createPaymentRecord(input: {
    provider: string;
    amountRub: number;
    description: string;
    status?: PaymentStatus;
    externalId?: string | null;
    confirmationUrl?: string | null;
    meta?: Record<string, unknown>;
  }): PaymentRecord {
    const now = new Date().toISOString();
    const payment: PaymentRecord = {
      id: randomUUID(),
      provider: input.provider,
      amountRub: input.amountRub,
      description: input.description,
      status: input.status ?? "pending",
      externalId: input.externalId ?? null,
      confirmationUrl: input.confirmationUrl ?? null,
      metaJson: JSON.stringify(input.meta ?? {}),
      createdAt: now,
      updatedAt: now,
    };
    this.db.write((db) => {
      db.payments.push(payment);
    });
    return payment;
  }

  getPayment(id: string): PaymentRecord | null {
    return this.db.snapshot.payments.find((p) => p.id === id) ?? null;
  }

  getPaymentByExternalId(externalId: string): PaymentRecord | null {
    return (
      this.db.snapshot.payments.find((p) => p.externalId === externalId) ?? null
    );
  }

  updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    extra?: { confirmationUrl?: string; externalId?: string }
  ): PaymentRecord | null {
    let updated: PaymentRecord | null = null;
    this.db.write((db) => {
      const payment = db.payments.find((p) => p.id === id);
      if (!payment) return;
      payment.status = status;
      if (extra?.confirmationUrl) payment.confirmationUrl = extra.confirmationUrl;
      if (extra?.externalId) payment.externalId = extra.externalId;
      payment.updatedAt = new Date().toISOString();
      updated = payment;
    });
    return updated;
  }

  countEvents(): number {
    return this.db.snapshot.events.length;
  }

  listLeads(): LeadRecord[] {
    return [...this.db.snapshot.leads].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  getLead(id: string): LeadRecord | null {
    return this.db.snapshot.leads.find((l) => l.id === id) ?? null;
  }

  createLead(input: {
    source: LeadRecord["source"];
    name: string;
    phone: string;
    comment?: string | null;
    serviceId?: string | null;
    eventId?: string | null;
    tgUserId?: number | null;
    tgUsername?: string | null;
  }): LeadRecord {
    const lead: LeadRecord = {
      id: randomUUID(),
      source: input.source,
      serviceId: input.serviceId ?? null,
      eventId: input.eventId ?? null,
      name: input.name.trim(),
      phone: input.phone.trim(),
      comment: input.comment?.trim() || null,
      status: "new",
      tgUserId: input.tgUserId ?? null,
      tgUsername: input.tgUsername ?? null,
      createdAt: new Date().toISOString(),
    };
    this.db.write((db) => {
      db.leads.push(lead);
    });
    return lead;
  }

  updateLeadStatus(id: string, status: LeadStatus): LeadRecord | null {
    let updated: LeadRecord | null = null;
    this.db.write((db) => {
      const lead = db.leads.find((l) => l.id === id);
      if (!lead) return;
      lead.status = status;
      updated = lead;
    });
    return updated;
  }
}
