import React from "react";
import { HashRouter, BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/NavBar";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import About from "./pages/About";

// Automatically use HashRouter in production (GitHub Pages), BrowserRouter locally
const RouterComponent = process.env.NODE_ENV === "production" ? HashRouter : BrowserRouter;

function App() {
  return (
    <RouterComponent>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </RouterComponent>
  );
}

export default App;
