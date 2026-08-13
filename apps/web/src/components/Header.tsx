import { useEffect, useState } from "react";
import { CONTACT } from "../lib/content";
import { useModals } from "../lib/modals";

const links = [
  { href: "#about", label: "Обо мне" },
  { href: "#services", label: "Услуги" },
  { href: "#booking", label: "Запись" },
  { href: "#events", label: "Мероприятия" },
  { href: "#contacts", label: "Контакты" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { openBooking } = useModals();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="header" style={{ boxShadow: scrolled ? "0 8px 30px rgba(0,0,0,.25)" : "none" }}>
      <div className="container header__inner">
        <a className="brand" href="#top" aria-label={CONTACT.name}>
          <img src="/logos/sign-white.png" alt="Логотип Татьяны Канунниковой" />
          <span className="brand__text">
            <span className="brand__name">{CONTACT.name}</span>
            <span className="brand__tag">{CONTACT.tagline}</span>
          </span>
        </a>

        <nav className={`nav ${open ? "is-open" : ""}`} aria-label="Основная навигация">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>

        <button className="btn btn--primary" type="button" onClick={openBooking}>
          Записаться
        </button>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-label="Меню"
          onClick={() => setOpen((v) => !v)}
        >
          Меню
        </button>
      </div>
    </header>
  );
}
