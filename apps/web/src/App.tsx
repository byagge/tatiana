import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { UspBar } from "./components/UspBar";
import { Services } from "./components/Services";
import { About } from "./components/About";
import { FeatureBanner } from "./components/FeatureBanner";
import { HowItWorks } from "./components/HowItWorks";
import { Booking } from "./components/Booking";
import { Events } from "./components/Events";
import { CtaContacts } from "./components/CtaContacts";
import { Footer } from "./components/Footer";
import { LeadModal } from "./components/LeadModal";
import { BookingModal } from "./components/BookingModal";
import { ModalProvider } from "./lib/modals";

export default function App() {
  return (
    <ModalProvider>
      <Header />
      <main>
        <Hero />
        <UspBar />
        <Services />
        <About />
        <FeatureBanner />
        <HowItWorks />
        <Booking />
        <Events />
        <CtaContacts />
      </main>
      <Footer />
      <LeadModal />
      <BookingModal />
    </ModalProvider>
  );
}
