import { CONTACT } from "../lib/content";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="brand" style={{ marginBottom: "1rem" }}>
              <img src="/logos/sign-white.png" alt="" width={42} height={42} />
              <span className="brand__text">
                <span className="brand__name">{CONTACT.name}</span>
                <span className="brand__tag">{CONTACT.tagline}</span>
              </span>
            </div>
            <p className="lead">
              Психотерапия, супервизия и групповые форматы — бережно и по делу.
            </p>
          </div>

          <div>
            <h3>Навигация</h3>
            <ul>
              <li><a href="#about">Обо мне</a></li>
              <li><a href="#services">Услуги</a></li>
              <li><a href="#booking">Запись</a></li>
              <li><a href="#events">Мероприятия</a></li>
            </ul>
          </div>

          <div>
            <h3>Контакты</h3>
            <ul>
              <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
              <li><a href={CONTACT.phoneHref}>{CONTACT.phone}</a></li>
              <li>{CONTACT.address}</li>
              <li><a href={CONTACT.telegram}>Telegram</a></li>
            </ul>
          </div>

          <div>
            <h3>Галерея</h3>
            <div className="gallery">
              <img src="/images/page8_X1_1001x1201.jpg" alt="Татьяна Канунникова" />
              <img src="/images/service-personal.png" alt="Личная консультация" />
              <img src="/images/service-support.png" alt="Поддержка" />
              <img src="/images/service-supervision.png" alt="Супервизия" />
              <img src="/images/service-family.png" alt="Семейная работа" />
              <img src="/images/service-workshop.png" alt="Мастерская" />
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} {CONTACT.name}. Все права защищены.</span>
          <span>Екатеринбург</span>
        </div>
      </div>
    </footer>
  );
}
