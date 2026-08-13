export type EventItem = {
  id: string;
  title: string;
  description: string;
  dateIso: string;
  priceRub: number;
  seatsTotal: number;
  seatsTaken: number;
  status: "upcoming" | "past";
};

export const SERVICES = [
  {
    id: "personal",
    title: "Личная консультация",
    description:
      "Индивидуальная онлайн или офлайн-сессия. Разбираем ваш запрос грамотно и бережно.",
    priceRub: 5000,
    image: "/images/service-personal.png",
  },
  {
    id: "group",
    title: "Групповая терапия",
    description:
      "Закрытые группы и тематические встречи. Запись и оплата через Telegram-бота.",
    priceRub: 3500,
    image: "/images/service-support.png",
  },
  {
    id: "supervision",
    title: "Супервизия",
    description:
      "Супервизия для специалистов: поддержка практики и профессиональный взгляд со стороны.",
    priceRub: 6000,
    image: "/images/service-supervision.png",
  },
  {
    id: "course",
    title: "Видео-курсы",
    description:
      "Готовые материалы для самостоятельной работы в удобном темпе.",
    priceRub: 7900,
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
};

export const ABOUT = `Татьяна — психолог, психотерапевт и супервизор с многолетним опытом. Для неё важно приводить клиентов в состояние здоровой психики и объективной оценки реальной картины мира через личное осознание.

Миссия — помогать людям, которые сами хотят помочь себе в развитии и в разрешении личных вопросов.`;

export async function fetchEvents(
  status?: "upcoming" | "past"
): Promise<EventItem[]> {
  try {
    const q = status ? `?status=${status}` : "";
    const res = await fetch(`/api/events${q}`);
    if (!res.ok) throw new Error("fail");
    return (await res.json()) as EventItem[];
  } catch {
    return [];
  }
}

export async function createLead(input: {
  name: string;
  phone: string;
  comment?: string;
  serviceId?: string;
}): Promise<{ id: string } | null> {
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, source: "web" }),
    });
    if (!res.ok) throw new Error("fail");
    return (await res.json()) as { id: string };
  } catch {
    return null;
  }
}
