import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import ProtectedRoute from "./utils/ProtectedRoute.jsx";
import { AuthProvider } from "./utils/AuthProvider.jsx";
import Users from "./components/Users/Users.jsx";
import UrlLists from "./components/Urls/UrlLists.jsx";
import Requests from "./components/Requests.jsx";
import Feedbacks from "./components/Services/Feedbacks.jsx";
import Logs from "./components/Admin_Logs/Logs.jsx";
import Sidebar from "./components/Navigation/Sidebar.jsx";
import Navbar from "./components/Navigation/Navbar.jsx";
import AddUser from "./components/Users/AddUser.jsx";
import AddUrl from "./components/Urls/AddUrl.jsx";
import UrlDetails from "./components/Urls/UrlDetails.jsx";
import UserDetails from "./components/Users/UserDetails.jsx";
// import Insights from "./components/Employee/Insights.jsx";
// import AddEmp from "./components/Employee/AddEmp.jsx";
// import EmpInsights from "./components/Employee/EmpInsights.jsx";
import { Toaster } from "sonner";
import AdminSettings from "./components/Settings/AdminSettings.jsx";
import Settings from "./components/Settings/Settings.jsx";
import Login from "./components/Auth/Login.jsx";
import Overview from "./components/Overview.jsx";
import { useSelector } from "react-redux";
import Logout from "./components/Auth/Logout.jsx";
import NotFound from "./components/NotFound.jsx";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isLogoutpage = location.pathname === "/logout";

  return (
    <>
      {!isLoginPage && !isLogoutpage  && <Sidebar />}
      {!isLoginPage && !isLogoutpage && <Navbar />}
      {children}
    </>
  );
};

function App() {
  const theme = useSelector((state) => state.theme);

  return (
    <>
      <Toaster richColors />
      <div className={`${theme}`}>
        <div className="w-full h-full min-h-[100svh] bg-[#F7F4F4] dark:bg-[#001733] flex justify-center">
          <div className="w-full h-full max-w-screen-2xl">
            <Router>
              <AuthProvider>
                <MainLayout>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/logout" element={<Logout />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/" element={<Overview />} />

                      <Route path="/users" element={<Users />} />
                      <Route path="/users/adduser" element={<AddUser />} />
                      <Route
                        path="/users/userDetails/:id"
                        element={<UserDetails />}
                      />
                      {/*
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/insights/addemp" element={<AddEmp />} />
                      <Route
                        path="/insights/empinsight/:id"
                        element={<EmpInsights />}
                      />
                    */}
                      <Route path="/urllists" element={<UrlLists />} />
                      <Route path="/urllists/addurl" element={<AddUrl />} />
                      <Route
                        path="/urllists/urldetails/:id"
                        element={<UrlDetails />}
                      />
                      <Route path="/requests" element={<Requests />} />
                      <Route path="/feedback" element={<Feedbacks />} />
                      <Route path="/logs" element={<Logs />} />
                      <Route path="/profileSettings" element={<AdminSettings />} />
                      <Route path="/settings" element={<Settings />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </MainLayout>
              </AuthProvider>
            </Router>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
