import HomeHero from '@/components/HomeHero';
import ReviewCarousel from "@/components/ReviewCarousel";
import BrandsSection from '@/components/BrandsSection'; // Import BrandsSection

const HomePage = () => {
  return (
    <div>
        <HomeHero />
        <ReviewCarousel />
        <BrandsSection /> 
    </div>
  );
};

export default HomePage;
