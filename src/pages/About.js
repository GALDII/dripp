import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';


const fadeSlide = {
  hidden: (dir) => ({
    opacity: 0,
    x: dir === 'left' ? -80 : dir === 'right' ? 80 : 0,
    y: dir === 'up' ? 40 : dir === 'down' ? -40 : 0,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { type: 'spring', stiffness: 40, damping: 20, duration: 1 },
  },
};


const placeholderImg = (width, height, text) =>
  `https://placehold.co/${width}x${height}/000000/FFFFFF/png?text=${encodeURIComponent(text)}`;

const handleImageError = (e, text) => {
  e.target.onerror = null; // prevent infinite loop
  e.target.src = placeholderImg(600, 400, text);
};

/* ------------------------------------------------------------------
 * Reusable Helper Components
 * ------------------------------------------------------------------ */

// Tailwind color utility map for <Callout />
const CALLOUT_COLORS = {
  yellow: 'bg-yellow-500/10 border-yellow-400/40',
  red: 'bg-red-500/10 border-red-400/40',
  green: 'bg-green-500/10 border-green-400/40',
  blue: 'bg-blue-500/10 border-blue-400/40',
  purple: 'bg-purple-500/10 border-purple-400/40',
  orange: 'bg-orange-500/10 border-orange-400/40',
};

/**
 * A styled callout box to highlight key information.
 * @param {{color?: 'yellow'|'red'|'green'|'blue'|'purple'|'orange', children: React.ReactNode}} props
 */
function Callout({ color = 'yellow', children }) {
  const cls = CALLOUT_COLORS[color] || CALLOUT_COLORS.yellow;
  return (
    <div className={`w-full text-base md:text-lg mt-6 p-4 rounded-xl border ${cls}`}>
      {children}
    </div>
  );
}

// Data for the flare classification cards
const FLARE_CLASSES = [
  { lvl: 'X', desc: 'Major flares; strongest; can trigger global HF radio blackouts & long-lasting radiation storms.', color: 'red' },
  { lvl: 'M', desc: 'Medium; can cause brief radio blackouts at high latitudes; minor radiation storms.', color: 'orange' },
  { lvl: 'C', desc: 'Small; few noticeable Earth impacts; useful for solar monitoring.', color: 'yellow' },
  { lvl: 'B', desc: 'Very small events, often considered sub-flares.', color: 'blue' },
  { lvl: 'A', desc: 'Background level X-ray flux, no significant impact.', color: 'purple' },
];

// Tailwind gradient utility map for <FlareClassCard />
const FLARE_COLOR_MAP = {
  red: 'from-red-500/50 to-red-700/30 border-red-400/50',
  orange: 'from-orange-500/50 to-orange-700/30 border-orange-400/50',
  yellow: 'from-yellow-500/50 to-yellow-700/30 border-yellow-400/50',
  blue: 'from-blue-500/50 to-blue-700/30 border-blue-400/50',
  purple: 'from-purple-500/50 to-purple-700/30 border-purple-400/50',
};

/**
 * A card component to display information about a solar flare class.
 */
function FlareClassCard({ lvl, desc, color }) {
  const cls = FLARE_COLOR_MAP[color] || FLARE_COLOR_MAP.yellow;
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`p-5 rounded-xl border backdrop-blur-lg bg-gradient-to-br ${cls} shadow-lg flex flex-col items-center text-center h-full`}
    >
      <div className="text-5xl font-extrabold mb-3 tracking-widest">{lvl}</div>
      <p className="text-base text-gray-200 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/**
 * A button that smoothly scrolls the user to the top of the page.
 */
function ScrollTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
    };
    window.addEventListener('scroll', toggleVisibility);
    toggleVisibility(); // run once on mount
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <motion.button
      aria-label="Scroll to top"
      onClick={scrollTop}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      whileHover={{ scale: 1.1 }}
      className="fixed bottom-8 right-8 z-50 px-5 py-3 rounded-full text-base font-semibold bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-500/40 transition"
    >
      ↑ Top
    </motion.button>
  );
}

/* ------------------------------------------------------------------
 * Main Page Component
 * ------------------------------------------------------------------ */
