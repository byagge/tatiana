import type { DikidiClient, DikidiSlot } from "./types.js";

export const DIKIDI_DEFAULT_COMPANY_ID = "116141";

export function dikidiProfileUrl(companyId: string): string {
  return `https://dikidi.net/${companyId}`;
}

export function dikidiWidgetUrl(companyId: string): string {
  return `https://dikidi.net/${encodeURIComponent(companyId)}`;
}

export class StubDikidiClient implements DikidiClient {
  readonly name = "stub";

  constructor(private readonly bookingUrl: string) {}

  getBookingUrl(): string {
    return this.bookingUrl || dikidiProfileUrl(DIKIDI_DEFAULT_COMPANY_ID);
  }

  async listSlots(fromIso: string, toIso: string): Promise<DikidiSlot[]> {
    console.info("[dikidi:stub] listSlots", { fromIso, toIso });
    return [];
  }
}

/**
 * Live DIKIDI: публичная запись через виджет/профиль компании.
 * REST-документация api.dikidi.net сейчас не опубликована — слоты
 * читаем best-effort, запись клиента идёт через виджет.
 */
export class LiveDikidiClient implements DikidiClient {
  readonly name = "live";

  constructor(
    private readonly apiUrl: string,
    private readonly token: string,
    private readonly companyId: string,
    private readonly bookingUrl: string
  ) {
    if (!token || !companyId) {
      throw new Error("DIKIDI credentials are required for live mode");
    }
  }

  getBookingUrl(): string {
    return (
      this.bookingUrl ||
      dikidiProfileUrl(this.companyId || DIKIDI_DEFAULT_COMPANY_ID)
    );
  }

  async listSlots(fromIso: string, toIso: string): Promise<DikidiSlot[]> {
    const bases = [
      this.apiUrl.replace(/\/$/, ""),
      "https://api.dikidi.ru",
      "https://api.dikidi.net",
    ];
    const paths = [
      `/v1/companies/${this.companyId}/slots`,
      `/v2/companies/${this.companyId}/slots`,
      `/company/${this.companyId}/slots`,
    ];

    for (const base of bases) {
      for (const path of paths) {
        try {
          const url = new URL(path, base + "/");
          url.searchParams.set("from", fromIso);
          url.searchParams.set("to", toIso);
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${this.token}`,
              "X-Api-Key": this.token,
              Accept: "application/json",
            },
          });
          if (!res.ok) continue;
          const data = (await res.json()) as {
            slots?: Array<{
              id: string;
              start?: string;
              end?: string;
              startIso?: string;
              endIso?: string;
              specialist?: string;
            }>;
          };
          if (Array.isArray(data.slots)) {
            return data.slots.map((s) => ({
              id: s.id,
              startIso: s.startIso ?? s.start ?? fromIso,
              endIso: s.endIso ?? s.end ?? toIso,
              specialistName: s.specialist ?? "Татьяна Канунникова",
            }));
          }
        } catch {
          /* try next */
        }
      }
    }
    return [];
  }
}

export function createDikidiClient(env: {
  DIKIDI_PROVIDER?: string;
  DIKIDI_API_URL?: string;
  DIKIDI_TOKEN?: string;
  DIKIDI_COMPANY_ID?: string;
  DIKIDI_BOOKING_URL?: string;
}): DikidiClient {
  const companyId = env.DIKIDI_COMPANY_ID || DIKIDI_DEFAULT_COMPANY_ID;
  const bookingUrl =
    env.DIKIDI_BOOKING_URL && env.DIKIDI_BOOKING_URL !== "https://dikidi.ru/"
      ? env.DIKIDI_BOOKING_URL
      : dikidiProfileUrl(companyId);

  if (env.DIKIDI_PROVIDER === "live" && env.DIKIDI_TOKEN) {
    return new LiveDikidiClient(
      env.DIKIDI_API_URL ?? "https://api.dikidi.ru",
      env.DIKIDI_TOKEN,
      companyId,
      bookingUrl
    );
  }
  return new StubDikidiClient(bookingUrl);
}
