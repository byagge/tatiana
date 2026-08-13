import { useEffect, useState } from "react";
import { CONTACT, fetchEvents, type EventItem } from "../lib/content";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Events() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchEvents(tab).then((data) => {
      if (!alive) return;
      setEvents(data);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [tab]);

  return (
    <section className="section" id="events">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Мероприятия</p>
            <h2>Будущие и прошедшие встречи</h2>
          </div>
          <p>
            Групповые форматы ведутся отдельно от DIKIDI — запись и оплата через
            Telegram-бота.
          </p>
        </div>

        <div className="tabs" role="tablist" aria-label="Фильтр мероприятий">
          <button
            type="button"
            className={tab === "upcoming" ? "is-active" : ""}
            onClick={() => setTab("upcoming")}
          >
            Предстоящие
          </button>
          <button
            type="button"
            className={tab === "past" ? "is-active" : ""}
            onClick={() => setTab("past")}
          >
            Прошедшие
          </button>
        </div>

        {loading ? (
          <p className="lead">Загружаем…</p>
        ) : events.length === 0 ? (
          <p className="lead">
            Пока пусто. Запустите API (`npm run dev:bot`) или напишите в{" "}
            <a href={CONTACT.telegram}>Telegram</a>.
          </p>
        ) : (
          <div className="event-grid">
            {events.map((e) => (
              <article className="event-card" key={e.id}>
                <h3>{e.title}</h3>
                <div className="event-card__meta">
                  <span>{formatDate(e.dateIso)}</span>
                  <span>
                    {e.priceRub.toLocaleString("ru-RU")} ₽ ·{" "}
                    {e.seatsTaken}/{e.seatsTotal} мест
                  </span>
                </div>
                <p className="lead" style={{ maxWidth: "none" }}>
                  {e.description}
                </p>
                {tab === "upcoming" ? (
                  <a
                    className="btn btn--primary"
                    style={{ marginTop: "1rem" }}
                    href={CONTACT.telegram}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Записаться в боте
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
