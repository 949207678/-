import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import { AppState } from '../types';

export const GestureController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setHandData, setAppState, setTargetRotation, appState } = useStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startWebcam();
      } catch (e) {
        console.error("MediaPipe failed to load", e);
      }
    };

    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
          setLoaded(true);
        }
      }
    };

    const predictWebcam = () => {
      if (!handLandmarker || !videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      // Match canvas size to video
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const startTimeMs = performance.now();
      const results = handLandmarker.detectForVideo(video, startTimeMs);

      if (ctx) {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Mirror effect for natural feeling
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        
        // Optional: Draw landmarks for debug/feedback
        // const drawingUtils = new DrawingUtils(ctx);
        // if (results.landmarks) {
        //   for (const landmarks of results.landmarks) {
        //      drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS);
        //   }
        // }
        ctx.restore();
      }

      // Logic
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // 1. Calculate Center (Palm base 0, Middle Finger MCP 9)
        // Note: X is inverted because of mirror effect usually desired
        const x = 1 - landmarks[9].x; 
        const y = landmarks[9].y;

        // 2. Gesture Detection
        // Fist: Fingertips (4, 8, 12, 16, 20) are close to Wrist (0)
        // Open: Fingertips are far from Wrist
        // Pinch: Thumb Tip (4) close to Index Tip (8)
        
        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

        const isPinching = dist(thumbTip, indexTip) < 0.05;
        
        // Average distance of fingers to wrist
        const avgFingerDist = (
          dist(indexTip, wrist) + dist(middleTip, wrist) + 
          dist(ringTip, wrist) + dist(pinkyTip, wrist)
        ) / 4;

        const isFist = avgFingerDist < 0.25;
        const isOpen = avgFingerDist > 0.4;

        // Update Store
        setHandData({
          x,
          y,
          isPinching,
          isFist,
          isOpen,
          detected: true
        });

        // State Machine
        if (isFist) {
           setAppState(AppState.TREE);
        } else if (isOpen) {
           setAppState(AppState.EXPLODE);
        }

        // Camera Rotation Control (Mapped from X/Y)
        // If open and moving, rotate scene.
        if (isOpen) {
             // Map 0-1 to -PI to PI
             setTargetRotation((y - 0.5) * 2, (x - 0.5) * 4);
        }

      } else {
        setHandData({ detected: false });
      }

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, [setHandData, setAppState, setTargetRotation]);

  return (
    // Hidden container to keep video stream active for AI processing but invisible to user
    <div className="fixed top-0 left-0 w-px h-px opacity-0 pointer-events-none -z-50 overflow-hidden">
       <div className="relative w-32 h-24">
          <video ref={videoRef} className="absolute w-full h-full object-cover transform -scale-x-100" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="absolute w-full h-full object-cover" />
       </div>
    </div>
  );
};