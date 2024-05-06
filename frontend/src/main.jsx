import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Users from "./components/Users.jsx";
import Insights from "./components/Insights.jsx";
import UrlLists from "./components/UrlLists.jsx";
import Requests from "./components/Requests.jsx";
import Feedbacks from "./components/Feedbacks.jsx";
import Logs from "./components/Logs.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Navbar from "./components/Navbar.jsx";
import AddUser from "./components/AddUser.jsx";
import AddUrl from "./components/AddUrl.jsx";
import UrlDetails from "./components/UrlDetails.jsx";
import UserDetails from "./components/UserDetails.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Sidebar />
      <Navbar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/adduser" element={<AddUser />} />
        <Route path="/users/userDetails" element={<UserDetails />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/urllists" element={<UrlLists />} />
        <Route path="/urllists/addurl" element={<AddUrl />} />
        <Route path="/urllists/urldetails" element={<UrlDetails />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/feedbacks" element={<Feedbacks />} />
        <Route path="/logs" element={<Logs />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
