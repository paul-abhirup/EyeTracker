import React, { useRef, useEffect } from "react";
import { loadModels, detectFaces } from "../utils/faceDetection";

const CameraFeed = () => {
  const videoRef = useRef(null);
  const [alert, setAlert] = React.useState("");

  useEffect(() => {
    const startCamera = async () => {
      await loadModels();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;

      setInterval(async () => {
        // Inside the interval function
        const detections = await detectFaces(videoRef.current);
        // console.log(detections);
        if (detections.length === 0 || /* Add condition for eye movement */ ) {
          setAlert("Stay focused!");
        } else {
          console.log("Face detected:", detections[0].landmarks);
        }
      }, 1000);
    };
    startCamera();
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline muted />
    </div>
  );
};

export default CameraFeed;
