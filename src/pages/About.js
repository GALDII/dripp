export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-black to-purple-900 text-white flex flex-col items-center justify-center pt-20 px-6">
      <h2 className="text-4xl font-bold mb-4">About Solar Flares</h2>
      <p className="text-lg text-gray-300 max-w-2xl text-center">
        Solar flares are sudden explosions of energy on the Sun’s surface, releasing radiation that can disrupt satellites, communication, and power grids.
      </p>
      <img
        src="https://solarsystem.nasa.gov/system/news_items/main_images/901_PIA18906.jpg"
        alt="Solar Flare"
        className="mt-8 rounded-xl shadow-lg max-w-md"
      />
    </div>
  );
}
