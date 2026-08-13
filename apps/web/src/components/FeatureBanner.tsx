import { useModals } from "../lib/modals";

export function FeatureBanner() {
  const { openBooking } = useModals();
  return (
    <section className="section">
      <div className="container">
        <div className="feature">
          <div>
            <p className="eyebrow">Ваш запрос — в центре</p>
            <h2>Бережная работа с опорой на реальность</h2>
            <p className="lead" style={{ marginTop: "1rem" }}>
              Разбираем ситуации без обесценивания и давления: шаг за шагом —
              к более ясной картине себя и отношений.
            </p>
            <ul className="check-list">
              <li>Лицензированный опыт и супервизия</li>
              <li>Понятный маршрут: запрос → сессии → результат</li>
              <li>Оплата и запись — на сайте и в Telegram</li>
            </ul>
            <div className="btn-row" style={{ marginTop: "1.5rem" }}>
              <button className="btn btn--primary" type="button" onClick={openBooking}>
                Записаться
              </button>
            </div>
          </div>
          <div className="feature__media">
            <img
              src="/images/page12_X1_4096x3072.jpg"
              alt="Пространство для терапевтической работы"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
