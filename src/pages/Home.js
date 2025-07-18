export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white bg-gradient-to-br from-purple-900 via-black to-yellow-800">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee')] bg-cover bg-center opacity-20"></div>
      <h1 className="text-5xl font-extrabold mb-4 animate-pulse">Predict Solar Flares</h1>
      <p className="text-xl text-gray-300 max-w-2xl text-center">
        AI-powered prediction system for solar flares. Upload an image and get insights instantly.
      </p>
      <a href="/upload" className="mt-8 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-110">
        Get Started →
      </a>
    </div>
  );
}
 