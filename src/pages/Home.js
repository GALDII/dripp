import React from 'react';
import { motion } from 'framer-motion';

// --- Reusable Helper Components ---

/**
 * A card component for the "Features" section.
 */
function FeatureCard({ icon, title, children }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-lg h-full">
      <div className="text-yellow-400 mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}

/**
 * A card component for the "How It Works" section.
 */
function StepCard({ number, title, children }) {
  return (
    <div className="text-center">
      <div className="mb-4 w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-yellow-400/10 border-2 border-yellow-500/50 text-yellow-300 text-2xl font-bold">
        {number}
      </div>
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 max-w-xs mx-auto">{children}</p>
    </div>
  );
}


// --- Main Home Page Component ---

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <>
      <style>{`
        .star-bg {
          background-color: #0c0a18;
          background-image: 
            radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px),
            radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px),
            radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 40px),
            radial-gradient(rgba(255,255,255,.4), rgba(255,255,255,.1) 2px, transparent 30px);
          background-size: 550px 550px, 350px 350px, 250px 250px, 150px 150px;
          background-position: 0 0, 40px 60px, 130px 270px, 70px 100px;
          animation: stars 200s linear infinite;
        }

        @keyframes stars {
          from {
            background-position: 0 0, 40px 60px, 130px 270px, 70px 100px;
          }
          to {
            background-position: -10000px 5000px, -10000px 5000px, -10000px 5000px, -10000px 5000px;
          }
        }
      `}</style>
      
      <div className="min-h-screen w-full text-white star-bg overflow-y-auto">
        {/* --- Hero Section --- */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="min-h-screen flex flex-col items-center justify-center text-center p-6 relative"
        >
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 drop-shadow-lg"
          >
            Solar Flare Sentinel
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-6 text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            Harnessing the power of AI to analyze solar activity. Upload an image of the Sun and instantly identify potential flare regions with our deep learning model.
          </motion.p>
          <motion.div variants={itemVariants}>
            <a
              href="/predict" // Changed to a link
              className="mt-10 inline-block bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-10 rounded-full shadow-lg shadow-yellow-500/40 transition-transform transform hover:scale-110"
            >
              Get Started →
            </a>
          </motion.div>
        </motion.section>

        {/* --- How It Works Section --- */}
        <section className="py-24 px-6 bg-black/20 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-16">Simple & Powerful</h2>
            <div className="grid md:grid-cols-3 gap-16">
              <StepCard number="1" title="Upload Image">
                Choose any recent, clear image of the Sun. Our system accepts standard formats like JPEG and PNG.
              </StepCard>
              <StepCard number="2" title="AI Analysis">
                Our unsupervised learning model processes your image, analyzing textures and patterns to identify areas of intense magnetic activity.
              </StepCard>
              <StepCard number="3" title="View Prediction">
                Instantly receive a generated mask highlighting the regions with the highest probability of producing a solar flare.
              </StepCard>
            </div>
          </div>
        </section>

        {/* --- Why It Matters Section --- */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Predict Solar Flares?</h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Solar flares are more than just beautiful light shows. These intense bursts of radiation can have significant real-world consequences:
              </p>
              <ul className="mt-6 space-y-4 text-lg">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-3 mt-1">✓</span>
                  <span><strong>Disrupting Power Grids:</strong> Geomagnetic storms induced by solar events can overload national power grids, causing widespread blackouts.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-3 mt-1">✓</span>
                  <span><strong>Impacting Communications:</strong> They can shut down radio communications and damage GPS satellites, affecting everything from aviation to personal navigation.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-3 mt-1">✓</span>
                  <span><strong>Astronaut Safety:</strong> Predicting flares is crucial for protecting astronauts in space from harmful radiation exposure.</span>
                </li>
              </ul>
            </div>
            <div className="w-full h-80 md:h-96">
              <img src="https://images.unsplash.com/photo-1612178537247-43de42a35a17?q=80&w=1964&auto=format&fit=crop" alt="Earth with communication lines" className="w-full h-full object-cover rounded-2xl shadow-2xl border border-white/10"/>
            </div>
          </div>
        </section>
        
        {/* --- Features Section --- */}
        <section className="py-24 px-6 bg-black/20 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">Core Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard title="AI-Powered Analysis" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}>
                Utilizes a sophisticated autoencoder model to detect anomalies and complex patterns invisible to the human eye.
              </FeatureCard>
              <FeatureCard title="Instant Mask Generation" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}>
                Receive a clear, visual overlay on your image, pinpointing the exact locations of potential flare activity.
              </FeatureCard>
              <FeatureCard title="Open & Accessible" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9" /></svg>}>
                Built with modern web technologies like TensorFlow.js, allowing powerful predictions to run directly in your browser.
              </FeatureCard>
            </div>
          </div>
        </section>

        {/* --- Final CTA Section --- */}
        <section className="py-24 px-6 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Analyze the Sun?</h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">Upload your image now and get an instant prediction from our AI model.</p>
            <a
              href="/predict" // Changed to a link
              className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-4 px-10 rounded-full shadow-lg shadow-yellow-500/40 transition-transform transform hover:scale-110"
            >
              Predict a Flare
            </a>
        </section>
      </div>
    </>
  );
}