export default function About() {
  return (
    <>
      {/* Style tag for custom keyframe animations */}
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

         .animate-blob {
          animation: blob 8s infinite;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.97); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>

      <div className="star-bg relative min-h-screen w-full overflow-x-hidden overflow-y-auto bg-gradient-to-br from-black via-purple-950 to-black text-white pb-32 font-sans">
        {/* animated background blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-yellow-500/10 blur-3xl animate-blob" />
        <div
          className="pointer-events-none absolute -bottom-40 -right-40 w-[32rem] h-[32rem] rounded-full bg-red-600/10 blur-3xl animate-blob"
          style={{ animationDelay: '4s' }}
        />

        {/* Header ----------------------------------------------------- */}
        <header className="relative z-10 text-center px-6 md:px-12 lg:px-16 pt-28">
          <motion.h1
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-8xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 drop-shadow-xl"
          >
            Solar Flares
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-6 text-xl md:text-2xl text-gray-300 leading-relaxed max-w-4xl mx-auto"
          >
            An exploration of the Sun's most powerful explosions—and their profound effects on our solar system.
          </motion.p>
        </header>

        {/* Main Content ------------------------------------------------ */}
        <main className="relative z-10 mt-24 space-y-32 md:space-y-40 px-6 md:px-12 lg:px-16">
          {/* What is a Solar Flare? */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={fadeSlide} custom="left" className="w-full h-96">
              <img
                loading="lazy"
                src="https://images.unsplash.com/photo-1614726353902-77c4b3a83353?q=80&w=1974&auto=format&fit=crop"
                alt="Artistic representation of a solar flare"
                className="w-full h-full object-cover rounded-2xl shadow-2xl border border-white/10 transition-transform duration-300 hover:scale-105"
                onError={(e) => handleImageError(e, 'Flare')}
              />
            </motion.div>
            <motion.div variants={fadeSlide} custom="right" className="text-xl text-gray-200 leading-loose">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-yellow-300">What is a Solar Flare?</h2>
              <p>
                A solar flare is an intense burst of electromagnetic radiation from the Sun’s atmosphere. They are our solar system's largest explosive events, driven by the sudden release of magnetic energy stored in active regions, often located near sunspots. This energy heats solar plasma to millions of degrees and accelerates charged particles to near the speed of light.
              </p>
              <Callout color="yellow">
                A flare's lifecycle has three phases: the precursor (initial energy release), the impulsive (rapid energy release), and the gradual decay.
              </Callout>
            </motion.div>
          </motion.section>

          {/* Magnetic Reconnection */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={fadeSlide} custom="right" className="md:order-2 w-full h-96">
              <img
                loading="lazy"
                src="https://www.nasa.gov/wp-content/uploads/2023/04/flare.jpg"
                alt="A powerful solar flare erupting from the Sun, captured by NASA"
                className="w-full h-full object-cover rounded-2xl shadow-2xl border border-white/10 transition-transform duration-300 hover:scale-105"
                onError={(e) => handleImageError(e, 'Magnetic+Fields')}
              />
            </motion.div>
            <motion.div variants={fadeSlide} custom="left" className="md:order-1 text-xl text-gray-200 leading-loose">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-purple-300">Magnetic Reconnection</h2>
              <p>
                The engine behind solar flares is magnetic reconnection. In the Sun's corona, complex and twisted magnetic field lines can suddenly snap and reconfigure into a simpler, lower-energy state. This process explosively converts stored magnetic energy into the thermal energy, kinetic energy, and intense radiation that define a flare.
              </p>
              <Callout color="purple">
                This process is incredibly efficient, accelerating electrons, protons, and heavier ions to relativistic speeds in mere seconds.
              </Callout>
            </motion.div>
          </motion.section>

          {/* Flare Classification */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center"
          >
            <motion.h2 variants={fadeSlide} custom="up" className="text-4xl md:text-5xl font-bold mb-8 text-red-300">
              Flare Classification (GOES)
            </motion.h2>
            <motion.p
              variants={fadeSlide}
              custom="up"
              transition={{ delay: 0.2 }}
              className="max-w-4xl mx-auto text-gray-300 text-xl leading-relaxed mb-12"
            >
              Flares are classified by their peak soft X-ray flux (1–8 Ångströms) measured by the GOES satellites. The scale is logarithmic: each letter represents a 10-fold increase in energy output.
            </motion.p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 max-w-6xl mx-auto">
              {FLARE_CLASSES.map((fc, i) => (
                <motion.div key={fc.lvl} variants={fadeSlide} custom="up" transition={{ delay: 0.3 + i * 0.1 }}>
                  <FlareClassCard {...fc} />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Flares vs CMEs */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={fadeSlide} custom="left" className="w-full h-96">
              <img
                loading="lazy"
                src="https://www.nasa.gov/wp-content/uploads/2022/12/52538496197_9c48875e5b_o.jpg"
                alt="Diagram showing a flare and a Coronal Mass Ejection (CME)"
                className="w-full h-full object-cover rounded-2xl shadow-2xl border border-white/10 transition-transform duration-300 hover:scale-105"
                onError={(e) => handleImageError(e, 'Flare+vs+CME')}
              />
            </motion.div>
            <motion.div variants={fadeSlide} custom="right" className="text-xl text-gray-200 leading-loose">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-blue-300">Flares vs. CMEs</h2>
              <p>
                While often related, flares and Coronal Mass Ejections (CMEs) are different events. A flare is an intense flash of light and radiation. A CME is a massive eruption of solar plasma and magnetic fields into space. A strong flare can trigger a CME, but either can occur independently.
              </p>
              <Callout color="blue">
                Flares cause radio blackouts on Earth within minutes. CMEs take 1-3 days to arrive and can cause geomagnetic storms that produce auroras.
              </Callout>
            </motion.div>
          </motion.section>

          {/* Impacts on Earth */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={fadeSlide} custom="right" className="md:order-2 w-full h-96">
              <img
                loading="lazy"
                src="https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2070&auto=format&fit=crop"
                alt="Aurora over Earth"
                className="w-full h-full object-cover rounded-2xl shadow-2xl border border-white/10 transition-transform duration-300 hover:scale-105"
                onError={(e) => handleImageError(e, 'Aurora')}
              />
            </motion.div>
            <motion.div variants={fadeSlide} custom="left" className="md:order-1 text-xl text-gray-200 leading-loose">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-green-300">Impacts on Earth</h2>
              <p>
                The intense radiation from a flare ionizes Earth's upper atmosphere, causing High-Frequency (HF) radio blackouts on the sunlit side. Energetic particles can pose a radiation hazard to astronauts and satellite electronics. Associated CMEs can induce powerful currents in power grids, potentially causing widespread outages.
              </p>
              <Callout color="green">
                The beautiful auroras are a direct result of solar particles interacting with Earth's magnetic field and atmosphere.
              </Callout>
            </motion.div>
          </motion.section>

          {/* Solar Cycle Influence */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.h2 variants={fadeSlide} custom="up" className="text-4xl md:text-5xl font-bold mb-6 text-orange-300">
              Solar Cycle Influence
            </motion.h2>
            <motion.p
              variants={fadeSlide}
              custom="up"
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300 leading-relaxed"
            >
              Flare frequency rises and falls with the roughly 11-year solar cycle. We are currently in Solar Cycle 25, approaching a period of maximum activity, meaning more frequent and intense flares are expected in the coming years.
            </motion.p>
            <motion.div variants={fadeSlide} custom="up" transition={{ delay: 0.4 }} className="mt-8">
              <Callout color="orange">
                Monitoring the solar cycle is key to forecasting long-term space weather risk, which is crucial for satellite operators and infrastructure planning.
              </Callout>
            </motion.div>
          </motion.section>

          {/* Learn More */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.h2 variants={fadeSlide} custom="up" className="text-3xl md:text-4xl font-bold mb-6 text-yellow-200">
              Learn More
            </motion.h2>
            <motion.p
              variants={fadeSlide}
              custom="up"
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300 mb-8"
            >
              Explore authoritative solar physics resources from the experts:
            </motion.p>
            <motion.div
              variants={fadeSlide}
              custom="up"
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <a
                href="https://en.wikipedia.org/wiki/Solar_flare"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-base font-semibold transition transform hover:scale-105"
              >
                Wikipedia: Solar Flare
              </a>
              <a
                href="https://www.swpc.noaa.gov/phenomena/solar-flares-radio-blackouts"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-base font-semibold transition transform hover:scale-105"
              >
                NOAA SWPC: Flares
              </a>
              <a
                href="https://sdo.gsfc.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-base font-semibold transition transform hover:scale-105"
              >
                NASA SDO Mission
              </a>
            </motion.div>
          </motion.section>
        </main>

        <ScrollTopButton />
      </div>
    </>
  );
}
