export type EventStatus = "upcoming" | "past";
export type BookingStatus = "pending" | "paid" | "cancelled" | "confirmed";
export type PaymentStatus = "pending" | "succeeded" | "canceled";
export type LeadStatus = "new" | "in_progress" | "done" | "cancelled";
export type LeadSource = "web" | "bot";

export interface ServiceProduct {
  id: string;
  title: string;
  description: string;
  priceRub: number;
  kind: "individual" | "group" | "course" | "supervision";
  image?: string;
}

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  dateIso: string;
  priceRub: number;
  seatsTotal: number;
  seatsTaken: number;
  status: EventStatus;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRecord {
  id: string;
  eventId: string;
  tgUserId: number;
  tgUsername: string | null;
  name: string;
  phone: string;
  status: BookingStatus;
  paymentId: string | null;
  createdAt: string;
}

export interface LeadRecord {
  id: string;
  source: LeadSource;
  serviceId: string | null;
  eventId: string | null;
  name: string;
  phone: string;
  comment: string | null;
  status: LeadStatus;
  tgUserId: number | null;
  tgUsername: string | null;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  provider: string;
  amountRub: number;
  description: string;
  status: PaymentStatus;
  externalId: string | null;
  confirmationUrl: string | null;
  metaJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  amountRub: number;
  description: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentResult {
  id: string;
  confirmationUrl: string;
  status: PaymentStatus;
  externalId?: string;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPaymentStatus(externalId: string): Promise<PaymentStatus>;
}

export interface DikidiSlot {
  id: string;
  startIso: string;
  endIso: string;
  specialistName: string;
}

export interface DikidiClient {
  readonly name: string;
  getBookingUrl(): string;
  listSlots(fromIso: string, toIso: string): Promise<DikidiSlot[]>;
}
