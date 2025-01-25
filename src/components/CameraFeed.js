import React, { useRef, useEffect, useState } from "react";
import { loadModels, detectFaces, getEAR } from "../utils/faceDetection";

const CameraFeed = () => {
  const videoRef = useRef(null);
  const [alert, setAlert] = React.useState("");
  const [isFocused, setIsFocused] = useState(true);

  // Eye Aspect Ratio (EAR) threshold for detecting blinks
  const EAR_THRESHOLD = 0.25;

  useEffect(() => {
    const startCamera = async () => {
      // Load models from utils
      await loadModels();

      // start camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;

      // detect attentation every 0.5s
      setInterval(async () => {
        if (videoRef.current) {
          const detections = await detectFaces(videoRef.current);

          //debugging purposes
          // console.log("Face Detection Results:", {
          //   detectionsFound: detections.length > 0,
          //   detections: detections,
          // });
          // if (detections.length === 0) {
          //   console.log("No face detected");
          //   setAlert("Stay focused! No face detected.");
          // } else {
          //   console.log("Face detected");
          //   setAlert("");
          // }

          if (detections.length > 0) {
            const landmarks = detections[0].landmarks;
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();

            const leftEAR = getEAR(leftEye);
            const rightEAR = getEAR(rightEye);
            const avgEAR = (leftEAR + rightEAR) / 2;

            // Check if the user is paying attention
            if (avgEAR < EAR_THRESHOLD) {
              setIsFocused(false); // User is not focused
            } else {
              setIsFocused(true); // User is focused
            }
          }
        }
      }, 500); // check every 0.5s
    };
    startCamera();
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline muted />
      <p>{isFocused ? "Focused 😊" : "Not Focused 😴"}</p>
    </div>
  );
};

export default CameraFeed;
