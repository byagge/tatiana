import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ModalKind = "lead" | "booking" | null;

type ModalContextValue = {
  open: ModalKind;
  serviceId: string;
  openLead: (serviceId?: string) => void;
  openBooking: () => void;
  close: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<ModalKind>(null);
  const [serviceId, setServiceId] = useState("personal");

  const openLead = useCallback((sid?: string) => {
    if (sid) setServiceId(sid);
    setOpen("lead");
  }, []);

  const openBooking = useCallback(() => setOpen("booking"), []);
  const close = useCallback(() => setOpen(null), []);

  const value = useMemo(
    () => ({ open, serviceId, openLead, openBooking, close }),
    [open, serviceId, openLead, openBooking, close]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModals() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModals must be used inside ModalProvider");
  }
  return ctx;
}
