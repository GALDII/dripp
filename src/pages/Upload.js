import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- PARTICLE SYSTEM COMPONENT ---
function ParticleField() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const particleCount = 150;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.6 + 0.1,
      pulsePhase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.7 ? '#FBBF24' : '#FCD34D'
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.pulsePhase += 0.02;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        const pulse = Math.sin(particle.pulsePhase) * 0.3 + 0.7;
        const currentOpacity = particle.opacity * pulse;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        const alphaHex = Math.floor(currentOpacity * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = particle.color + alphaHex;
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0" 
      style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)' }}
    />
  );
}


// --- ENHANCED CHART COMPONENT ---
function XrayFluxChart() {
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const svgRef = useRef(null);

  const generateMockData = useCallback(() => {
    const now = new Date();
    const data = [];
    for (let i = 0; i < 144; i++) {
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

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setIsAnimating(true);
      const response = await fetch("http://localhost:3001/api/solar-data");
      if (!response.ok) throw new Error(`Proxy server returned status ${response.status}`);
      const liveData = await response.json();
      if (!Array.isArray(liveData) || liveData.length === 0) throw new Error("Live data is empty or invalid");
      
      const processedData = liveData
        .filter(d => d.energy === '0.1-0.8nm' && d.flux > 0)
        .map(d => {
          const flux = Math.max(1e-9, d.flux);
          return {
            time: new Date(d.time_tag).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false }),
            flux: flux,
            logFlux: Math.log10(flux)
          };
        });
      
      if (processedData.length === 0) throw new Error("No valid X-ray flux data found in live feed.");
      setChartData(processedData);
      setLastUpdated(new Date().toLocaleTimeString());
      
    } catch (e) {
      console.error("Live data fetch failed:", e.message);
      const mockData = generateMockData();
      setChartData(mockData);
      setError("Live data unavailable - using simulated data");
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setTimeout(() => setIsAnimating(false), 2000);
    }
  }, [generateMockData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);
  
  const chartWidth = 900;
  const chartHeight = 350;
  const padding = { top: 30, right: 50, bottom: 80, left: 80 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const minLogFlux = -9;
  const maxLogFlux = -2;

  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * plotWidth;
    const normalizedLog = (d.logFlux - minLogFlux) / (maxLogFlux - minLogFlux);
    const y = plotHeight - (normalizedLog * plotHeight);
    return { x: x + padding.left, y: y + padding.top, flux: d.flux, time: d.time };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const handleMouseMove = (event) => {
    if (!svgRef.current || points.length === 0) return;
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    
    const inverted = svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());
    const relativeX = inverted.x - padding.left;
    
    let closestPointIndex = Math.round((relativeX / plotWidth) * (points.length - 1));
    closestPointIndex = Math.max(0, Math.min(points.length - 1, closestPointIndex));
    
    setHoveredPoint(points[closestPointIndex]);
  };

  const handleMouseLeave = () => setHoveredPoint(null);

  if (!chartData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-yellow-400 border-r-yellow-400"></div>
          <div className="absolute inset-2 animate-pulse rounded-full bg-yellow-400/20"></div>
        </div>
        <p className="text-yellow-400 mt-4 text-lg font-medium">Connecting to Solar Observatory...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full group">
      <style>{`
        .chart-line {
          stroke-dasharray: 3000;
          stroke-dashoffset: 3000;
          animation: draw-line 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.4));
        }
        .chart-area {
          opacity: 0;
          animation: fade-in-area 2s ease-out 1s forwards;
        }
        .grid-line {
          opacity: 0;
          animation: fade-in-grid 1s ease-out 0.5s forwards;
        }
        .chart-point {
          transform-origin: center;
          animation: scale-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        @keyframes draw-line {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fade-in-area {
          to { opacity: 1; }
        }
        @keyframes fade-in-grid {
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.4)); }
          50% { filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.8)); }
        }
        .tooltip-enter {
          animation: tooltip-slide-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        @keyframes tooltip-slide-in {
          from { opacity: 0; transform: translateY(10px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/50 shadow-2xl"></div>
      
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        className="relative z-10 overflow-visible cursor-crosshair transition-all duration-300 group-hover:scale-[1.02]" 
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <pattern id="advanced-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(251, 191, 36, 0.15)" strokeWidth="0.5"/>
            <circle cx="0" cy="0" r="1" fill="rgba(251, 191, 36, 0.3)"/>
          </pattern>
          <linearGradient id="area-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.6"/>
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.1"/>
          </linearGradient>
          <linearGradient id="line-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#FEF3C7"/>
            <stop offset="50%" stopColor="#FBBF24"/>
            <stop offset="100%" stopColor="#F59E0B"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="text-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <rect width={plotWidth} height={plotHeight} x={padding.left} y={padding.top} fill="url(#advanced-grid)" className="grid-line" />
        
        {['A', 'B', 'C', 'M', 'X'].map((label, i) => {
          const y = padding.top + plotHeight - (i / 4) * plotHeight;
          const intensity = ['A', 'B', 'C', 'M', 'X'].indexOf(label);
          const color = intensity <= 1 ? '#10B981' : intensity <= 2 ? '#FBBF24' : intensity <= 3 ? '#F97316' : '#EF4444';
          return (
            <g key={label} className="grid-line" style={{ animationDelay: `${i * 0.1}s` }}>
              <line x1={padding.left - 8} y1={y} x2={chartWidth - padding.right} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
              <circle cx={padding.left - 20} cy={y} r="6" fill={color} opacity="0.8" filter="url(#glow)" />
              <text x={padding.left - 20} y={y + 4} textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" filter="url(#text-glow)">{label}</text>
            </g>
          );
        })}
        
        {chartData.filter((_, i) => i > 0 && i % Math.floor(chartData.length / 8) === 0).map((d, i) => {
          const index = (i + 1) * Math.floor(chartData.length / 8);
          const x = padding.left + (index / (chartData.length - 1)) * plotWidth;
          return (
            <g key={i} className="grid-line" style={{ animationDelay: `${i * 0.05}s` }}>
              <line x1={x} y1={chartHeight - padding.bottom + 5} x2={x} y2={padding.top} stroke="rgba(255,255,255,0.05)" strokeDasharray="2,4" />
              <text x={x} y={chartHeight - padding.bottom + 25} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="11" fontWeight="500">{d.time}</text>
            </g>
          );
        })}
        
        <path 
          d={`${pathData} L ${points[points.length - 1]?.x || 0} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`} 
          fill="url(#area-gradient)" 
          className="chart-area"
        />
        
        <path 
          d={pathData} 
          fill="none" 
          stroke="url(#line-gradient)" 
          strokeWidth="3" 
          className="chart-line"
          filter="url(#glow)"
        />
        
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#FBBF24"
            stroke="#FEF3C7"
            strokeWidth="2"
            className="chart-point opacity-0"
            style={{ 
              animationDelay: `${2 + (i * 0.01)}s`,
              filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.6))'
            }}
          />
        ))}
        
        <text x={chartWidth / 2} y={chartHeight - 15} textAnchor="middle" fill="#FBBF24" fontSize="14" fontWeight="600" filter="url(#text-glow)">Time (UTC)</text>
        <text x={25} y={chartHeight / 2} textAnchor="middle" fill="#FBBF24" fontSize="14" fontWeight="600" transform={`rotate(-90, 25, ${chartHeight / 2})`} filter="url(#text-glow)">Solar Flare Intensity</text>

        {hoveredPoint && (
          <g className="tooltip tooltip-enter" style={{ pointerEvents: 'none' }}>
            <line 
              x1={hoveredPoint.x} 
              y1={padding.top} 
              x2={hoveredPoint.x} 
              y2={chartHeight - padding.bottom} 
              stroke="rgba(251, 191, 36, 0.7)" 
              strokeWidth="2" 
              strokeDasharray="5,5"
              filter="url(#glow)"
            />
            <circle 
              cx={hoveredPoint.x} 
              cy={hoveredPoint.y} 
              r="8" 
              fill="#FBBF24" 
              stroke="#FEF3C7" 
              strokeWidth="3"
              filter="url(#glow)"
              className="animate-pulse"
            />
            
            <g transform={`translate(${Math.min(hoveredPoint.x + 15, chartWidth - 120)}, ${Math.max(hoveredPoint.y - 60, 20)})`}>
              <rect x="0" y="0" width="110" height="55" rx="8" fill="rgba(17, 24, 39, 0.95)" stroke="rgba(251, 191, 36, 0.8)" strokeWidth="2" filter="url(#glow)" />
              <text x="15" y="22" fill="#FFFFFF" fontSize="13" fontWeight="600">{hoveredPoint.time} UTC</text>
              <text x="15" y="42" fill="#FBBF24" fontSize="13" fontWeight="bold">{hoveredPoint.flux.toExponential(1)} W/m²</text>
            </g>
          </g>
        )}
        
        <g transform={`translate(${chartWidth - 60}, 30)`}>
          <circle cx="0" cy="0" r="6" fill="#10B981" className="animate-pulse">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
          </circle>
          <text x="15" y="5" fill="#10B981" fontSize="12" fontWeight="600">LIVE</text>
        </g>
      </svg>
      
      {error && (
        <div className="absolute top-4 right-4 bg-orange-500/20 backdrop-blur-md text-orange-300 px-4 py-2 rounded-xl text-sm border border-orange-400/30 shadow-lg animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {lastUpdated && (
        <div className="absolute bottom-4 right-4 bg-gray-800/60 backdrop-blur-md text-gray-300 px-3 py-1 rounded-lg text-xs border border-gray-600/50">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span>Updated: {lastUpdated}</span>
          </div>
        </div>
      )}
      
      <button 
        onClick={fetchData}
        disabled={isAnimating}
        className="absolute top-4 left-4 bg-yellow-500/20 backdrop-blur-md hover:bg-yellow-500/30 text-yellow-400 p-3 rounded-xl border border-yellow-500/30 transition-all duration-300 hover:scale-110 disabled:opacity-50 group"
      >
        <svg className={`w-5 h-5 ${isAnimating ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
}

// --- ENHANCED IMAGE PANELS ---
const ImagePanel = ({ src, title, isLoading }) => (
  <div className="text-center group">
    <h3 className="text-2xl font-semibold mb-6 text-yellow-400 relative">
      {title}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-60"></div>
    </h3>
    <div className="relative w-full h-60 md:h-80 bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-600/50 shadow-2xl group-hover:shadow-yellow-500/20 transition-all duration-500">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-yellow-400 border-r-yellow-400"></div>
            <div className="absolute inset-2 animate-pulse rounded-full bg-yellow-400/20"></div>
          </div>
          <div className="text-yellow-400 font-medium text-lg">Processing...</div>
          <div className="w-32 h-1 bg-gray-700 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      ) : src ? (
        <div className="relative h-full group">
          <img 
            src={src} 
            alt={title} 
            className="w-full h-full object-contain transition-all duration-500 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span>No image available</span>
          </div>
        </div>
      )}
    </div>
  </div>
);

