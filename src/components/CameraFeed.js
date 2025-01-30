import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { loadModels, detectFaces, getEAR } from "../utils/faceDetection";

// Constants
const EAR_THRESHOLD = 0.25; // Threshold to determine if the user is focused
const DETECTION_INTERVAL = 500; // Face detection interval in milliseconds

const CameraFeed = React.memo(({ isWorkSession }) => {
  // Refs
  const videoRef = useRef(null);
  const alertTimeoutRef = useRef(null);
  const isFocusedRef = useRef(true);

  // State
  const [isFocused, setIsFocused] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [emotionHistory, setEmotionHistory] = useState([]); // Store all emotions during the session

  // Memoized functions
  const updateFocusState = useCallback((newFocusState) => {
    if (isFocusedRef.current !== newFocusState) {
      isFocusedRef.current = newFocusState;
      setIsFocused(newFocusState);
      console.log("Focus state updated to:", newFocusState);
    }
  }, []);

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

  // Analyze emotions and store them in history
  const analyzeEmotions = useCallback((expressions) => {
    if (!expressions || Object.keys(expressions).length === 0) {
      console.error("No expressions found in detections.");
      return null;
    }

    const dominantEmotion = Object.keys(expressions).reduce((a, b) =>
      expressions[a] > expressions[b] ? a : b
    );
    console.log("Dominant emotion in this frame:", dominantEmotion);

    // Store the dominant emotion in history
    setEmotionHistory((prev) => [...prev, dominantEmotion]);
  }, []);

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
            triggerAlert("Your eyes look tired. Take a quick break!");
          } else {
            updateFocusState(true);
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

  // Calculate average emotion and trigger alert when session ends
  useEffect(() => {
    if (!isWorkSession && emotionHistory.length > 0) {
      // Calculate most frequent emotion
      const emotionCounts = emotionHistory.reduce((counts, emotion) => {
        counts[emotion] = (counts[emotion] || 0) + 1;
        return counts;
      }, {});

      const mostFrequentEmotion = Object.keys(emotionCounts).reduce((a, b) =>
        emotionCounts[a] > emotionCounts[b] ? a : b
      );

      console.log("Most frequent emotion in session:", mostFrequentEmotion);

      // Trigger alert based on the most frequent emotion
      switch (mostFrequentEmotion) {
        case "sad":
          triggerAlert(
            "You seemed sad during the session. Take a break and listen to calming music."
          );
          break;
        case "angry":
          triggerAlert(
            "You seemed angry during the session. Try some deep breathing exercises."
          );
          break;
        case "fearful":
        case "disgusted":
          triggerAlert(
            "You seemed stressed during the session. Take a short walk or meditate."
          );
          break;
        case "happy":
          triggerAlert(
            "You seemed happy during the session! Keep up the good work."
          );
          break;
        default:
          break;
      }

      // Reset emotion history for the next session
      setEmotionHistory([]);
    }
  }, [isWorkSession, emotionHistory, triggerAlert]);

  // Reset states when work session ends
  useEffect(() => {
    if (!isWorkSession) {
      setIsFocused(true);
      setAlertMessage("");
      console.log("Work session ended. Resetting states.");
    }
  }, [isWorkSession]);

  // Memoized JSX to prevent unnecessary re-renders
  const memoizedJSX = useMemo(
    () => (
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
    ),
    [isFocused, alertMessage]
  );

  return memoizedJSX;
});

export default CameraFeed;
