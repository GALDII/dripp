import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Custom SVG Chart Component ---
function XrayFluxChart() {
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const generateMockData = useCallback(() => {
    const now = new Date();
    const data = [];
    for (let i = 0; i < 144; i++) { // Every 10 minutes for 24 hours
      const time = new Date(now.getTime() - (143 - i) * 10 * 60 * 1000);
      let baseFlux = 1e-8 + Math.random() * 5e-8;
      if (Math.random() < 0.02) baseFlux += Math.random() * 1e-5;
      if (Math.random() < 0.005) baseFlux += Math.random() * 1e-4;
      const flux = Math.max(1e-9, baseFlux);
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false }),
        flux: flux,
        logFlux: Math.log10(flux)
      });
    }
    return data;
  }, []);

  // MODIFIED: This function now fetches from your local server
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      // Attempt to fetch live data from your proxy server
      const response = await fetch("http://localhost:3001/api/solar-data");
      
      if (!response.ok) {
        throw new Error(`Proxy server returned status ${response.status}`);
      }
      
      const liveData = await response.json();

      if (!Array.isArray(liveData) || liveData.length === 0) {
        throw new Error("Live data is empty or invalid");
      }
      
      // Process the live data
      const processedData = liveData
        .filter(d => d.energy === '0.1-0.8nm' && d.flux > 0)
        .map(d => {
          const flux = Math.max(1e-9, d.flux); // Ensure flux is not zero for log scale
          return {
            time: new Date(d.time_tag).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              timeZone: 'UTC', 
              hour12: false 
            }),
            flux: flux,
            logFlux: Math.log10(flux)
          };
        });
      
      if (processedData.length === 0) {
        throw new Error("No valid X-ray flux data found in live feed.");
      }

      setChartData(processedData);
      setLastUpdated(new Date().toLocaleTimeString());
      
    } catch (e) {
      // Fallback to mock data if the server fails
      console.error("Live data fetch failed:", e.message);
      const mockData = generateMockData();
      setChartData(mockData);
      setError("Live data unavailable - using simulated data");
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [generateMockData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000); // Update every 2 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!chartData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mb-4"></div>
        <p className="text-yellow-400">Loading Solar Activity...</p>
      </div>
    );
  }

  // Chart dimensions and scaling
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 30, bottom: 60, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Scale data points
  const minLogFlux = -9;
  const maxLogFlux = -2;
  
  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * plotWidth;
    const normalizedLog = (d.logFlux - minLogFlux) / (maxLogFlux - minLogFlux);
    const y = plotHeight - (normalizedLog * plotHeight);
    return { x: x + padding.left, y: y + padding.top, flux: d.flux, time: d.time };
  });

  // Create path for line
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="relative h-full w-full">
      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="bg-gray-900/50 rounded-lg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width={plotWidth} height={plotHeight} x={padding.left} y={padding.top} fill="url(#grid)" />
        
        {['A', 'B', 'C', 'M', 'X'].map((label, i) => {
          const y = padding.top + plotHeight - (i / 4) * plotHeight;
          return (
            <g key={label}>
              <line x1={padding.left - 5} y1={y} x2={padding.left} y2={y} stroke="rgba(255,255,255,0.7)" />
              <text x={padding.left - 10} y={y + 5} textAnchor="end" fill="rgba(255,255,255,0.7)" fontSize="12">{label}</text>
            </g>
          );
        })}
        
        {chartData.filter((_, i) => i % Math.floor(chartData.length / 6) === 0).map((d, i) => {
          const x = padding.left + (i * Math.floor(chartData.length / 6) / (chartData.length - 1)) * plotWidth;
          return (
            <g key={i}>
              <line x1={x} y1={chartHeight - padding.bottom} x2={x} y2={chartHeight - padding.bottom + 5} stroke="rgba(255,255,255,0.7)" />
              <text x={x} y={chartHeight - padding.bottom + 20} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10">{d.time}</text>
            </g>
          );
        })}
        
        <path d={`${pathData} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`} fill="rgba(251, 191, 36, 0.2)" />
        <path d={pathData} fill="none" stroke="#FBBF24" strokeWidth="2" />
        
        <text x={chartWidth / 2} y={chartHeight - 10} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="12">Time (UTC)</text>
        <text x={20} y={chartHeight / 2} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="12" transform={`rotate(-90, 20, ${chartHeight / 2})`}>X-ray Flux Class</text>
      </svg>
      
      {error && (
        <div className="absolute top-2 right-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-lg text-sm border border-orange-500/30">
          {error}
        </div>
      )}
      {lastUpdated && (
        <div className="absolute bottom-2 right-2 text-gray-400 text-xs">
          Updated: {lastUpdated}
        </div>
      )}
    </div>
  );
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
      {isLoading ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mb-2"></div>
          <div className="text-gray-400">Processing...</div>
        </div>
      ) : src ? (
        <img src={src} alt={title} className="w-full h-full object-contain" />
      ) : (
        <div className="text-gray-400">No image</div>
      )}
    </div>
  </div>
);

