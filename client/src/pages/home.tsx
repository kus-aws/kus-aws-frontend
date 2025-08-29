import { Header } from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MajorCategories from "@/components/MajorCategories";
import HowToUseSection from "@/components/HowToUseSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <MajorCategories />
      <HowToUseSection />
      <Footer />
    </div>
  );
}
