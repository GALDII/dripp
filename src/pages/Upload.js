import React, { useState, useRef } from "react";

export default function Upload() {
  const [image, setImage] = useState(null);
  const [mask, setMask] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setMask(null);
    }
  };

  const handleButtonClick = () => fileInputRef.current.click();

  const handlePredict = () => {
    if (!image) return;
    setLoading(true);
    setTimeout(() => {
      const randomMask = `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/400/300`;
      setMask(randomMask);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-purple-900 to-yellow-900 text-white pt-20">
      <h2 className="text-3xl font-bold mb-4">Upload Solar Image</h2>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
      />
      <button
        onClick={handleButtonClick}
        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-full shadow-lg transition-transform hover:scale-105"
      >
        Choose Image
      </button>
      {image && (
        <div className="mt-6 flex justify-center">
          <img src={image} alt="Uploaded" className="max-h-64 rounded-lg shadow-lg" />
        </div>
      )}
      <button
        onClick={handlePredict}
        className="mt-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:scale-105 transition-transform"
      >
        {loading ? "Processing..." : "Predict"}
      </button>
      {mask && !loading && (
        <div className="mt-8 text-center">
          <h3 className="text-xl font-semibold mb-4 text-yellow-300">Predicted Mask</h3>
          <img src={mask} alt="Prediction" className="max-h-64 rounded-lg shadow-lg" />
        </div>
      )}
    </div>
  );
}
