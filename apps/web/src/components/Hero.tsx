import { motion } from "framer-motion";
import { CONTACT } from "../lib/content";
import { useModals } from "../lib/modals";

export function Hero() {
  const { openBooking } = useModals();
  return (
    <section className="hero" id="top">
      <div className="container hero__grid">
        <motion.div
          className="hero__copy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="eyebrow">Эффективная психотерапия</p>
          <h1>Разбираем твой запрос грамотно и бережно</h1>
          <p className="lead">
            Консультация психолога для вашей продуктивности и внутренней опоры —
            онлайн и офлайн в Екатеринбурге.
          </p>
          <div className="btn-row">
            <button className="btn btn--primary" type="button" onClick={openBooking}>
              Записаться на сессию
            </button>
            <a className="btn btn--ghost" href={CONTACT.telegram} target="_blank" rel="noreferrer">
              Telegram-канал
            </a>
          </div>
          <div className="trust-avatars">
            <div className="trust-avatars__stack" aria-hidden>
              <span style={{ background: "#8a7f74" }} />
              <span style={{ background: "#b9aea3" }} />
              <span style={{ background: "#d9d0c7" }} />
            </div>
            <p>Индивидуальная работа, группы и супервизия</p>
          </div>
        </motion.div>

        <motion.div
          className="hero__media"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <div className="hero__photo">
            <img
              src="/images/page8_X1_1001x1201.jpg"
              alt="Татьяна Канунникова — психотерапевт"
            />
          </div>
          <div className="hero__badge">
            Исцеление приходит через осознание — когда ты готов
          </div>
        </motion.div>
      </div>
    </section>
  );
}
