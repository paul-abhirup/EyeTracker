// src/components/PomodoroTimer.js
import React, { useState, useEffect } from "react";

const PomodoroTimer = ({ onSessionEnd, onWorkSessionChange }) => {
  const [minutes, setMinutes] = useState(25); // Default work interval
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);

  useEffect(() => {
    let startTime;
    let interval;

    if (isActive) {
      startTime = performance.now();
      interval = setInterval(() => {
        const elapsedTime = Math.floor((performance.now() - startTime) / 1000);
        const remainingSeconds = minutes * 60 + seconds - elapsedTime;

        if (remainingSeconds <= 0) {
          clearInterval(interval);
          onSessionEnd(isWorkSession ? "Time for a break!" : "Back to work!");
          onWorkSessionChange(!isWorkSession); // Notify parent component
          setIsWorkSession(!isWorkSession);
          setMinutes(isWorkSession ? 5 : 25);
          setSeconds(0);
          setIsActive(false);
        } else {
          setMinutes(Math.floor(remainingSeconds / 60));
          setSeconds(remainingSeconds % 60);
        }
      }, 100);
    }

    return () => clearInterval(interval);
  }, [
    isActive,
    minutes,
    seconds,
    isWorkSession,
    onSessionEnd,
    onWorkSessionChange,
  ]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(25);
    setSeconds(0);
    setIsWorkSession(true);
    onWorkSessionChange(true); // Reset to work session
  };

  return (
    <div>
      <h2>{isWorkSession ? "Work Session" : "Break Time"}</h2>
      <div>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
      <button onClick={toggleTimer}>{isActive ? "Pause" : "Start"}</button>
      <button onClick={resetTimer}>Reset</button>
    </div>
  );
};

export default PomodoroTimer;
