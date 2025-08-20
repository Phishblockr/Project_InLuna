import React, { useState } from "react";
import { useAuth } from "../../utils/AuthProvider";
import { Link } from "react-router-dom";
import useRecaptcha from "../../utils/useRecaptcha";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [orgId, setOrgId] = useState(localStorage.getItem("orgId") || "");
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const { ready: recaptchaReady, execute: executeRecaptcha } = useRecaptcha();

  const handleSubmit = async (event) => {
    event.preventDefault();
    let recaptchaToken = null;
    try {
      if (recaptchaReady) {
        // Must match backend expectedAction: "dashboard_login"
        recaptchaToken = await executeRecaptcha("dashboard_login");
      } else {
        console.warn("reCAPTCHA not ready, proceeding without token");
      }
    } catch (e) {
      console.error("reCAPTCHA error", e);
    }
    const loginData = {
      orgId: orgId,
      username: username,
      password: password,
      rememberMe: rememberMe,
      recaptchaToken,
    };
    try {
      await login(loginData);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleRememberMe = (rememberMe) => {
    setRememberMe(rememberMe);
    if (rememberMe) {
      console.log("orgId saved");
      localStorage.setItem("orgId", orgId);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-[470px]">
        <h1 className=" flex justify-center text-2xl text-left text-black font-bold tracking-tighter my-5 dark:text-[#F4F4F4]">
          InLuna
        </h1>
        <div className="bg-white rounded-lg shadow p-10 dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
          <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
            <div className="mb-4">
              <label
                htmlFor="orgId"
                className="block text-gray-700 mb-2 dark:text-[#F4F4F4]"
              >
                Organization Id:
              </label>
              <input
                type="text"
                id="orgId"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-gray-700 mb-2 dark:text-[#F4F4F4]"
              >
                Username:
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-gray-700 mb-2 dark:text-[#F4F4F4]"
              >
                Password:
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
              />
            </div>
            <div className="mb-6">
              <input
                onChange={(e) => handleRememberMe(e.target.checked)}
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={rememberMe}
              />
              <label htmlFor="rememberMe"> Remember Me </label>
            </div>
            <button
              type="submit"
              className="w-full bg-[#0364BD] text-[#f4f4f4] py-2 rounded-md hover:bg-[#003A70] transition-colors font-medium"
            >
              Login
            </button>
            <div className="mt-4 text-center">
              <Link
                to="/forgotDetails"
                className="text-[#0364BD] hover:underline"
              >
                Forgot Details?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
