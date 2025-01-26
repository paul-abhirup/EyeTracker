import React, { useRef, useEffect, useState } from "react";
import { loadModels, detectFaces, getEAR } from "../utils/faceDetection";

const CameraFeed = () => {
  const videoRef = useRef(null);
  // const [alert, setAlert] = useState("");
  const [isFocused, setIsFocused] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Eye Aspect Ratio (EAR) threshold for detecting blinks
  const EAR_THRESHOLD = 0.2;

  // Function to trigger alerts
  const triggerAlert = () => {
    setAlertMessage("Stay focused! 😊");
    // const audio = new Audio("/aisa-mat-karo.mp3");
    // audio.play();
    setTimeout(() => setAlertMessage(""), 5000); // Clear alert after 3 seconds
  };

  useEffect(() => {
    const loadModelsAndStartCamera = async () => {
      try {
        //load models
        await loadModels();
        setModelsLoaded(true); // Mark models as loaded

        //start camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // start face detection
        const intervalId = setInterval(async () => {
          if (!videoRef.current || !modelsLoaded) return;

          try {
            const detections = await detectFaces(videoRef.current);

            if (detections && detections.length > 0) {
              const landmarks = detections[0].landmarks;
              if (landmarks && landmarks.getLeftEye && landmarks.getRightEye) {
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();

                const leftEAR = getEAR(leftEye);
                const rightEAR = getEAR(rightEye);
                const avgEAR = (leftEAR + rightEAR) / 2;

                console.log(
                  "Left EAR:",
                  leftEAR,
                  "Right EAR:",
                  rightEAR,
                  "Average EAR:",
                  avgEAR
                );
                // setIsFocused(avgEAR >= EAR_THRESHOLD);

                if (avgEAR < EAR_THRESHOLD) {
                  setIsFocused(false); // User is not focused
                  console.log("Not Focused 😴");
                  triggerAlert(); // Trigger alert
                } else {
                  setIsFocused(true); // User is focused
                  console.log("Focused 😊");
                }
              }
            } else {
              setIsFocused(false); // No faces detected
              console.log("No faces detected");
              triggerAlert(); // Trigger alert
            }
          } catch (error) {
            console.error("Error in face detection:", error);
          }
        }, 500); // 200ms interval

        // Cleanup interval and camera stream on unmount
        return () => {
          clearInterval(intervalId);
          stream.getTracks().forEach((track) => track.stop());
        };
      } catch (error) {
        console.error("Error starting camera:", error);
      }
    };

    loadModelsAndStartCamera();
  }, [modelsLoaded]); // Run this effect only after models are loaded

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

export default CameraFeed;