// --- ENHANCED UPLOAD ZONE ---
const UploadIcon = () => (
  <div className="relative">
    <svg className="w-20 h-20 mx-auto text-gray-500 transition-all duration-500 group-hover:text-yellow-400 group-hover:scale-110" stroke="currentColor" fill="none" viewBox="0 0 48 48">
      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  </div>
);

// --- ENHANCED SOLAR IMAGE PROCESSOR ---
function SolarImageProcessor({ uploadedImage, onBack }) {
  const [processed, setProcessed] = useState({ original: null, contours: null, mask: null });
  const [isLoading, setIsLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const analyzeImage = useCallback(async (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const progressSteps = [
            { progress: 20, message: "Loading image data..." },
            { progress: 40, message: "Analyzing brightness patterns..." },
            { progress: 60, message: "Detecting solar features..." },
            { progress: 80, message: "Classifying flare intensity..." },
            { progress: 100, message: "Finalizing results..." }
          ];
          
          let currentStep = 0;
          const runAnalysis = () => {
            if (currentStep < progressSteps.length) {
              setAnalysisProgress(progressSteps[currentStep].progress);
              setPrediction(progressSteps[currentStep].message);
              currentStep++;
              setTimeout(runAnalysis, 400);
            } else {
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
            }
          };
          runAnalysis();
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
      const results = await analyzeImage(uploadedImage);
      // Final result is an object now, not a string
      setPrediction(results.prediction);
      setProcessed({ original: results.original, contours: results.contours, mask: results.mask });
      setIsLoading(false);
    };
    processImage();
  }, [uploadedImage, analyzeImage]);

  return (
    <div className="w-full">
      <style jsx>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .fade-in { animation: fadeIn 0.6s ease-out; } `}</style>
      <div className="fade-in">
        <AnalysisResults isLoading={isLoading} prediction={prediction} progress={analysisProgress} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mt-8">
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

// --- NEW: ANALYSIS RESULTS DASHBOARD ---
function AnalysisResults({ isLoading, prediction, progress }) {
  const [animatedStats, setAnimatedStats] = useState({});

  useEffect(() => {
    if (!isLoading && prediction && typeof prediction === 'object') {
      const statsToAnimate = {
        confidence: prediction.confidence * 100,
        avgBrightness: prediction.avgBrightness,
        stdDev: prediction.stdDev,
        hotspots: prediction.hotspots,
        intensityScore: prediction.intensityScore
      };

      const animationDuration = 1500; // ms
      let startTimestamp = null;

      const animate = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        const currentStats = {};
        for (const key in statsToAnimate) {
          currentStats[key] = statsToAnimate[key] * progress;
        }
        setAnimatedStats(currentStats);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isLoading, prediction]);

  const getFlareClassColor = (flareClass) => {
    switch (flareClass) {
      case 'X-Class': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'M-Class': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'C-Class': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'B-Class': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-gray-600/20 text-gray-300 border-gray-600/50';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center mb-8 bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-700">
        <h3 className="text-2xl font-bold text-yellow-400 mb-4">Solar Flare Analysis Results</h3>
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="text-white text-lg">{typeof prediction === 'string' ? prediction : 'Initializing...'}</div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!prediction || typeof prediction !== 'object') {
    return (
      <div className="text-center mb-8 bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
        <h3 className="text-2xl font-bold text-yellow-400">Analysis Complete</h3>
        <p className="text-gray-400 mt-2">No data to display. Please try another image.</p>
      </div>
    );
  }

  const confidence = animatedStats.confidence || 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <div className="text-center mb-8 bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h4 className={`text-3xl font-bold px-4 py-2 rounded-lg border ${getFlareClassColor(prediction.class)}`}>
            {prediction.class}
          </h4>
          <div>
            <svg width="150" height="150" viewBox="0 0 150 150">
              <circle cx="75" cy="75" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="15" fill="transparent"/>
              <circle
                cx="75" cy="75" r={radius}
                stroke="url(#line-gradient)"
                strokeWidth="15"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 75 75)"
                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
              />
              <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="28" fontWeight="bold" fill="#fff">
                {confidence.toFixed(0)}%
              </text>
              <text x="50%" y="65%" textAnchor="middle" dy=".3em" fontSize="12" fill="#9CA3AF">
                Confidence
              </text>
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Avg. Brightness</p>
            <p className="text-2xl font-bold text-white">{(animatedStats.avgBrightness || 0).toFixed(1)}/255</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Intensity Score</p>
            <p className="text-2xl font-bold text-white">{(animatedStats.intensityScore || 0).toFixed(3)}</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Hotspots (>230)</p>
            <p className="text-2xl font-bold text-white">{(animatedStats.hotspots || 0).toFixed(0)}</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Brightness Std. Dev.</p>
            <p className="text-2xl font-bold text-white">{(animatedStats.stdDev || 0).toFixed(1)}</p>
          </div>
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
      console.warn('Invalid file type selected.');
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
    <div className="relative bg-gray-900 text-white p-4 sm:p-8 min-h-screen w-full overflow-hidden">
      <ParticleField />
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 mb-4" style={{ filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.4))' }}>
            Solar Flare Classifier
          </h1>
          <p className="text-xl text-gray-300">
            AI-powered solar activity analysis using real-time computer vision
          </p>
        </div>
        <div className="flex flex-col items-center justify-center">
          {isAnalyzing ? (
            <SolarImageProcessor uploadedImage={uploadedImage?.preview} onBack={handleBackToUpload} />
          ) : !uploadedImage ? (
            <div onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onClick={handleBrowseClick} className={`group w-full max-w-3xl mx-auto p-12 text-center border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ease-in-out bg-gray-800/40 backdrop-blur-sm ${isDragging ? 'border-yellow-400 bg-gray-800/60 scale-105 shadow-2xl shadow-yellow-500/20' : 'border-gray-600 hover:border-yellow-500'}`}>
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
            <div className="w-full max-w-3xl mx-auto p-6 text-center bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl relative shadow-2xl shadow-black/30">
              <div className="relative">
                <img src={uploadedImage.preview} alt="Solar image preview" className="w-full h-auto max-h-[60vh] object-contain rounded-xl shadow-lg" />
                <button onClick={handleRemoveImage} className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white rounded-full p-2 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-all duration-300" aria-label="Remove image">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="mt-6 flex flex-col items-center gap-4">
                <p className="text-white truncate font-mono text-sm max-w-full" title={uploadedImage.file?.name}>{uploadedImage.file?.name}</p>
                <button onClick={handleAnalyzeClick} className="py-3 px-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 rounded-full font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-400/40 hover:scale-105 transform transition-all duration-300 ease-in-out">Analyze Flare Activity</button>
              </div>
            </div>
          )}
        </div>
        <section className="py-12 mt-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6 text-yellow-400" style={{ filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.3))' }}>Live Solar Activity Monitor</h2>
            <div className="bg-black/20 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-gray-700 shadow-lg h-96 relative">
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

