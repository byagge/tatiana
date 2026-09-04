import { ABOUT, CONTACT } from "../lib/content";

export function About() {
  return (
    <section className="section" id="about">
      <div className="container about">
        <div className="about__photo">
          <img
            src="/images/tatiana-portrait.png"
            alt="Портрет Татьяны Канунниковой"
          />
        </div>
        <div className="about__body">
          <p className="eyebrow">Обо мне</p>
          <h2>{CONTACT.name}</h2>
          <p className="about__role">{CONTACT.role}</p>
          {ABOUT.split("\n\n").map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <ul className="check-list">
            <li>Интегративный подход и супервизорская практика</li>
            <li>Индивидуальные сессии онлайн и в Екатеринбурге</li>
            <li>Групповые форматы с записью через Telegram-бота</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
