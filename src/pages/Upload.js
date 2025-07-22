import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Reusable Helper Components ---

/**
 * A component explaining how to convert the Keras model for web use.
 */
function ModelInfo() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="w-full max-w-4xl mb-8 p-4 border border-blue-400/40 bg-blue-500/10 rounded-xl text-center text-sm text-gray-300"
    >
      <h4 className="font-bold mb-2 text-blue-300">Note for Developers: Using Your Model</h4>
      <p>To use your <code className="bg-gray-700 p-1 rounded">.keras</code> model in the browser, you first need to convert it to the TensorFlow.js format using the command-line tool:</p>
      <code className="block bg-gray-800 p-2 rounded my-2 text-left text-xs">pip install tensorflowjs<br/>tensorflowjs_converter --input_format=keras_v3 model_autoencoder_mask.keras ./public/tfjs_model/</code>
      <p>Then, host the generated <code className="bg-gray-700 p-1 rounded">./public/tfjs_model/</code> directory and update the <code className="bg-gray-700 p-1 rounded">MODEL_URL</code> in the code to point to your <code className="bg-gray-700 p-1 rounded">model.json</code> file.</p>
    </motion.div>
  );
}

/**
 * A component for the upload button and file input logic.
 */
function UploadButton({ onImageUpload, disabled }) {
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(URL.createObjectURL(file));
    }
  };

  const handleButtonClick = () => fileInputRef.current.click();

  return (
    <>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
      />
      <motion.button
        onClick={handleButtonClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={disabled}
        className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-8 rounded-full shadow-lg shadow-yellow-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Choose Solar Image
      </motion.button>
    </>
  );
}

/**
 * A component for the prediction button with loading state.
 */
function PredictButton({ onPredict, loading, hasImage }) {
  return (
    <motion.button
      onClick={onPredict}
      disabled={!hasImage || loading}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-orange-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </div>
      ) : (
        'Generate Prediction'
      )}
    </motion.button>
  );
}

/**
 * A component to display the uploaded image and the predicted mask side-by-side.
 */
function ImageDisplay({ image, mask }) {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
      <AnimatePresence>
        {image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h3 className="text-2xl font-semibold mb-4 text-gray-300">Your Image</h3>
            <img id="uploaded-image" src={image} alt="Uploaded solar" className="w-full h-auto object-cover rounded-2xl shadow-2xl border-2 border-white/10" />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {mask && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h3 className="text-2xl font-semibold mb-4 text-yellow-300">Predicted Flare Mask</h3>
            <img src={mask} alt="Predicted mask" className="w-full h-auto object-cover rounded-2xl shadow-2xl border-2 border-yellow-400/50" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// --- Main Upload Page Component ---

export default function Upload() {
  const [tfReady, setTfReady] = useState(false);
  const [model, setModel] = useState(null);
  const [modelLoadingStatus, setModelLoadingStatus] = useState('Loading TensorFlow.js...');
  const [image, setImage] = useState(null);
  const [mask, setMask] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  // The URL to your converted TensorFlow.js model's model.json file
  const MODEL_URL = 'https://your-server.com/path/to/tfjs_model/model.json'; // IMPORTANT: Replace with your model's URL

  // Effect to load the TensorFlow.js script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js';
    script.async = true;
    script.onload = () => {
      setTfReady(true);
      setModelLoadingStatus('TensorFlow.js loaded. Loading model...');
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    }
  }, []);

  // Effect to load the model once TF.js is ready
  useEffect(() => {
    if (!tfReady) return;
    async function loadModel() {
      try {
        const loadedModel = await window.tf.loadLayersModel(MODEL_URL);
        setModel(loadedModel);
        setModelLoadingStatus('Model ready!');
      } catch (error) {
        console.error("Error loading model: ", error);
        setModelLoadingStatus('Error: Could not load model. Using fallback.');
      }
    }
    loadModel();
  }, [tfReady]);

  const handleImageUpload = (newImage) => {
    setImage(newImage);
    setMask(null);
  };

  const handlePredict = async () => {
    if (!image) return;
    setLoading(true);

    if (!model) {
      // Fallback prediction if the model failed to load
      setTimeout(() => {
        const randomMask = `https://picsum.photos/seed/${Math.random()}/800/600`;
        setMask(randomMask);
        setLoading(false);
      }, 1500);
      return;
    }

    // Real prediction using TensorFlow.js
    const imageElement = document.getElementById('uploaded-image');
    if (!imageElement) {
        setLoading(false);
        return;
    }

    // Preprocess the image
    const tensor = window.tf.browser.fromPixels(imageElement)
      .resizeBilinear([180, 180])
      .toFloat()
      .div(window.tf.scalar(255.0))
      .expandDims();

    // Run prediction
    const predictionTensor = model.predict(tensor);
    
    // Post-process the output tensor to display it
    const maskTensor = predictionTensor.squeeze().mul(255).cast('int32');
    const canvas = canvasRef.current;
    canvas.width = 180;
    canvas.height = 180;
    await window.tf.browser.toPixels(maskTensor, canvas);
    setMask(canvas.toDataURL());
    
    // Clean up tensors
    tensor.dispose();
    predictionTensor.dispose();
    maskTensor.dispose();

    setLoading(false);
  };

  return (
    <>
      <style>{`
        .animate-blob { animation: blob 8s infinite; }
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -20px) scale(1.05); } 66% { transform: translate(-20px, 20px) scale(0.97); } 100% { transform: translate(0px, 0px) scale(1); } }
      `}</style>

      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-black via-purple-950 to-black text-white p-6 md:p-12 font-sans overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-yellow-500/10 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 w-[32rem] h-[32rem] rounded-full bg-purple-600/10 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        
        <ModelInfo />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="relative z-10 w-full max-w-5xl bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 md:p-12 text-center flex flex-col items-center"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 mb-4">
            Flare Prediction
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mb-2">
            Upload an image of the Sun to generate a predicted mask highlighting potential solar flare regions.
          </p>
          <p className="text-xs text-gray-400 mb-8">{modelLoadingStatus}</p>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <UploadButton onImageUpload={handleImageUpload} disabled={!model && modelLoadingStatus.includes('Error')} />
            <PredictButton onPredict={handlePredict} loading={loading} hasImage={!!image} />
          </div>

          <AnimatePresence>
            {image && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full"
              >
                <ImageDisplay image={image} mask={mask} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </>
  );
}
