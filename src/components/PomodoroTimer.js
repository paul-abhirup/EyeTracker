// src/components/PomodoroTimer.js
import React, { useState, useEffect } from "react";

const PomodoroTimer = ({ onSessionEnd, onWorkSessionChange }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);

  useEffect(() => {
    let interval;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          // Session ended
          clearInterval(interval);
          const nextSession = !isWorkSession;
          setIsWorkSession(nextSession);
          onWorkSessionChange(nextSession); // Notify parent
          onSessionEnd(nextSession ? "Time to work!" : "Time for a break!");
          setMinutes(nextSession ? 1 : 5);
          setSeconds(0);
          setIsActive(false);
        }
      }, 1000);
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
    onWorkSessionChange(true);
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
