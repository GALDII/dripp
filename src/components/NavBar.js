import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * A custom navigation link component for the desktop view.
 */
function NavLink({ to, children, currentPath }) {
  const isActive = currentPath === to;

  const activeLinkStyle = {
    color: '#FBBF24',
    textShadow: '0 0 10px rgba(251, 191, 36, 0.8)',
  };

  return (
    <Link
      to={to}
      className="relative group text-gray-300 hover:text-yellow-400 transition-colors duration-300"
      style={isActive ? activeLinkStyle : {}}
    >
      {children}
      <span
        className={`absolute bottom-[-4px] left-0 w-full h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center ${
          isActive ? 'scale-x-100' : ''
        }`}
      ></span>
    </Link>
  );
}

/**
 * A button for the mobile menu with open/close animation.
 */
function MenuButton({ isOpen, onClick }) {
  return (
    <button onClick={onClick} className="relative z-50 w-8 h-8 text-yellow-400 focus:outline-none">
      <motion.div
        animate={{ y: isOpen ? 0 : -8, rotate: isOpen ? 45 : 0 }}
        className="absolute w-full h-0.5 bg-current"
      />
      <motion.div
        animate={{ opacity: isOpen ? 0 : 1 }}
        className="absolute w-full h-0.5 bg-current mt-2"
      />
      <motion.div
        animate={{ y: isOpen ? 0 : 8, rotate: isOpen ? -45 : 0 }}
        className="absolute w-full h-0.5 bg-current"
      />
    </button>
  );
}

// --- Main Navbar Component ---
export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu on route change
    setIsOpen(false);
  }, [location]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={`fixed top-0 w-full z-40 transition-all duration-300 ${
          scrolled || isOpen ? 'bg-black/50 backdrop-blur-lg shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="text-3xl font-bold text-yellow-400 hover:text-yellow-300 transition-all duration-300"
            style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }}
          >
            ☀ Solar Sentinel
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10 text-xl">
            <NavLink to="/" currentPath={location.pathname}>
              Home
            </NavLink>
            <NavLink to="/upload" currentPath={location.pathname}>
              Predict
            </NavLink>
            <NavLink to="/about" currentPath={location.pathname}>
              About Flares
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <MenuButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-30 md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="absolute top-0 left-0 w-full pt-28 pb-8 bg-black/80"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the menu
            >
              <div className="flex flex-col items-center space-y-8 text-3xl">
                <Link to="/" className="text-gray-300 hover:text-yellow-400">
                  Home
                </Link>
                <Link to="/upload" className="text-gray-300 hover:text-yellow-400">
                  Predict
                </Link>
                <Link to="/about" className="text-gray-300 hover:text-yellow-400">
                  About Flares
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