// --- SOLAR IMAGE PROCESSOR ---
function SolarImageProcessor({ uploadedImage, onBack }) {
  const [processed, setProcessed] = useState({ original: null, contours: null, mask: null });
  const [isLoading, setIsLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);

  const analyzeImage = useCallback(async (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let totalBrightness = 0, brightPixels = 0, hotspots = 0, veryBrightPixels = 0, extremeHotspots = 0;
          const brightnessValues = [];
          for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            brightnessValues.push(brightness);
            totalBrightness += brightness;
            if (brightness > 160) brightPixels++;
            if (brightness > 200) veryBrightPixels++;
            if (brightness > 230) hotspots++;
            if (brightness > 245) extremeHotspots++;
          }
          const totalPixels = data.length / 4;
          const avgBrightness = totalBrightness / totalPixels;
          const brightRatio = brightPixels / totalPixels;
          const veryBrightRatio = veryBrightPixels / totalPixels;
          const hotspotRatio = hotspots / totalPixels;
          const extremeRatio = extremeHotspots / totalPixels;
          const variance = brightnessValues.reduce((sum, b) => sum + Math.pow(b - avgBrightness, 2), 0) / totalPixels;
          const stdDev = Math.sqrt(variance);
          const contourCanvas = document.createElement('canvas');
          const contourCtx = contourCanvas.getContext('2d');
          contourCanvas.width = canvas.width;
          contourCanvas.height = canvas.height;
          contourCtx.drawImage(img, 0, 0);
          const regionSize = Math.max(20, Math.min(canvas.width, canvas.height) / 15);
          const step = Math.floor(regionSize / 2);
          contourCtx.lineWidth = 2;
          for (let y = 0; y < canvas.height - regionSize; y += step) {
            for (let x = 0; x < canvas.width - regionSize; x += step) {
              const regionData = ctx.getImageData(x, y, regionSize, regionSize);
              let regionBrightness = 0, regionHotspots = 0;
              for (let i = 0; i < regionData.data.length; i += 4) {
                const brightness = (regionData.data[i] + regionData.data[i + 1] + regionData.data[i + 2]) / 3;
                regionBrightness += brightness;
                if (brightness > 230) regionHotspots++;
              }
              const avgRegionBrightness = regionBrightness / (regionSize * regionSize);
              const regionHotspotRatio = regionHotspots / (regionSize * regionSize);
              if (avgRegionBrightness > 220 || regionHotspotRatio > 0.1) {
                contourCtx.strokeStyle = '#EF4444';
                contourCtx.strokeRect(x, y, regionSize, regionSize);
              } else if (avgRegionBrightness > 190 || regionHotspotRatio > 0.05) {
                contourCtx.strokeStyle = '#F97316';
                contourCtx.strokeRect(x, y, regionSize, regionSize);
              } else if (avgRegionBrightness > 160) {
                contourCtx.strokeStyle = '#FBBF24';
                contourCtx.strokeRect(x, y, regionSize, regionSize);
              }
            }
          }
          const maskCanvas = document.createElement('canvas');
          const maskCtx = maskCanvas.getContext('2d');
          maskCanvas.width = canvas.width;
          maskCanvas.height = canvas.height;
          const maskImageData = maskCtx.createImageData(canvas.width, canvas.height);
          const maskData = maskImageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness > 230) {
              maskData[i] = 255; maskData[i + 1] = 0; maskData[i + 2] = 0;
            } else if (brightness > 190) {
              maskData[i] = 255; maskData[i + 1] = 165; maskData[i + 2] = 0;
            } else if (brightness > 160) {
              maskData[i] = 255; maskData[i + 1] = 255; maskData[i + 2] = 0;
            } else {
              maskData[i] = brightness; maskData[i + 1] = brightness; maskData[i + 2] = brightness;
            }
            maskData[i + 3] = 255;
          }
          maskCtx.putImageData(maskImageData, 0, 0);
          let flareClass = 'No Flare', confidence = 0.70;
          const intensityScore = (extremeRatio * 10) + (hotspotRatio * 5) + (veryBrightRatio * 2) + (brightRatio);
          const variabilityScore = stdDev / 255;
          const combinedScore = intensityScore + variabilityScore;
          if (combinedScore > 0.8 || extremeRatio > 0.05) {
            flareClass = 'X-Class';
            confidence = Math.min(0.95, 0.80 + combinedScore * 0.15);
          } else if (combinedScore > 0.4 || hotspotRatio > 0.03) {
            flareClass = 'M-Class';
            confidence = Math.min(0.90, 0.75 + combinedScore * 0.15);
          } else if (combinedScore > 0.2 || veryBrightRatio > 0.08) {
            flareClass = 'C-Class';
            confidence = Math.min(0.85, 0.70 + combinedScore * 0.15);
          } else if (combinedScore > 0.1 || brightRatio > 0.15) {
            flareClass = 'B-Class';
            confidence = Math.min(0.80, 0.65 + combinedScore * 0.15);
          }
          resolve({
            original: imageSrc, contours: contourCanvas.toDataURL(), mask: maskCanvas.toDataURL(),
            prediction: {
              class: flareClass, confidence: confidence, brightRatio: brightRatio, veryBrightRatio: veryBrightRatio,
              hotspotRatio: hotspotRatio, extremeRatio: extremeRatio, avgBrightness: avgBrightness, stdDev: stdDev,
              intensityScore: intensityScore, hotspots: hotspots, extremeHotspots: extremeHotspots, totalPixels: totalPixels
            }
          });
        } catch (error) {
          console.error("Image analysis error:", error);
          resolve({ original: imageSrc, contours: imageSrc, mask: imageSrc, prediction: { class: 'Analysis Error', confidence: 0, error: error.message } });
        }
      };
      img.onerror = () => {
        resolve({ original: imageSrc, contours: imageSrc, mask: imageSrc, prediction: { class: 'Image Load Error', confidence: 0 } });
      };
      img.src = imageSrc;
    });
  }, []);

  useEffect(() => {
    if (!uploadedImage) return;
    const processImage = async () => {
      setIsLoading(true);
      setPrediction("Analyzing solar activity patterns...");
      try {
        const results = await analyzeImage(uploadedImage);
        setProcessed({ original: results.original, contours: results.contours, mask: results.mask });
        if (results.prediction.error) {
          setPrediction(`Analysis Error: ${results.prediction.error}`);
        } else {
          const pred = results.prediction;
          const analysisText = `CLASSIFICATION: ${pred.class} (${(pred.confidence * 100).toFixed(1)}% confidence)\n\n` + `BRIGHTNESS ANALYSIS:\n` + `• Average: ${pred.avgBrightness.toFixed(1)}/255\n` + `• Standard Deviation: ${pred.stdDev.toFixed(1)}\n` + `• Bright Pixels (>160): ${(pred.brightRatio * 100).toFixed(1)}%\n` + `• Very Bright (>200): ${(pred.veryBrightRatio * 100).toFixed(1)}%\n` + `• Hotspots (>230): ${pred.hotspots}\n` + `• Extreme Hotspots (>245): ${pred.extremeHotspots}\n\n` + `INTENSITY METRICS:\n` + `• Composite Score: ${pred.intensityScore.toFixed(3)}\n` + `• Total Pixels: ${pred.totalPixels.toLocaleString()}`;
          setPrediction(analysisText);
        }
      } catch (error) {
        console.error("Image processing error:", error);
        setPrediction("Image processing failed. Please try a different image.");
        setProcessed({ original: uploadedImage, contours: uploadedImage, mask: uploadedImage });
      }
      setIsLoading(false);
    };
    processImage();
  }, [uploadedImage, analyzeImage]);

  return (
    <div className="w-full">
      <style jsx>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .fade-in { animation: fadeIn 0.6s ease-out; } `}</style>
      <div className="fade-in">
        <div className="text-center mb-8 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">Solar Flare Analysis Results</h3>
          {isLoading ? (<div className="flex items-center justify-center space-x-3"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div><p className="text-white text-lg">Analyzing solar activity...</p></div>) : (<div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600 max-w-2xl mx-auto"><pre className="text-green-400 text-left text-sm font-mono whitespace-pre-wrap overflow-x-auto">{prediction || "Analysis complete - check results below"}</pre></div>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <ImagePanel src={processed.original} title="Original Image" isLoading={isLoading} />
          <ImagePanel src={processed.contours} title="Feature Detection" isLoading={isLoading} />
          <ImagePanel src={processed.mask} title="Brightness Analysis" isLoading={isLoading} />
        </div>
        <div className="mt-8 text-center">
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-600 max-w-2xl mx-auto">
            <p className="text-sm text-gray-400 mb-2"><strong className="text-yellow-400">Feature Detection Legend:</strong></p>
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded">Red: Extreme Activity</span>
              <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Orange: High Activity</span>
              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Yellow: Moderate Activity</span>
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <button onClick={onBack} className="py-3 px-8 bg-gray-600 text-white rounded-full font-bold shadow-md hover:bg-gray-500 transition-all duration-300 transform hover:scale-105">← Analyze Another Image</button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APPLICATION COMPONENT ---
export default function SolarFlareApp() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (uploadedImage?.preview) {
        URL.revokeObjectURL(uploadedImage.preview);
      }
    };
  }, [uploadedImage]);

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      if (uploadedImage?.preview) {
        URL.revokeObjectURL(uploadedImage.preview);
      }
      const imageObject = { file, preview: URL.createObjectURL(file) };
      setUploadedImage(imageObject);
    } else {
      alert('Please select a valid image file (PNG, JPG, GIF, WEBP)');
    }
  };

  const handleRemoveImage = () => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);
  };
  
  const handleBrowseClick = () => fileInputRef.current?.click();
  const handleFileInputChange = (e) => handleFile(e.target.files?.[0]);
  const handleAnalyzeClick = () => { if (uploadedImage) setIsAnalyzing(true); };
  const handleBackToUpload = () => { setIsAnalyzing(false); };

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) { setIsDragging(false); } };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="bg-gray-900 text-white p-4 sm:p-8 min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-4">Solar Flare Classifier</h1>
          <p className="text-xl text-gray-300">AI-powered solar activity analysis using computer vision</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          {isAnalyzing ? (
            <SolarImageProcessor uploadedImage={uploadedImage?.preview} onBack={handleBackToUpload} />
          ) : !uploadedImage ? (
            <div onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onClick={handleBrowseClick} className={`group w-full max-w-3xl mx-auto p-12 text-center border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ease-in-out ${isDragging ? 'border-yellow-400 bg-gray-800 scale-105 shadow-2xl shadow-yellow-500/20' : 'border-gray-600 bg-gray-900/50 hover:border-yellow-500 hover:bg-gray-800'}`}>
              <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept="image/*" className="hidden" />
              <div className="flex flex-col items-center justify-center space-y-6 pointer-events-none">
                <UploadIcon />
                <div>
                  <p className="text-2xl font-semibold text-white mb-2">Drop your solar image here</p>
                  <p className="text-gray-400 text-lg">or <span className="font-semibold text-yellow-400">click to browse</span></p>
                  <p className="text-sm text-gray-500 mt-4">Supports: PNG, JPG, GIF, WEBP • Max size: 10MB</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto p-6 text-center bg-gray-800/50 border border-gray-700 rounded-2xl relative shadow-2xl shadow-black/30">
              <div className="relative">
                <img src={uploadedImage.preview} alt="Solar image preview" className="w-full h-auto max-h-[60vh] object-contain rounded-xl shadow-lg" />
                <button onClick={handleRemoveImage} className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white rounded-full p-2 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-all duration-300" aria-label="Remove image">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="mt-6 flex flex-col items-center gap-4">
                <p className="text-white truncate font-mono text-sm max-w-full" title={uploadedImage.file?.name}>{uploadedImage.file?.name}</p>
                <button onClick={handleAnalyzeClick} className="py-3 px-10 bg-yellow-500 text-gray-900 rounded-full font-bold shadow-lg shadow-yellow-500/20 hover:bg-yellow-400 hover:scale-105 transform transition-all duration-300 ease-in-out">Analyze Flare Activity</button>
              </div>
            </div>
          )}
        </div>
        <section className="py-12 mt-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6 text-yellow-400">Live Solar Activity Monitor</h2>
            <div className="bg-black/20 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-gray-700 shadow-lg h-80 relative">
              <XrayFluxChart />
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>Solar flare classes: A (background) → B → C → M → X (most intense)</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

