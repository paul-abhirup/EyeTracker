import * as faceapi from "face-api.js";

//Load models
export const loadModels = async () => {
  try {
    console.log("Starting to load models...");
    const MODEL_URL = "/models";

    // Load models sequentially and wait for each
    await faceapi.nets.tinyFaceDetector.load(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.load(MODEL_URL);
    await faceapi.nets.faceExpressionNet.load(MODEL_URL);

    console.log("Models loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading models:", error);
    return false;
  }
};

//detect faces
// In utils/faceDetection.js
export const detectFaces = async (videoElement) => {
  try {
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    return detections;
  } catch (error) {
    console.error("Error detecting faces:", error);
    return null;
  }
};

// Function to calculate EAR
// EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||) //Eye Aspect Ratio
// export const getEAR = (eyeLandmarks) => {
//   const p1 = eyeLandmarks[0];
//   const p2 = eyeLandmarks[1];
//   const p3 = eyeLandmarks[2];
//   const p4 = eyeLandmarks[3];
//   const p5 = eyeLandmarks[4];
//   const p6 = eyeLandmarks[5];

//   const A = faceapi.euclideanDistance(p2, p6);
//   const B = faceapi.euclideanDistance(p3, p5);
//   const C = faceapi.euclideanDistance(p1, p4);
//   return (A + B) / (2 * C);
// };

// EAR (Eye Aspect Ratio) calculation
export const getEAR = (eye) => {
  if (!eye || eye.length !== 6) {
    console.error("Invalid eye points:", eye);
    return 0;
  }

  const A = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
  const B = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
  const C = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);

  return (A + B) / (2 * C);
};
