import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { toast } from 'react-toastify';

const Checkout = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [sending, setSending] = useState(false); // Prevent multiple sends

  useEffect(() => {
    loadModels();
    startCamera();
  }, []);

  const loadModels = async () => {
    const MODEL_URL = '/models'; // Adjust path to your face-api.js models
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      toast.success('Face detection models loaded!');
    } catch (err) {
      console.error('Error loading models:', err);
      toast.error('Failed to load models');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Error accessing the camera:', err);
      toast.error('Unable to access camera');
    }
  };

  const detectFaces = async () => {
    if (!modelsLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };

    // Match canvas to video dimensions
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Draw bounding boxes
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

      resizedDetections.forEach((detection) => {
        const { box } = detection.detection;

        // Draw bounding box around detected face
        context.strokeStyle = 'green'; // Green for detected face
        context.lineWidth = 2;
        context.strokeRect(box.x, box.y, box.width, box.height);

        // Capture and send face image to backend if face detected
        if (!sending) {
          captureAndSendFaceImage(box);
        }
      });
    }, 5000); // Run detection every 5 seconds
  };

  // Capture the video frame and send the face image to backend
  const captureAndSendFaceImage = (box) => {
    setSending(true); // Set sending flag to prevent multiple calls

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    // Set canvas to match video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Crop the face from the canvas using the bounding box
    const faceImageData = context.getImageData(box.x, box.y, box.width, box.height);
    
    // Create a new canvas to hold the cropped face image
    const faceCanvas = document.createElement('canvas');
    const faceContext = faceCanvas.getContext('2d');
    faceCanvas.width = box.width;
    faceCanvas.height = box.height;
    faceContext.putImageData(faceImageData, 0, 0);

    // Convert the cropped face to JPEG format
    faceCanvas.toBlob(
      async (blob) => {
        if (blob) {
          // Create form data to send to backend
          const formData = new FormData();
          formData.append('image', blob, 'face-image.jpg'); // Append image as 'face-image.jpg'
        //   console.log(blob);
        formData.forEach(val => console.log(val))

          // Send image to backend
        //   try {
        //     const response = await axios.post('http://localhost:8000/api/recognize', formData, {
        //       headers: { 'Content-Type': 'multipart/form-data' },
        //     });
        //     toast.success(`Person recognized: ${response.data.name}`);
        //   } catch (err) {
        //     console.error('Error sending image to backend:', err);
        //     toast.error('Failed to send image.');
        //   } finally {
        //     setSending(false); // Reset sending flag after request
        //   }
        }
      },
      'image/jpeg',
      0.9 // Quality of the image (0.0 to 1.0)
    );
  };

  return (
    <div className="camera-container" style={{ position: 'relative' }}>
      <div className="container">
        <video
            ref={videoRef}
            autoPlay
            muted
            onPlay={detectFaces}
            style={{
            width: '100%',
            maxWidth: '640px',
            borderRadius: '8px',
            border: '2px solid #ccc',
            }}
        />
        <canvas
            ref={canvasRef}
            style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            maxWidth: '640px',
            zIndex: 1, // Ensure canvas is on top of video for drawing
            }}
        />
      </div>
    </div>
  );
};

export default Checkout;
