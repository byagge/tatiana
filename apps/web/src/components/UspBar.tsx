const items = [
  { title: "12+ лет", text: "опыта практики" },
  { title: "Онлайн / офлайн", text: "удобный формат" },
  { title: "Группы", text: "запись через бота" },
  { title: "Конфиденциально", text: "бережный процесс" },
];

export function UspBar() {
  return (
    <section className="usp" aria-label="Преимущества">
      <div className="container usp__row">
        {items.map((item) => (
          <div className="usp__item" key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
