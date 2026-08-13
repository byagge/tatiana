export const SERVICES = [
  {
    id: "personal",
    title: "Личная консультация",
    description:
      "Индивидуальная онлайн или офлайн-сессия. Разбираем ваш запрос грамотно и бережно.",
    priceRub: 5000,
    kind: "individual" as const,
    image: "/images/service-personal.png",
  },
  {
    id: "group",
    title: "Групповая терапия",
    description:
      "Закрытые группы и тематические встречи. Запись и оплата через Telegram-бота.",
    priceRub: 3500,
    kind: "group" as const,
    image: "/images/service-support.png",
  },
  {
    id: "supervision",
    title: "Супервизия",
    description:
      "Супервизия для специалистов: поддержка практики и профессиональный взгляд со стороны.",
    priceRub: 6000,
    kind: "supervision" as const,
    image: "/images/service-supervision.png",
  },
  {
    id: "course",
    title: "Видео-курсы",
    description:
      "Готовые материалы для самостоятельной работы в удобном темпе.",
    priceRub: 7900,
    kind: "course" as const,
    image: "/images/service-workshop.png",
  },
] as const;

export const CONTACT = {
  name: "Татьяна Канунникова",
  role: "Психотерапевт | супервизор",
  tagline: "Эффективная психотерапия",
  email: "stvekb@gmail.com",
  phone: "+7 927 086-77-71",
  phoneHref: "tel:+79270867771",
  address: "Екатеринбург, ул. Белинского, 34",
  telegram: "https://t.me/Tatiayna_Kann",
  telegramBot: "", // filled from env on site
};

export const ABOUT_TEXT = `Татьяна — успешный психолог, психотерапевт и супервизор с многолетним опытом. Для неё важно приводить клиентов в состояние здоровой психики и объективной оценки реальной картины мира через личное осознание самих клиентов.

Вместе мы стремимся создать пространство, где можно безопасно разбирать личные и профессиональные запросы — в индивидуальной и групповой работе.`;
