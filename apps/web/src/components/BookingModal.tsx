import { useModals } from "../lib/modals";
import { DikidiEmbed, resolveDikidiUrl } from "./DikidiEmbed";
import { Modal } from "./Modal";

export function BookingModal() {
  const { open, close } = useModals();
  if (open !== "booking") return null;

  return (
    <Modal title="Запись в DIKIDI" onClose={close} wide>
      <DikidiEmbed />
      <p className="dikidi-embed__hint">
        Центр Психотерапии, Екатеринбург · Белинского, 34. Если окно не
        загрузилось,{" "}
        <a href={resolveDikidiUrl()} target="_blank" rel="noreferrer">
          откройте запись на dikidi.net
        </a>
        .
      </p>
    </Modal>
  );
}
