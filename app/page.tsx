import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">MarketReveal.ai</h1>
        <p className="text-xl text-gray-600">
          AI-Powered Market Research in Minutes
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-block bg-accent text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-block bg-white border-2 border-accent text-accent px-8 py-3 rounded-lg font-semibold hover:bg-accent hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
