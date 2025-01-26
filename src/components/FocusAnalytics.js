import React, { useState, useEffect } from "react";

const FocusAnalytics = ({ isFocused }) => {
  const [focusDuration, setFocusDuration] = useState(0);

  useEffect(() => {
    let timer;
    if (isFocused) {
      timer = setInterval(() => {
        setFocusDuration((prev) => prev + 1);
      }, 1000); // Increment every second
    } else {
      clearInterval(timer);
    }

    return () => clearInterval(timer);
  }, [isFocused]);

  return (
    <div>
      <h2>Focus Analytics</h2>
      <p>Total Focus Duration: {focusDuration} seconds</p>
    </div>
  );
};

export default FocusAnalytics;
