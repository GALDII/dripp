import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-black bg-opacity-80 text-white flex justify-between px-6 py-4 fixed top-0 w-full shadow-lg z-50">
      <h1 className="text-xl font-bold text-yellow-400">☀ Solar Predictor</h1>
      <div className="space-x-6 text-lg">
        <Link to="/" className="hover:text-yellow-400">Home</Link>
        <Link to="/upload" className="hover:text-yellow-400">Upload</Link>
        <Link to="/about" className="hover:text-yellow-400">About</Link>
      </div>
    </nav>
  );
}
