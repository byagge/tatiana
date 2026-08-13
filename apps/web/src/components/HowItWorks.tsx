const steps = [
  {
    num: "01",
    title: "Определите формат",
    text: "Индивидуальная сессия, группа или готовый курс — под ваш запрос и темп.",
  },
  {
    num: "02",
    title: "Запишитесь",
    text: "Личные встречи — через DIKIDI. Группы и мероприятия — через Telegram-бота.",
  },
  {
    num: "03",
    title: "Начните работу",
    text: "Онлайн или офлайн в Екатеринбурге. Оплата доступна на сайте и в боте.",
  },
];

export function HowItWorks() {
  return (
    <section className="section section--soft" id="how">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Как это работает</p>
            <h2>Простой путь к первой сессии</h2>
          </div>
        </div>
        <div className="steps">
          {steps.map((s) => (
            <article className="step" key={s.num}>
              <div className="step__num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
