import { useEffect, useState, type FormEvent } from "react";
import { SERVICES, createLead } from "../lib/content";
import { useModals } from "../lib/modals";
import { Modal } from "./Modal";

export function LeadModal() {
  const { open, serviceId, close } = useModals();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [chosen, setChosen] = useState(serviceId);

  useEffect(() => {
    if (open === "lead") {
      setChosen(serviceId);
      setSent(false);
      setMessage("");
      setLoading(false);
    }
  }, [open, serviceId]);

  if (open !== "lead") return null;

  const service = SERVICES.find((s) => s.id === chosen);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLoading(true);
    setMessage("");
    const result = await createLead({
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      comment: String(data.get("comment") ?? ""),
      serviceId: chosen,
    });
    setLoading(false);
    if (!result) {
      setMessage("Не удалось отправить заявку. Напишите в Telegram.");
      return;
    }
    setSent(true);
  }

  return (
    <Modal title="Оставить заявку" onClose={close}>
      {sent ? (
        <p className="modal__note">
          Заявка принята. Свяжемся и подскажем способ оплаты.
        </p>
      ) : (
        <form className="cta__form" style={{ marginTop: 0 }} onSubmit={onSubmit}>
          <p className="modal__note">
            {service
              ? `Формат: ${service.title}`
              : "Оставьте контакты — перезвоним."}
          </p>
          <label className="sr-only" htmlFor="lead-service">
            Услуга
          </label>
          <select
            id="lead-service"
            value={chosen}
            onChange={(e) => setChosen(e.target.value)}
          >
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <input name="name" required placeholder="Ваше имя *" aria-label="Имя" />
          <input name="phone" required placeholder="Телефон *" aria-label="Телефон" />
          <input
            name="comment"
            placeholder="Комментарий (необязательно)"
            aria-label="Комментарий"
          />
          <label className="consent">
            <input className="consent__input" type="checkbox" required />
            <span className="consent__box" aria-hidden />
            <span className="consent__text">
              Даю согласие на обработку персональных данных
            </span>
          </label>
          <button className="btn btn--dark" type="submit" disabled={loading}>
            {loading ? "Отправляем…" : "Отправить заявку"}
          </button>
          {message ? <p className="modal__note">{message}</p> : null}
        </form>
      )}
    </Modal>
  );
}
