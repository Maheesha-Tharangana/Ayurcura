interface Feature {
  icon: string;
  title: string;
  description: string;
}

export default function FeatureSection() {
  const features: Feature[] = [
    {
      icon: "ri-user-search-line",
      title: "Doctor Locator",
      description: "Find qualified Ayurvedic practitioners near you with our integrated Google Maps feature."
    },
    {
      icon: "ri-calendar-check-line",
      title: "Easy Appointment Booking",
      description: "Schedule appointments with Ayurvedic doctors directly through our intuitive booking system."
    },
    {
      icon: "ri-book-open-line",
      title: "Educational Resources",
      description: "Access comprehensive information about Ayurvedic principles, treatments, and practices."
    },
   
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-500 font-semibold tracking-wide uppercase font-heading">Our Services</h2>
          <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-neutral-900 sm:text-4xl font-heading">
            Holistic Approach to Health
          </p>
          <p className="mt-4 max-w-2xl text-xl text-neutral-600 lg:mx-auto">
            Discover the complete Ayurvedic ecosystem designed to support your wellness journey.
          </p>
        </div>

        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {features.map((feature, index) => (
              <div key={index} className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <i className={`${feature.icon} text-xl`}></i>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-neutral-900 font-heading">{feature.title}</h3>
                  <p className="mt-2 text-base text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
