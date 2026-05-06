import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import ProtectedRoute from "./utils/ProtectedRoute.jsx";
import { Toaster } from "sonner";
import { useSelector } from "react-redux";
import { AuthProvider } from "./utils/AuthProvider.jsx";
import Sidebar from "./components/Navigation/Sidebar.jsx";
import Navbar from "./components/Navigation/Navbar.jsx";
import Overview from "./components/Overview.jsx";
import Logout from "./components/Auth/Logout.jsx";
import EmailBox from "./components/EmailBox.jsx";
import Training from "./components/Training.jsx";
import CourseDetails from "./components/Course/CourseDetails.jsx";
import CourseOverview from "./components/Course/CourseOverview.jsx";
import EmailLayout from "./components/Email/EmailLayout.jsx";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isLogoutPage = location.pathname === "/logout";
  const isForgotDetailsPage = location.pathname === "/forgotDetails";
  const isResetPasswordPage = location.pathname.startsWith("/resetPassword");
  const isSetupPasswordPage = location.pathname.startsWith("/setupPassword");

  const showSidebarAndNavbar =
    !isLoginPage &&
    !isLogoutPage &&
    !isResetPasswordPage &&
    !isForgotDetailsPage &&
    !isSetupPasswordPage;

  return (
    <>
      {showSidebarAndNavbar && <Sidebar />}
      {showSidebarAndNavbar && <Navbar />}
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
                    <Route path="/logout" element={<Logout />} />
                    {/* <Route path="/login" element={<Login />} /> */}

                    {/* <Route path="/forgotDetails" element={<ForgotDetails />} />
                    <Route path="/resetPassword/:token" element={<PasswordReset />} />
                    <Route path="/setupPassword/:token" element={<SetupPassword/>} /> */}

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/" element={<Overview />} />
                      <Route path="/email/inbox" element={<EmailBox />} />
                      <Route path="/email/inbox/:emailId" element={<EmailLayout/>}/>
                      <Route path="/training" element={<Training />} />
                      <Route
                        path="/training/courses/:courseName"
                        element={<CourseOverview />}
                      />
                      <Route
                        path="/training/course/:courseName/learn/lecture/:videoId"
                        element={<CourseDetails />}
                      />
                    </Route>
                    {/* <Route path="*" element={<NotFound />} /> */}
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
