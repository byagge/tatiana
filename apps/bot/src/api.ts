import express from "express";
import cors from "cors";
import type { Store, PaymentProvider } from "@tatiana/shared";
import { SERVICES, CONTACT } from "@tatiana/shared";
import { env } from "./config.js";

async function notifyAdmins(text: string): Promise<void> {
  if (!env.botToken || env.botToken.includes("REPLACE")) return;
  await Promise.all(
    env.adminIds.map(async (chatId) => {
      try {
        await fetch(`https://api.telegram.org/bot${env.botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
          }),
        });
      } catch (e) {
        console.warn("notify admin failed", chatId, e);
      }
    })
  );
}

export function createApi(
  store: Store,
  payments: PaymentProvider
): express.Express {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      payment: env.paymentProvider,
      dikidi: env.dikidiProvider,
      companyId: env.dikidiCompanyId,
    });
  });

  app.get("/api/content", (_req, res) => {
    res.json({
      contact: {
        ...CONTACT,
        telegramBot: env.botUsername ? `https://t.me/${env.botUsername}` : "",
      },
      services: SERVICES,
      dikidiBookingUrl: env.dikidiBookingUrl,
      webUrl: env.webUrl,
    });
  });

  app.get("/api/events", (req, res) => {
    const status = req.query.status;
    if (status === "upcoming" || status === "past") {
      res.json(store.listEvents(status));
      return;
    }
    res.json(store.listEvents());
  });

  app.get("/api/events/:id", (req, res) => {
    const event = store.getEvent(req.params.id);
    if (!event) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.json(event);
  });

  app.post("/api/bookings", (req, res) => {
    const { eventId, name, phone, tgUserId, tgUsername } = req.body ?? {};
    if (!eventId || !name || !phone) {
      res.status(400).json({ error: "MISSING_FIELDS" });
      return;
    }
    try {
      const booking = store.createBooking({
        eventId,
        name: String(name),
        phone: String(phone),
        tgUserId: Number(tgUserId) || 0,
        tgUsername: tgUsername ? String(tgUsername) : null,
      });
      void notifyAdmins(
        `🔔 Новая бронь группы\n${booking.name} · ${booking.phone}\nid: ${booking.id}`
      );
      res.status(201).json(booking);
    } catch (e) {
      const code = String(e);
      const status = code.includes("NO_SEATS")
        ? 409
        : code.includes("EVENT_NOT_FOUND")
          ? 404
          : 400;
      res.status(status).json({ error: code });
    }
  });

  app.post("/api/leads", (req, res) => {
    const { name, phone, comment, serviceId, eventId, source } = req.body ?? {};
    if (!name || !phone) {
      res.status(400).json({ error: "MISSING_FIELDS" });
      return;
    }
    const lead = store.createLead({
      source: source === "bot" ? "bot" : "web",
      name: String(name),
      phone: String(phone),
      comment: comment ? String(comment) : null,
      serviceId: serviceId ? String(serviceId) : null,
      eventId: eventId ? String(eventId) : null,
    });
    const service = SERVICES.find((s) => s.id === lead.serviceId);
    void notifyAdmins(
      [
        `📩 <b>Новая заявка</b>`,
        service ? `Услуга: ${service.title}` : "Форма на сайте",
        `${lead.name} · ${lead.phone}`,
        lead.comment ? `Комментарий: ${lead.comment}` : "",
        `id: ${lead.id.slice(0, 8)}`,
      ]
        .filter(Boolean)
        .join("\n")
    );
    res.status(201).json({ id: lead.id, status: lead.status });
  });

  app.get("/api/leads", (_req, res) => {
    res.json(store.listLeads());
  });

  app.post("/api/payments/create", async (req, res) => {
    const { amountRub, description, serviceId, eventId } = req.body ?? {};
    if (!amountRub || !description) {
      res.status(400).json({ error: "MISSING_FIELDS" });
      return;
    }
    if (env.paymentProvider === "leads" || payments.name === "stub") {
      res.status(409).json({
        error: "PAYMENTS_DISABLED",
        message: "Оплата временно через заявку",
      });
      return;
    }
    try {
      const created = await payments.createPayment({
        amountRub: Number(amountRub),
        description: String(description),
        returnUrl: env.yookassaReturnUrl,
        metadata: {
          ...(serviceId ? { serviceId: String(serviceId) } : {}),
          ...(eventId ? { eventId: String(eventId) } : {}),
        },
      });
      const rec = store.createPaymentRecord({
        provider: payments.name,
        amountRub: Number(amountRub),
        description: String(description),
        status: created.status,
        externalId: created.externalId ?? created.id,
        confirmationUrl: created.confirmationUrl,
        meta: { serviceId, eventId },
      });
      res.status(201).json({
        paymentId: rec.id,
        confirmationUrl: created.confirmationUrl,
        provider: payments.name,
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/payments/yookassa/webhook", (req, res) => {
    const event = req.body?.event as string | undefined;
    const object = req.body?.object as
      | { id?: string; status?: string }
      | undefined;
    console.info("[yookassa:webhook]", event, object?.id, object?.status);
    if (object?.id) {
      const payment = store.getPaymentByExternalId(object.id);
      if (payment && object.status) {
        const status =
          object.status === "succeeded"
            ? "succeeded"
            : object.status === "canceled"
              ? "canceled"
              : "pending";
        store.updatePaymentStatus(payment.id, status);
      }
    }
    res.status(200).json({ ok: true });
  });

  return app;
}
