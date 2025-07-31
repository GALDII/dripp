import React, { useState, useEffect, useRef } from 'react';

// --- HELPER & UI COMPONENTS ---

const UploadIcon = () => (
  <svg className="w-16 h-16 mx-auto text-gray-500 transition-transform duration-300 group-hover:scale-110" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ImagePanel = ({ src, title, isLoading }) => (
  <div className="text-center">
    <h3 className="text-2xl font-semibold mb-4 text-yellow-400">{title}</h3>
    <div className="w-full h-60 md:h-80 flex items-center justify-center bg-black/20 rounded-xl overflow-hidden border border-gray-700">
      {isLoading ? (
        <div className="text-gray-400">Processing...</div>
      ) : src ? (
        <img src={src} alt={title} className="w-full h-full object-contain" />
      ) : (
        <div className="text-gray-400">No image</div>
      )}
    </div>
  </div>
);


// --- OPENCV IMAGE PROCESSING COMPONENT ---

function SolarImageProcessor({ uploadedImage, onBack }) {
  const [processed, setProcessed] = useState({ original: null, contours: null, mask: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uploadedImage) return;

    // Ensure OpenCV is loaded
    if (!window.cv) {
        console.error("OpenCV.js is not loaded.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    const img = new window.Image();
    img.crossOrigin = "anonymous"; // Handle potential CORS issues with object URLs
    img.src = uploadedImage;
    img.onload = () => {
      try {
        const cv = window.cv;
        let src = cv.imread(img);
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        let binary = new cv.Mat();
        cv.threshold(gray, binary, 200, 255, cv.THRESH_BINARY);
        let edges = new cv.Mat();
        cv.Canny(binary, edges, 10, 100);
        let planes = new cv.MatVector();
        cv.split(src, planes);
        const firstChannel = planes.get(0);
        let blended = new cv.Mat();
        cv.addWeighted(firstChannel, 0.8, edges, 0.4, 0.5, blended);
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        cv.cvtColor(blended, blended, cv.COLOR_GRAY2RGBA);

        for (let i = 0; i < contours.size(); ++i) {
          let rect = cv.boundingRect(contours.get(i));
          let color = new cv.Scalar(255, 0, 0, 255);
          cv.rectangle(blended, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), color, 2);
        }

        const canvas = document.createElement('canvas');
        cv.imshow(canvas, blended);
        const contourDataUrl = canvas.toDataURL();
        cv.imshow(canvas, binary);
        const maskDataUrl = canvas.toDataURL();

        setProcessed({
          original: uploadedImage,
          contours: contourDataUrl,
          mask: maskDataUrl,
        });

        // Cleanup
        src.delete(); gray.delete(); binary.delete(); edges.delete();
        contours.delete(); hierarchy.delete(); planes.delete(); firstChannel.delete(); blended.delete();
      } catch (error) {
          console.error("Error during OpenCV processing:", error);
      } finally {
          setIsLoading(false);
      }
    };
     img.onerror = () => {
        console.error("Failed to load image for processing.");
        setIsLoading(false);
    }
  }, [uploadedImage]);

  return (
    <div className="w-full animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl">
            <ImagePanel src={processed.original} title="Original Image" isLoading={isLoading} />
            <ImagePanel src={processed.contours} title="Blended Contours" isLoading={isLoading} />
            <ImagePanel src={processed.mask} title="Mask/Threshold" isLoading={isLoading} />
        </div>
        <div className="text-center mt-8">
            <button 
                onClick={onBack}
                className="py-2 px-6 bg-gray-600 text-white rounded-full font-bold shadow-md hover:bg-gray-500 transition-all duration-300"
            >
                Analyze Another Image
            </button>
        </div>
    </div>
  );
}


// --- MAIN UPLOAD PAGE COMPONENT ---

export default function UploadPage() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // State to switch to analysis view
  const [isCvReady, setIsCvReady] = useState(false); // State to track if OpenCV is loaded
  const fileInputRef = useRef(null);

  // Check if OpenCV is loaded
  useEffect(() => {
    if (window.cv) {
        setIsCvReady(true);
    } else {
        window.cv_onRuntimeInitialized = () => setIsCvReady(true);
    }
  }, []);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage.preview);
    };
  }, [uploadedImage]);

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage.preview); // Clean up previous
      const imageObject = { file, preview: URL.createObjectURL(file) };
      setUploadedImage(imageObject);
    }
  };

  const handleRemoveImage = () => setUploadedImage(null);
  const handleBrowseClick = () => fileInputRef.current.click();
  const handleFileInputChange = (e) => handleFile(e.target.files[0]);
  
  // --- CLICK HANDLER FOR THE BUTTON ---
  const handleAnalyzeClick = () => {
      if(uploadedImage) {
          setIsAnalyzing(true);
      }
  };
  
  const handleBackToUpload = () => {
      setIsAnalyzing(false);
      setUploadedImage(null);
  }

  // Drag and Drop handlers
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // Render loading screen if OpenCV isn't ready
  if (!isCvReady) {
    return (
      <div className="bg-gray-900 text-white p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl">Loading Analysis Engine...</p>
        </div>
      </div>
    );
  }
  
  // Main render logic
  return (
    <div className="bg-gray-900 text-white p-4 sm:p-8 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-7xl mx-auto">
        {isAnalyzing ? (
            <SolarImageProcessor uploadedImage={uploadedImage?.preview} onBack={handleBackToUpload} />
        ) : !uploadedImage ? (
          // Uploader View
          <div onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onClick={handleBrowseClick} className={`group w-full max-w-3xl mx-auto p-8 text-center border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ease-in-out ${isDragging ? 'border-yellow-400 bg-gray-800 scale-105 shadow-2xl shadow-yellow-500/10' : 'border-gray-600 bg-gray-900/50 hover:border-yellow-500 hover:bg-gray-800'}`}>
            <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept="image/*" className="hidden" />
            <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
              <UploadIcon />
              <p className="text-xl font-semibold text-white">Drag & Drop your image here</p>
              <p className="text-gray-400">or <span className="font-semibold text-yellow-400">click to browse</span></p>
              <p className="text-xs text-gray-500">Supports: PNG, JPG, GIF</p>
            </div>
          </div>
        ) : (
          // Preview View
          <div className="w-full max-w-3xl mx-auto p-4 text-center bg-gray-800/50 border border-gray-700 rounded-2xl relative shadow-2xl shadow-black/30 animate-fade-in">
            <div className="relative">
                <img src={uploadedImage.preview} alt="Solar image preview" className="w-full h-auto max-h-[60vh] object-contain rounded-xl" />
                <button onClick={handleRemoveImage} className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white rounded-full p-2 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-all duration-300" aria-label="Remove image">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="mt-4 flex flex-col items-center gap-4">
              <p className="text-white truncate font-mono text-sm" title={uploadedImage.file.name}>{uploadedImage.file.name}</p>
              <button onClick={handleAnalyzeClick} className="py-3 px-8 bg-yellow-500 text-gray-900 rounded-full font-bold shadow-lg shadow-yellow-500/20 hover:bg-yellow-400 hover:scale-105 transform transition-all duration-300 ease-in-out">
                Analyze Flare Activity
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
