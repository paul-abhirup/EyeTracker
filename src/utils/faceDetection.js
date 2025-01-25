import * as faceapi from "face-api.js";

//Load models
export const loadModels = async () => {
  try {
    console.log("Loading face detection models...");
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    // await faceapi.nets.tinyYolov2.loadFromUri("/models");
    console.log("Models loaded successfully");
  } catch (error) {
    console.error("Error loading models:", error);
  }
};

//detect faces
export const detectFaces = async (videoElement) => {
  const detections = await faceapi
    .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();
  return detections;
};

// Function to calculate EAR
// EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||) //Eye Aspect Ratio
export const getEAR = (eyeLandmarks) => {
  const p1 = eyeLandmarks[0];
  const p2 = eyeLandmarks[1];
  const p3 = eyeLandmarks[2];
  const p4 = eyeLandmarks[3];
  const p5 = eyeLandmarks[4];
  const p6 = eyeLandmarks[5];

  const A = faceapi.euclideanDistance(p2, p6);
  const B = faceapi.euclideanDistance(p3, p5);
  const C = faceapi.euclideanDistance(p1, p4);
  return (A + B) / (2 * C);
};
