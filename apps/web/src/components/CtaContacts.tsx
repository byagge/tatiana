import { useState, type FormEvent } from "react";
import { CONTACT, createLead } from "../lib/content";

export function CtaContacts() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    setLoading(true);
    const result = await createLead({
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      serviceId: "contact",
    });
    setLoading(false);
    if (!result) {
      setError("Не удалось отправить. Напишите в Telegram или позвоните.");
      return;
    }
    setSent(true);
  }

  return (
    <section className="section section--soft" id="contacts">
      <div className="container cta">
        <div>
          <p className="eyebrow">Контакты</p>
          <h2>Не обязательно справляться в одиночку</h2>
          <p className="lead" style={{ marginTop: "0.85rem" }}>
            Оставьте заявку — или напишите напрямую. Отвечу и подскажу подходящий
            формат.
          </p>

          <form className="cta__form" onSubmit={onSubmit}>
            <input name="name" required placeholder="Ваше имя *" aria-label="Имя" />
            <input
              name="phone"
              required
              placeholder="Телефон *"
              aria-label="Телефон"
            />
            <label className="consent">
              <input className="consent__input" type="checkbox" required />
              <span className="consent__box" aria-hidden />
              <span className="consent__text">
                Даю согласие на обработку персональных данных
              </span>
            </label>
            <button className="btn btn--dark" type="submit" disabled={loading || sent}>
              {sent ? "Заявка принята" : loading ? "Отправляем…" : "Отправить"}
            </button>
            {sent ? (
              <p className="form-note">
                Спасибо! Для быстрой связи также напишите в{" "}
                <a href={CONTACT.telegram}>Telegram</a>.
              </p>
            ) : null}
            {error ? <p className="form-note">{error}</p> : null}
          </form>
        </div>

        <div>
          <p>
            <strong>Email</strong>
            <br />
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </p>
          <p>
            <strong>Телефон</strong>
            <br />
            <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
          </p>
          <p>
            <strong>Адрес</strong>
            <br />
            {CONTACT.address}
          </p>
          <div className="btn-row" style={{ marginTop: "1.25rem" }}>
            <a className="btn btn--dark" href={CONTACT.telegram} target="_blank" rel="noreferrer">
              Telegram
            </a>
            <a className="btn btn--ghost" style={{ borderColor: "rgba(47,44,39,.25)", color: "inherit" }} href="#booking">
              К записи
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
