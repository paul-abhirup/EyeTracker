import React from "react";
import CameraFeed from "./components/CameraFeed";
import PomodoroTimer from "./components/PomodoroTimer";
import TodoList from "./components/TodoList";

function App() {
  return (
    <div className="App">
      <h1>Hyper Focus </h1>
      <CameraFeed />
      <PomodoroTimer />
      <TodoList />
    </div>
  );
}

export default App;
