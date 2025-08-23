import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./utils/ProtectedRoute.jsx";
import { AuthProvider } from "./utils/AuthProvider.jsx";
import Users from "./components/Users/Users.jsx";
import UrlLists from "./components/Urls/UrlLists.jsx";
import Requests from "./components/Requests.jsx";
import Feedbacks from "./components/Services/Feedbacks.jsx";
import Logs from "./components/Logs.jsx";
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
import ReportBug from "./components/Services/ReportBug.jsx";
import Faqs from "./components/Services/Faqs.jsx";
import PasswordReset from "./components/ForgotDetails/PasswordReset.jsx";
import ForgotDetails from "./components/ForgotDetails/ForgotDetails.jsx";
import AddCampaign from "./components/Campaign/AddCampaign.jsx";
import Campaign from "./components/Campaign/Campaign.jsx";
import SetupPassword from "./components/Users/SetupPassword.jsx";
// import CreateTemplate from "./components/Campaign/CreateTemplate.jsx";
// import CreateBlog from "./components/Campaign/CreateBlog.jsx";
import Layout from "./layout/Layout.jsx";
import Training from "./components/Training/Training.jsx";
import IndividualTraining from "./components/Training/IndividualTraining.jsx";
import PasswordResetDone from "./components/ForgotDetails/PasswordResetDone.jsx";
import SetupPasswordDone from "./components/Users/SetupPasswordDone.jsx";
import TransactionSettings from "./components/Transaction/TransactionSettings.jsx";
import TransactionsHistory from "./components/Transaction/TransactionsHistory.jsx";
import CancelMembership from "./components/Transaction/CancelMembership.jsx";
// import RedirectToSubdomain from "./components/RedirectToSubdomain.jsx";
import VerifyOrganization from "./pages/VerifyOrganization.jsx";
import VerifyIndividual from "./pages/VerifyIndividual.jsx";

function App() {
  const theme = useSelector((state) => state.theme);

  return (
    <>
      <Toaster richColors />
      <div className={`${theme}`}>
        <div className="w-full h-full min-h-[100svh] bg-[#F7F4F4] dark:bg-[#001733] flex justify-center">
          <div className="w-full h-full">
            <Router>
              <AuthProvider>
                {/* <RedirectToSubdomain /> */}
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route
                    path="/verify-organization"
                    element={<VerifyOrganization />}
                  />
                  <Route
                    path="/verify-individual"
                    element={<VerifyIndividual />}
                  />

                  <Route path="/forgotDetails" element={<ForgotDetails />} />
                  <Route
                    path="/resetPassword/:token"
                    element={<PasswordReset />}
                  />

                  <Route
                    path="/setupPassword/:token"
                    element={<SetupPassword />}
                  />

                  <Route
                    path="/passwordResetSuccessful"
                    element={<PasswordResetDone />}
                  />

                  <Route
                    path="/passwordSetSuccessful"
                    element={<SetupPasswordDone />}
                  />

                  <Route element={<Layout />}>
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
                      />*/}
                      <Route path="/urllists" element={<UrlLists />} />
                      <Route path="/urllists/addurl" element={<AddUrl />} />
                      <Route
                        path="/urllists/urldetails/:id"
                        element={<UrlDetails />}
                      />
                      <Route path="/campaign" element={<Campaign />} />
                      <Route path="/campaign/add" element={<AddCampaign />} />
                      {/* <Route path="/campaign/manageTemplate" element={<CreateTemplate />} /> */}
                      {/* <Route path="/campaign/manageBlog" element={<CreateBlog />} /> */}
                      <Route path="/requests" element={<Requests />} />
                      <Route path="/feedback" element={<Feedbacks />} />
                      <Route path="/logs" element={<Logs />} />
                      <Route
                        path="/profileSettings"
                        element={<AdminSettings />}
                      />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/report" element={<ReportBug />} />
                      <Route path="/faq" element={<Faqs />} />
                      <Route
                        path="/transactionSettings"
                        element={<TransactionSettings />}
                      />
                      <Route
                        path="/transactionsHistory"
                        element={<TransactionsHistory />}
                      />
                      <Route
                        path="/cancelMembership"
                        element={<CancelMembership />}
                      />
                      {/* Training Routes */}
                      <Route path="/training" element={<Training />} />
                      <Route
                        path="/training/individualTraining/:id"
                        element={<IndividualTraining />}
                      />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFound />} />
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
