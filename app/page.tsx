import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/navigation";

export default function Home() {
  // Curated outfit images for the collage
  const outfitImages = [
    { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop", alt: "Minimalist outfit" },
    { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop", alt: "Casual street style" },
    { url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=550&fit=crop", alt: "Elegant fashion" },
    { url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=600&fit=crop", alt: "Summer outfit" },
    { url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop", alt: "Vintage style" },
    { url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=550&fit=crop", alt: "Modern fashion" },
  ];

  return (
    <main className="min-h-screen">
      <Navigation />

      {/* Hero Section with Image Collage Background */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Image Collage Grid */}
        <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 gap-2 p-2 opacity-60 dark:opacity-50">
          {outfitImages.map((image, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover hover:scale-110 transition-transform duration-700"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/75 to-white/85 dark:from-neutral-900/85 dark:via-neutral-900/75 dark:to-neutral-900/85" />

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">
            Your Style,
            <span className="block text-primary-500 dark:text-primary-400">Powered by AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-neutral-700 dark:text-neutral-300 mb-10 text-balance max-w-2xl mx-auto">
            Upload your favorite outfits and discover perfectly matched fashion items from curated brands
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/upload"
              className="inline-block bg-primary-500 dark:bg-primary-600 text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-primary-600 dark:hover:bg-primary-700 transition-all hover:shadow-2xl hover:scale-105"
            >
              Start Discovering
            </Link>
            <Link
              href="/moodboard"
              className="inline-block bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-2 border-neutral-200 dark:border-neutral-700 px-10 py-4 rounded-full font-semibold text-lg hover:border-neutral-300 dark:hover:border-neutral-600 transition-all hover:shadow-lg"
            >
              View Inspiration
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center text-neutral-900 dark:text-white mb-16">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              step: "01",
              title: "Upload Your Style",
              description: "Share photos of outfits you love and want to recreate",
              icon: "📸"
            },
            {
              step: "02",
              title: "AI Analysis",
              description: "Our AI understands colors, styles, and aesthetic vibes",
              icon: "🤖"
            },
            {
              step: "03",
              title: "Perfect Matches",
              description: "Get personalized recommendations from curated brands",
              icon: "✨"
            }
          ].map((feature, i) => (
            <div key={i} className="text-center">
              <div className="text-7xl mb-6">{feature.icon}</div>
              <div className="text-primary-500 dark:text-primary-400 font-bold text-lg mb-3">
                {feature.step}
              </div>
              <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-50 dark:bg-primary-900/20 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
            Ready to find your perfect style?
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8">
            Join thousands discovering their unique fashion aesthetic
          </p>
          <Link
            href="/upload"
            className="inline-block bg-primary-500 dark:bg-primary-600 text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-primary-600 dark:hover:bg-primary-700 transition-all hover:shadow-2xl hover:scale-105"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </main>
  );
}
