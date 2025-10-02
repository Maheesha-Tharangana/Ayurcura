import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/home/hero-section";
import FeatureSection from "@/components/home/feature-section";
import DoctorSection from "@/components/home/doctor-section";
import TreatmentSection from "@/components/home/treatment-section";
import ArticleSection from "@/components/home/article-section";
import SymptomSection from "@/components/home/symptom-section";
import TestimonialSection from "@/components/home/testimonial-section";
import CtaSection from "@/components/home/cta-section";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <FeatureSection />
        <DoctorSection />
        <TreatmentSection />
        <ArticleSection />
        <SymptomSection />
        <TestimonialSection />
        {!user && <CtaSection />}
      </main>
      <Footer />
    </div>
  );
}
