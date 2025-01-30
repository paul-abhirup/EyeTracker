import React, { useRef, useEffect, useState, useCallback } from "react";
import { loadModels, detectFaces, getEAR } from "../utils/faceDetection";

// Constants
const EAR_THRESHOLD = 0.2; // Threshold to determine if the user is focused
const HISTORY_LIMIT = 25; // Number of frames to consider for smoothing emotions
const DETECTION_INTERVAL = 500; // Face detection interval in milliseconds

const CameraFeed = ({ isWorkSession }) => {
  // Refs
  const videoRef = useRef(null);
  const alertTimeoutRef = useRef(null);
  const isFocusedRef = useRef(true);

  // State
  const [isFocused, setIsFocused] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [emotion, setEmotion] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);

  // Update focus state and log changes
  const updateFocusState = useCallback((newFocusState) => {
    if (isFocusedRef.current !== newFocusState) {
      isFocusedRef.current = newFocusState;
      setIsFocused(newFocusState);
      console.log("Focus state updated to:", newFocusState);
    }
  }, []);

  // Trigger alert with a cooldown period
  const triggerAlert = useCallback((message = "Stay focused! 😊") => {
    if (!alertTimeoutRef.current) {
      setAlertMessage(message);
      alertTimeoutRef.current = setTimeout(() => {
        setAlertMessage("");
        alertTimeoutRef.current = null;
      }, 5000); // Cooldown period of 5 seconds
      console.log("Alert triggered:", message);
    }
  }, []);

  // Analyze emotions and update state
  const analyzeEmotions = useCallback(
    (expressions) => {
      if (!expressions || Object.keys(expressions).length === 0) {
        console.error("No expressions found in detections.");
        return null;
      }

      const dominantEmotion = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      );
      // console.log("Dominant emotion in this frame:", dominantEmotion);

      setEmotionHistory((prev) => {
        const newHistory = [...prev, dominantEmotion];
        if (newHistory.length > HISTORY_LIMIT) newHistory.shift(); // Keep history limited
        console.log("Updated emotion history:", newHistory);
        return newHistory;
      });

      // Calculate most frequent emotion
      const emotionCounts = emotionHistory.reduce((counts, emotion) => {
        counts[emotion] = (counts[emotion] || 0) + 1;
        return counts;
      }, {});

      const mostFrequentEmotion = Object.keys(emotionCounts).reduce((a, b) =>
        emotionCounts[a] > emotionCounts[b] ? a : b
      );

      setEmotion(mostFrequentEmotion);
      console.log("Most frequent emotion in history:", mostFrequentEmotion);

      // Suggest activities based on the most frequent emotion
      switch (mostFrequentEmotion) {
        case "sad":
          triggerAlert(
            "You seem sad. Take a break and listen to calming music."
          );
          break;
        case "angry":
          triggerAlert("You seem angry. Try some deep breathing exercises.");
          break;
        case "fearful":
        case "disgusted":
          triggerAlert("You seem stressed. Take a short walk or meditate.");
          break;
        case "happy":
          triggerAlert("You seem happy! Keep up the good work.");
          break;
        default:
          break;
      }
    },
    [emotionHistory, triggerAlert]
  );

  // Main face detection loop
  const detectFacesLoop = useCallback(async () => {
    if (!isWorkSession || !videoRef.current || !modelsLoaded) {
      console.log("Skipping detection: Camera not ready or models not loaded");
      return;
    }

    try {
      const detections = await detectFaces(videoRef.current);
      console.log("Detections:", detections);

      if (detections && detections.length > 0) {
        const { landmarks, expressions } = detections[0];

        // Emotion Detection
        if (expressions) {
          analyzeEmotions(expressions);
        }

        // Focus Detection (EAR)
        if (
          landmarks &&
          landmarks.getLeftEye &&
          landmarks.getRightEye &&
          landmarks.getLeftEye().length === 6 &&
          landmarks.getRightEye().length === 6
        ) {
          const leftEAR = getEAR(landmarks.getLeftEye());
          const rightEAR = getEAR(landmarks.getRightEye());
          const avgEAR = (leftEAR + rightEAR) / 2;

          console.log("Average EAR:", avgEAR);

          if (avgEAR < EAR_THRESHOLD) {
            updateFocusState(false);
            console.log("User is not focused");
            triggerAlert("Your eyes look tired. Take a quick break!");
          } else {
            updateFocusState(true);
            console.log("User is focused");
          }
        }
      } else {
        console.log("No faces detected");
        setIsFocused(false);
        triggerAlert("No faces detected! Stay alert!");
      }
    } catch (error) {
      console.error("Error in face detection:", error);
    }

    setTimeout(() => {
      requestAnimationFrame(detectFacesLoop);
    }, DETECTION_INTERVAL);
  }, [
    isWorkSession,
    modelsLoaded,
    analyzeEmotions,
    updateFocusState,
    triggerAlert,
  ]);

  // Initialize camera and load models
  useEffect(() => {
    const initialize = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            loadModels()
              .then(() => {
                setModelsLoaded(true);
                detectFacesLoop();
              })
              .catch((error) => {
                console.error("Error loading models:", error);
              });
          };
        }
      } catch (error) {
        console.error("Error initializing camera or loading models:", error);
      }
    };

    initialize();
  }, [detectFacesLoop]);

  // Reset states when work session ends
  useEffect(() => {
    if (!isWorkSession) {
      setIsFocused(true);
      setAlertMessage("");
      setEmotion(null);
      console.log("Work session ended. Resetting states.");
    }
  }, [isWorkSession]);

  // Render component
  return (
    <div>
      <video ref={videoRef} autoPlay playsInline muted />
      <p>{isFocused ? "Focused 😊" : "Not Focused 😴"}</p>
      {emotion && <p>Detected Emotion: {emotion}</p>}
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
