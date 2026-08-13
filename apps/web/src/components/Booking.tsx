import { useMemo, useState } from "react";
import { SERVICES } from "../lib/content";
import { useModals } from "../lib/modals";

const slides = [
  "/images/page8_X1_1001x1201.jpg",
  "/images/page10_X1_4096x3072.jpg",
  "/images/service-consultation.png",
];

export function Booking() {
  const [index, setIndex] = useState(0);
  const [serviceId, setServiceId] = useState<string>(SERVICES[0].id);
  const { openLead, openBooking } = useModals();

  const service = useMemo(
    () => SERVICES.find((s) => s.id === serviceId) ?? SERVICES[0],
    [serviceId]
  );

  const isDikidi = service.id === "personal" || service.id === "supervision";

  return (
    <section className="section" id="booking">
      <div className="container product">
        <div>
          <div className="carousel">
            <img src={slides[index]} alt={`Фото услуги: ${service.title}`} />
            <div className="carousel__nav">
              <button
                type="button"
                aria-label="Предыдущее фото"
                onClick={() =>
                  setIndex((i) => (i - 1 + slides.length) % slides.length)
                }
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Следующее фото"
                onClick={() => setIndex((i) => (i + 1) % slides.length)}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <div>
          <p className="eyebrow">Запись и заявка</p>
          <h2>Выберите формат работы</h2>
          <p className="lead" style={{ marginTop: "0.85rem" }}>
            Индивидуальные сессии — запись в DIKIDI в окне на сайте. Группы и
            курсы — заявкой: перезвоним и подскажем, как оплатить.
          </p>

          <div className="btn-row" style={{ margin: "1.25rem 0" }}>
            {SERVICES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`btn ${serviceId === s.id ? "btn--primary" : "btn--ghost"}`}
                onClick={() => setServiceId(s.id)}
              >
                {s.title}
              </button>
            ))}
          </div>

          <h3>{service.title}</h3>
          <p className="lead">{service.description}</p>
          <div className="price">
            {service.priceRub.toLocaleString("ru-RU")} ₽
          </div>

          <div className="btn-row">
            {isDikidi ? (
              <button
                className="btn btn--primary"
                type="button"
                onClick={openBooking}
              >
                Записаться
              </button>
            ) : (
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => openLead(service.id)}
              >
                Оставить заявку
              </button>
            )}
            {isDikidi ? (
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => openLead(service.id)}
              >
                Оставить заявку
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
