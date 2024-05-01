import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Overview from "./components/Overview";

function App() {
  return (
    <div className="flex h-full">
      <Overview />
    </div>
  );
}

export default App;
