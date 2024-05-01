import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <div className="flex h-full">
      <Dashboard />
    </div>
  );
}

export default App;
