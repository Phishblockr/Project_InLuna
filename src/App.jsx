import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './utils/AuthProvider';
import ForgotDetails from './components/forgotDetails/ForgotDetails';
import PasswordReset from './components/forgotDetails/PasswordReset';
import ProtectedRoute from './utils/ProtectedRoute';
import Login from './components/auth/Login';
import Logout from './components/auth/Logout';
import Overview from './components/Overview';
import NotFound from './components/NotFound';
import Course from './components/Course/Course';
import { Toaster } from 'sonner';
import { useSelector } from 'react-redux';
import Email from './components/Email/Email';
import EmailCreator from './components/Email/EmailCreator';
import EditEditor from './components/Email/EmailEditor';
import CourseCreator from './components/Course/CourseCreator.jsx';
import CourseEditor from './components/Course/CourseEditor';
import ListOrganisations from './components/Organisation/ListOrganisations.jsx';
import Layout from "./layout/Layout"

import ListAppointments from './components/Appointments/ListAppointments.jsx';
import AddOrganisations from './components/Organisation/AddOrganisations.jsx';
import OrgLayout from './components/Organisation/OrgLayout.jsx';
import UserDetails from './components/Users/UserDetails.jsx';

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
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/logout" element={<Logout />} />
                        <Route path="/forgotDetails" element={<ForgotDetails />} />
                        <Route path="/resetPassword/:token" element={<PasswordReset />} />

                        {/* Protected Routes */}
                        <Route element={<Layout />}>
                          <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<Overview />} />
                            <Route path="/courses" element={<Course />} />
                            <Route path="/courses/courseCreator" element={<CourseCreator />} />
                            <Route path="/courses/courseEditor/:id" element={<CourseEditor />} />

                            <Route path="/emails" element={<Email />} />
                            <Route path="/emails/emailCreator" element={<EmailCreator />} />
                            <Route path="/emails/emailEditor/:id" element={<EditEditor />} />
                            <Route path="/appointments" element={<ListAppointments/>}></Route>
                            <Route path="/organisations" element={<ListOrganisations/>}></Route>
                            <Route path='/organisations/:orgName' element={<OrgLayout/>}></Route>
                            <Route path='/organisations/:orgName/userDetails/:userId' element={<UserDetails/>}></Route>
                            <Route path="/organisations/addOrganisation" element={<AddOrganisations/>}></Route>
                          </Route>
                        </Route>
                        <Route path="*" element={<NotFound />} />
                      </Routes>
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