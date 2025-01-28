import React, { useState } from "react";
import CameraFeed from "./components/CameraFeed";
import PomodoroTimer from "./components/PomodoroTimer";
import TodoList from "./components/TodoList";

function App() {
  const [alertMessage, setAlertMessage] = useState("");
  const [isWorkSession, setIsWorkSession] = useState(true);

  // handleSessionEnd is called when a Pomodoro timer session ends
  // It displays an alert message for 5 seconds to notify the user
  const handleSessionEnd = (message) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(""), 5000); // Clear alert after 5 seconds
  };

  // handleWorkSessionChange updates the work/break session state
  // It's called by PomodoroTimer to toggle between work and break periods
  const handleWorkSessionChange = (isWorkSession) => {
    setIsWorkSession(isWorkSession);
  };

  return (
    <div className="App">
      <h1>Hyper Focus </h1>
      <CameraFeed isWorkSession={isWorkSession} />
      <PomodoroTimer onWorkSessionChange={handleWorkSessionChange} />
      <TodoList />
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
}

export default App;
