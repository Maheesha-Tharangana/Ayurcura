import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CtaSection() {
  return (
    <section className="py-12 bg-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-neutral-900 font-heading sm:text-4xl">
                  <span className="block">Ready to experience</span>
                  <span className="block text-primary-500">Ayurvedic wellness?</span>
                </h2>
                <p className="mt-4 text-lg text-neutral-600 sm:mt-6">
                  Create an account to book appointments with qualified practitioners, access personalized health insights, and begin your journey to holistic well-being.
                </p>
                <div className="mt-8 flex gap-x-4">
                  <Link href="/auth">
                    <Button size="lg">
                      Sign up for free
                    </Button>
                  </Link>
                  <Link href="/treatments">
                    <Button size="lg" variant="outline" className="bg-primary-100 text-primary-600 hover:bg-primary-200 border-transparent">
                      Learn more
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mt-10 -mx-4 relative lg:mt-0 hidden lg:block">
                <img 
                  className="relative mx-auto rounded-lg shadow-lg" 
                  width="490" 
                  src="https://images.unsplash.com/photo-1617952986600-802f965dcdbc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Ayurvedic wellness experience" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
