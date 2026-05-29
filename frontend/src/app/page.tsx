import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { CollectionShowcase } from "@/components/home/CollectionShowcase";
import { BestSeller } from "@/components/home/BestSeller";
import { VoucherList } from "@/components/home/VoucherList";
import { InstagramGallery } from "@/components/home/InstagramGallery";
import { StoreInfo } from "@/components/home/StoreInfo";
import { Testimonials } from "@/components/home/Testimonials";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans pt-24">
      <Navbar />
      <main className="flex-1">
        <HeroBanner />
        <FeaturedCarousel />
        <CollectionShowcase />
        <BestSeller />
        <VoucherList />
        {/* <InstagramGallery /> */}
        <StoreInfo />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}

