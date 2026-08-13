import { motion } from "framer-motion";
import { SERVICES } from "../lib/content";

export function Services() {
  return (
    <section className="section section--soft" id="services">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Услуги</p>
            <h2>Персональная поддержка для реальных запросов</h2>
          </div>
          <p>
            Индивидуальная терапия, групповые форматы, супервизия и готовые
            видео-материалы — выбирайте то, что нужно сейчас.
          </p>
        </div>

        <div className="cards">
          {SERVICES.map((s, i) => (
            <motion.article
              className="card card--service"
              key={s.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="card__banner">
                <img src={s.image} alt={s.title} />
              </div>
              <div className="card__body">
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <a className="card__link" href="#booking">
                  Подробнее →
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
