import ReviewCarousel from "@/components/ReviewCarousel";

const HomePage = () => {
  return (
    <div>
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">Welcome to Allbikes</h1>
            <p>This is the home page.</p>
        </div>
        <ReviewCarousel />
    </div>
  );
};

export default HomePage;
