import React, { useRef, useEffect, useState, useCallback } from "react";
import { loadModels, detectFaces, getEAR } from "../utils/faceDetection";

const CameraFeed = ({ isWorkSession }) => {
  const videoRef = useRef(null);
  const [isFocused, setIsFocused] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Eye Aspect Ratio (EAR) threshold for detecting blinks
  const EAR_THRESHOLD = 0.2;

  // Function to trigger alerts       //using debouncing to avoid multiple alerts
  let alertTimeout;

  const triggerAlert = () => {
    if (!alertTimeout) {
      setAlertMessage("Stay focused! 😊");
      alertTimeout = setTimeout(() => {
        setAlertMessage("");
        alertTimeout = null;
      }, 5000); // Clear alert after 5 secondslet alertTimeout;
    }
  };

  useEffect(() => {
    // const loadModelsAndStartCamera = async () => {
    //   try {
    //     //load models
    //     await loadModels();
    //     setModelsLoaded(true); // Mark models as loaded

    //     //start camera
    //     const stream = await navigator.mediaDevices.getUserMedia({
    //       video: true,
    //     });
    //     if (videoRef.current) {
    //       videoRef.current.srcObject = stream;
    //     }

    //     // start face detection
    //     const intervalId = setInterval(async () => {
    //       if (!videoRef.current || !modelsLoaded || !isWorkSession) return;

    //       try {
    //         const detections = await detectFaces(videoRef.current);

    //         if (detections && detections.length > 0) {
    //           const landmarks = detections[0].landmarks;
    //           if (landmarks && landmarks.getLeftEye && landmarks.getRightEye) {
    //             const leftEye = landmarks.getLeftEye();
    //             const rightEye = landmarks.getRightEye();

    //             const leftEAR = getEAR(leftEye);
    //             const rightEAR = getEAR(rightEye);
    //             const avgEAR = (leftEAR + rightEAR) / 2;

    //             console.log(
    //               "Left EAR:",
    //               leftEAR,
    //               "Right EAR:",
    //               rightEAR,
    //               "Average EAR:",
    //               avgEAR
    //             );
    //             // setIsFocused(avgEAR >= EAR_THRESHOLD);

    //             if (avgEAR < EAR_THRESHOLD) {
    //               setIsFocused(false); // User is not focused
    //               console.log("Not Focused 😴");
    //               triggerAlert(); // Trigger alert
    //             } else {
    //               setIsFocused(true); // User is focused
    //               console.log("Focused 😊");
    //             }
    //           }
    //         } else {
    //           setIsFocused(false); // No faces detected
    //           console.log("No faces detected");
    //           triggerAlert(); // Trigger alert
    //         }
    //       } catch (error) {
    //         console.error("Error in face detection:", error);
    //       }
    //     }, 1000); // 1000ms interval

    //     // Cleanup interval and camera stream on unmount
    //     return () => {
    //       clearInterval(intervalId);
    //       stream.getTracks().forEach((track) => track.stop());
    //     };
    //   } catch (error) {
    //     console.error("Error starting camera:", error);
    //   }
    // };

    //
    const loadModelsAndStartCamera = async () => {
      try {
        await loadModels();
        setModelsLoaded(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const detectFacesLoop = async () => {
          if (!videoRef.current || !modelsLoaded || !isWorkSession) {
            requestAnimationFrame(detectFacesLoop);
            return;
          }

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

                if (avgEAR < EAR_THRESHOLD) {
                  setIsFocused(false); // User is not focused
                  console.log("Not Focused 😴");
                  triggerAlert();
                } else {
                  console.log("Focused 😊"); // User is focused
                  setIsFocused(true);
                }
              }
            } else {
              setIsFocused(false); // No faces detected
              triggerAlert();
            }
          } catch (error) {
            console.error("Error in face detection:", error);
          }

          requestAnimationFrame(detectFacesLoop);
        };

        detectFacesLoop();
      } catch (error) {
        console.error("Error starting camera:", error);
      }
    };

    loadModelsAndStartCamera();
  }, [modelsLoaded, isWorkSession, triggerAlert]);
  // Run this effect only after models are loaded
  // or when session state changes

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
