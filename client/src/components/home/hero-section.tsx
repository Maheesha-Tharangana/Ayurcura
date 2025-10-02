import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <div className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 bg-white lg:w-full">
          <div className="relative px-4 sm:px-6 lg:px-8">
            <div className="pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-28 text-center lg:text-left flex flex-col lg:flex-row items-center">
              <div className="lg:w-1/2">
                <h1 className="text-4xl tracking-tight font-bold text-neutral-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-heading">
                  <span className="block">Ancient Wisdom for</span>
                  <span className="block text-primary-500">Modern Wellness</span>
                </h1>
                <p className="mt-3 text-base text-neutral-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Connect with qualified Ayurvedic practitioners, discover natural treatments, and embark on your journey to holistic health with AyurCura.
                </p>
                <div className="mt-8 sm:mt-10 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link href="/doctors">
                      <Button size="lg" className="w-full px-8 py-3 text-base md:py-4 md:text-lg md:px-10">
                        Find a Doctor
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link href="/treatments">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="w-full px-8 py-3 text-base md:py-4 md:text-lg md:px-10 bg-primary-100 text-primary-600 hover:bg-primary-200 border-transparent"
                      >
                        Explore Treatments
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 mt-10 lg:mt-0 lg:pl-10">
                <img 
                  className="h-96 w-full object-cover rounded-lg shadow-xl"
                  src="https://ayurveda.gov.lk/wp-content/uploads/2023/07/trditional-medicine-1.jpg" 
                  alt="Ayurvedic herbs and treatments" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
