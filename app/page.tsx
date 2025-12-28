import Link from "next/link";
import Navigation from "@/components/navigation";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 dark:text-white mb-6">
            Discover Your
            <span className="block text-primary-500 dark:text-primary-400">Perfect Style</span>
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8 text-balance">
            Upload photos of your favorite outfits and let AI find matching fashion items
            from curated brands that match your unique aesthetic.
          </p>
          <Link
            href="/upload"
            className="inline-block bg-primary-500 dark:bg-primary-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-600 dark:hover:bg-primary-700 transition-all hover:shadow-lg hover:scale-105"
          >
            Start Discovering
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              emoji: "📸",
              title: "Upload Your Style",
              description: "Share photos of outfits you love and want to recreate"
            },
            {
              emoji: "🤖",
              title: "AI Analysis",
              description: "Our AI understands colors, styles, and aesthetic vibes"
            },
            {
              emoji: "✨",
              title: "Perfect Matches",
              description: "Get personalized recommendations from curated brands"
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-soft hover:shadow-xl transition-shadow"
            >
              <div className="text-5xl mb-4">{feature.emoji}</div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
