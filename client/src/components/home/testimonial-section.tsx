interface Testimonial {
  initials: string;
  name: string;
  rating: number;
  comment: string;
}

export default function TestimonialSection() {
  const testimonials: Testimonial[] = [
    {
      initials: "RS",
      name: "Ramesh S.",
      rating: 5,
      comment: "Finding the right Ayurvedic doctor used to be a challenge. Thanks to AyurCura, I found a specialist who helped me manage my chronic arthritis with natural treatments."
    },
    {
      initials: "PJ",
      name: "Priya J.",
      rating: 4.5,
      comment: "The educational resources on this platform helped me understand my dosha type and make dietary changes that improved my digestion and energy levels significantly."
    },
    {
      initials: "AN",
      name: "Anand N.",
      rating: 4,
      comment: "The symptom analysis feature is amazing! I uploaded a photo of my skin condition and received accurate treatment suggestions that actually worked."
    }
  ];

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="ri-star-fill"></i>);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<i key="half" className="ri-star-half-fill"></i>);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="ri-star-line"></i>);
    }
    
    return stars;
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900 font-heading">What Our Users Say</h2>
          <p className="mt-4 text-lg text-neutral-600">
            Real stories from people who've experienced the benefits of Ayurvedic care
          </p>
        </div>

        <div className="mt-10 grid gap-6 grid-cols-1 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-neutral-50 p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                  {testimonial.initials}
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-neutral-900">{testimonial.name}</h4>
                  <div className="flex text-yellow-400">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>
              </div>
              <p className="text-neutral-700">
                "{testimonial.comment}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
