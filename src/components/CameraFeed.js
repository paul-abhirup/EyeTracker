import React, { useRef, useEffect, useState, useCallback } from "react";
import { loadModels, detectFaces } from "../utils/faceDetection";

const CameraFeed = ({ isWorkSession }) => {
  const videoRef = useRef(null);
  const [isFocused, setIsFocused] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const alertTimeoutRef = useRef(null);

  const EAR_THRESHOLD = 0.2;

  // EAR (Eye Aspect Ratio) calculation
  const getEAR = (eye) => {
    console.log("Eye Points for EAR Calculation:", eye);

    if (!eye || eye.length !== 6) {
      console.error("Invalid eye points:", eye);
      return 0;
    }

    const A = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
    const B = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
    const C = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);

    const ear = (A + B) / (2 * C);
    console.log("EAR:", ear);

    return ear;
  };

  const triggerAlert = useCallback(() => {
    if (!alertTimeoutRef.current) {
      setAlertMessage("Stay focused! 😊");
      alertTimeoutRef.current = setTimeout(() => {
        setAlertMessage("");
        alertTimeoutRef.current = null;
      }, 5000);
    }
  }, []);

  useEffect(() => {
    if (!isWorkSession) {
      setIsFocused(true); // Reset focus state during breaks
      setAlertMessage(""); // Clear any alerts
    }
  }, [isWorkSession]);

  const detectFacesLoop = useCallback(async () => {
    if (!isWorkSession) {
      console.log("Not in work session, skipping detection");
      requestAnimationFrame(detectFacesLoop);
      return;
    }

    if (!videoRef.current || !modelsLoaded) {
      console.log("Skipping detection: Camera not ready or models not loaded");
      requestAnimationFrame(detectFacesLoop);
      return;
    }

    try {
      console.log("Detecting faces...");
      const detections = await detectFaces(videoRef.current);
      console.log("Detections from detectFaces:", detections);

      if (detections && detections.length > 0) {
        console.log("Faces detected:", detections.length);
        const landmarks = detections[0].landmarks;
        console.log("Landmarks:", landmarks);

        if (landmarks && landmarks.getLeftEye && landmarks.getRightEye) {
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          console.log("Left Eye Points:", leftEye);
          console.log("Right Eye Points:", rightEye);

          const leftEAR = getEAR(leftEye);
          const rightEAR = getEAR(rightEye);
          const avgEAR = (leftEAR + rightEAR) / 2;

          console.log("Left EAR:", leftEAR);
          console.log("Right EAR:", rightEAR);
          console.log("Average EAR:", avgEAR);

          if (avgEAR < EAR_THRESHOLD) {
            setIsFocused(false); // User not focused
            triggerAlert();
          } else {
            setIsFocused(true); // User focused
          }
        } else {
          console.log("Landmarks not available");
        }
      } else {
        console.log("No faces detected");
        setIsFocused(false);
        triggerAlert();
      }
    } catch (error) {
      console.error("Error in face detection:", error);
    }

    requestAnimationFrame(detectFacesLoop);
  }, [isWorkSession, modelsLoaded, triggerAlert]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Start camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log("Webcam feed is ready");
            videoRef.current.play();

            // Load models
            console.log("Loading models...");
            loadModels().then(() => {
              console.log("Models loaded successfully");
              setModelsLoaded(true);

              // Start detection loop
              // Add a small delay before starting the detection loop
              setTimeout(() => {
                console.log("Starting detection loop...");
                detectFacesLoop();
              }, 500); // 500ms delay
            });
          };
        }
      } catch (error) {
        console.error("Error initializing camera or loading models:", error);
      }
    };

    initialize();
  }, [detectFacesLoop]);

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline muted />
      <p>{isFocused ? "Focused 😊" : "Not Focused 😴"}</p>
      {alertMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px",
            backgroundColor: "yellow",
            border: "1px solid black",
          }}
        >
          {alertMessage}
        </div>
      )}
    </div>
  );
};

export default React.memo(CameraFeed);
