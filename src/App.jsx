import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './utils/AuthProvider';
import ForgotDetails from './components/forgotDetails/ForgotDetails';
import PasswordReset from './components/forgotDetails/PasswordReset';
import ProtectedRoute from './utils/ProtectedRoute';
import Login from './components/auth/Login';
import Logout from './components/auth/Logout';
import Overview from './components/Overview';
import NotFound from './components/NotFound';
import Navbar from './components/Navigation/Navbar';
import Sidebar from './components/Navigation/Sidebar';
import Course from './components/Course';
import Email from "./components/Email";
import { Toaster } from 'sonner';
import { useSelector } from 'react-redux';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isLogoutPage = location.pathname === '/logout';
  const isForgotDetailsPage = location.pathname === '/forgotDetails';
  const isResetPasswordPage = location.pathname.startsWith('/resetPassword');

  const showSidebarAndNavbar =
    !isLoginPage && !isLogoutPage && !isResetPasswordPage && !isForgotDetailsPage;

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
          <div className="w-full">
            <Router>
              <AuthProvider>
                <Routes>
                  <Route
                    path="*"
                    element={
                      <MainLayout>
                        <Routes>
                          <Route path="/login" element={<Login />} />
                          <Route path="/logout" element={<Logout />} />
                          <Route path="/forgotDetails" element={<ForgotDetails />} />
                          <Route path="/resetPassword/:token" element={<PasswordReset />} />

                          {/* Protected Routes */}
                          <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<Overview />} />
                            <Route path="/course" element={<Course />} />
                            <Route path="/email" element={<Email />} />
                          </Route>
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </MainLayout>
                    }
                  />
                </Routes>
              </AuthProvider>
            </Router>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
