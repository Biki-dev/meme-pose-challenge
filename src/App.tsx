// src/App.tsx
import React from "react";
import { CameraView } from "./components/CameraView";

function App() {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "white"
    }}>
      <CameraView />
    </div>
  );
}

export default App;