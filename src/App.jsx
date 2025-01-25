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
// import Login from "./components/Auth/Login.jsx";
// import Users from "./components/Users/Users.jsx";
// import UrlLists from "./components/Urls/UrlLists.jsx";
// import Requests from "./components/Requests.jsx";
// import Feedbacks from "./components/Services/Feedbacks.jsx";
// import Logs from "./components/Logs.jsx";
// import AddUser from "./components/Users/AddUser.jsx";
// import AddUrl from "./components/Urls/AddUrl.jsx";
// import UrlDetails from "./components/Urls/UrlDetails.jsx";
// import UserDetails from "./components/Users/UserDetails.jsx";
// import Insights from "./components/Employee/Insights.jsx";
// import AddEmp from "./components/Employee/AddEmp.jsx";
// import EmpInsights from "./components/Employee/EmpInsights.jsx";
// import AdminSettings from "./components/Settings/AdminSettings.jsx";
// import Settings from "./components/Settings/Settings.jsx";
// import NotFound from "./components/NotFound.jsx";
// import ReportBug from "./components/Services/ReportBug.jsx";
// import Faqs from "./components/Services/Faqs.jsx";
// import PasswordReset from "./components/ForgotDetails/PasswordReset.jsx";
// import ForgotDetails from "./components/ForgotDetails/ForgotDetails.jsx";
// import AddCampaign from "./components/Campaign/AddCampaign.jsx";
// import Campaign from "./components/Campaign/Campaign.jsx";
// import SetupPassword from "./components/Users/SetupPassword.jsx";
// import CreateTemplate from "./components/Campaign/CreateTemplate.jsx";
// import CreateBlog from "./components/Campaign/CreateBlog.jsx";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isLogoutPage = location.pathname === "/logout";
  const isForgotDetailsPage = location.pathname === "/forgotDetails"
  const isResetPasswordPage = location.pathname.startsWith("/resetPassword");
  const isSetupPasswordPage = location.pathname.startsWith("/setupPassword")

  const showSidebarAndNavbar = !isLoginPage && !isLogoutPage && !isResetPasswordPage && !isForgotDetailsPage && !isSetupPasswordPage;

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
                      <Route path="/emailBox" element={<EmailBox />}/>
                      <Route  path="/training" element={<Training/>}/>
                      <Route path="/courses/:courseName" element={<CourseDetails />} />
                      {/* <Route path="/users" element={<Users />} />
                      <Route path="/users/adduser" element={<AddUser />} />
                      <Route
                        path="/users/userDetails/:id"
                        element={<UserDetails />} 
                      /> */}
                      {/*
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/insights/addemp" element={<AddEmp />} />
                      <Route
                        path="/insights/empinsight/:id"
                        element={<EmpInsights />}
                      />*/}
                      {/* <Route path="/urllists" element={<UrlLists />} />
                      <Route path="/urllists/addurl" element={<AddUrl />} />
                      <Route
                        path="/urllists/urldetails/:id"
                        element={<UrlDetails />}
                      />
                      <Route path="/campaign" element={<Campaign />} />
                      <Route path="/campaign/add" element={<AddCampaign />} />
                      <Route path="/campaign/manageTemplate" element={<CreateTemplate />} />
                      <Route path="/campaign/manageBlog" element={<CreateBlog />} />
                      <Route path="/requests" element={<Requests />} />
                      <Route path="/feedback" element={<Feedbacks />} />
                      <Route path="/logs" element={<Logs />} />
                      <Route path="/profileSettings" element={<AdminSettings />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/report" element={<ReportBug />} />
                      <Route path="/faq" element={<Faqs />} /> */}
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
