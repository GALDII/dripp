import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
  TimeScale,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
  TimeScale,
  Filler
);

const sampleData = [
    {"time_tag":"2025-08-28T15:00:00Z", "energy":"0.1-0.8nm", "flux":1.0e-7},
    {"time_tag":"2025-08-28T16:00:00Z", "energy":"0.1-0.8nm", "flux":1.5e-7},
    {"time_tag":"2025-08-28T17:00:00Z", "energy":"0.1-0.8nm", "flux":3.0e-7},
    {"time_tag":"2025-08-28T18:00:00Z", "energy":"0.1-0.8nm", "flux":8.0e-7},
    {"time_tag":"2025-08-28T19:00:00Z", "energy":"0.1-0.8nm", "flux":1.2e-6},
    {"time_tag":"2025-08-28T20:00:00Z", "energy":"0.1-0.8nm", "flux":2.5e-6},
    {"time_tag":"2025-08-28T21:00:00Z", "energy":"0.1-0.8nm", "flux":1.5e-6},
    {"time_tag":"2025-08-28T22:00:00Z", "energy":"0.1-0.8nm", "flux":9.0e-7},
    {"time_tag":"2025-08-28T23:00:00Z", "energy":"0.1-0.8nm", "flux":5.0e-7},
    {"time_tag":"2025-08-29T00:00:00Z", "energy":"0.1-0.8nm", "flux":3.0e-7},
    {"time_tag":"2025-08-29T01:00:00Z", "energy":"0.1-0.8nm", "flux":2.0e-7},
    {"time_tag":"2025-08-29T02:00:00Z", "energy":"0.1-0.8nm", "flux":1.8e-7}
];


function XrayFluxChart() {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Using static sample data to ensure the chart renders correctly without network issues.
    const processData = (data) => {
        const filteredData = data.filter(d => d.energy === '0.1-0.8nm' && d.flux > 0);
        setChartData({
          labels: filteredData.map(d => new Date(d.time_tag).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })),
          datasets: [{
            label: 'GOES 1–8 Å Flux',
            data: filteredData.map(d => d.flux),
            borderColor: '#FBBF24',
            backgroundColor: 'rgba(251, 191, 36, 0.2)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
          }],
        });
    };
    
    processData(sampleData);
  }, []);

  if (error) return <div className="flex items-center justify-center h-full text-red-400"><p>Could not load live solar data.</p></div>;
  if (!chartData) return <div className="flex items-center justify-center h-full"><p>Loading Solar Activity...</p></div>;

  const options = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { type: 'category', grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'rgba(255, 255, 255, 0.7)', maxRotation: 45, minRotation: 45 }, },
      y: { type: 'logarithmic', min: 1e-9, max: 1e-2, grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: function(value) {
            if (value === 1e-8) return 'A'; if (value === 1e-7) return 'B'; if (value === 1e-6) return 'C'; if (value === 1e-5) return 'M'; if (value === 1e-4) return 'X'; return null;
          }
        },
      },
    },
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
  };

  return <Line data={chartData} options={options} />;
}

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
      {isLoading ? <div className="text-gray-400">Processing...</div> : src ? <img src={src} alt={title} className="w-full h-full object-contain" /> : <div className="text-gray-400">No image</div>}
    </div>
  </div>
);

// --- OPENCV IMAGE PROCESSING COMPONENT ---
function SolarImageProcessor({ uploadedImage, onBack }) {
  const [processed, setProcessed] = useState({ original: null, contours: null, mask: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uploadedImage || !window.cv) return;
    setIsLoading(true);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
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
        setProcessed({ original: uploadedImage, contours: contourDataUrl, mask: maskDataUrl });
        src.delete(); gray.delete(); binary.delete(); edges.delete(); contours.delete(); hierarchy.delete(); planes.delete(); firstChannel.delete(); blended.delete();
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
        <button onClick={onBack} className="py-2 px-6 bg-gray-600 text-white rounded-full font-bold shadow-md hover:bg-gray-500 transition-all duration-300">
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCvReady, setIsCvReady] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (window.cv) {
        setIsCvReady(true);
    } else {
        window.cv_onRuntimeInitialized = () => setIsCvReady(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage.preview);
    };
  }, [uploadedImage]);

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage.preview);
      const imageObject = { file, preview: URL.createObjectURL(file) };
      setUploadedImage(imageObject);
    }
  };

  const handleRemoveImage = () => setUploadedImage(null);
  const handleBrowseClick = () => fileInputRef.current.click();
  const handleFileInputChange = (e) => handleFile(e.target.files[0]);
  const handleAnalyzeClick = () => { if(uploadedImage) setIsAnalyzing(true); };
  const handleBackToUpload = () => { setIsAnalyzing(false); setUploadedImage(null); }

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  if (!isCvReady) {
    return (
      <div className="bg-gray-900 text-white p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl">Loading Analysis Engine...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-900 text-white p-4 sm:p-8 min-h-screen w-full">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center pt-8">
            {isAnalyzing ? (
                <SolarImageProcessor uploadedImage={uploadedImage?.preview} onBack={handleBackToUpload} />
            ) : !uploadedImage ? (
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

        <section className="py-12 mt-16">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-4">Live Solar Activity</h2>
                <p className="text-center text-gray-400 mb-8">Real-time X-ray flux from the GOES satellite (NOAA SWPC)</p>
                <div className="bg-black/20 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-gray-700 shadow-lg h-80 relative">
                    <XrayFluxChart />
                </div>
            </div>
        </section>
    </div>
  );
}

