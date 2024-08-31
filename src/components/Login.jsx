import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthProvider';
import { toast } from "sonner";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [orgId, setOrgId] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const loginData = {
      uuid: orgId,
      username: username,
      password: password
    };

    try {
      const response = await fetch("http://localhost:5000/api/user/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(loginData),
      });
      if (!response.ok) {
        throw new Error("Login failed. Please check your credentials!");
      }
      const data = await response.json();
      console.log(data)
      if (data.isDashboardAdmin) {
        data.username = username;
        data.orgId = orgId;
        login(data);
        navigate('/');
        toast.success("Login successful")
      } else {
        toast.error("Unauthorized");
      }
    } catch (error) {
      toast.error("Unable to communicate with server");
    
    }
  };

  return (
    <div className="flex justify-center">
      <div className="flex flex-col ">
        <h1 className=" flex justify-center text-2xl text-left text-black font-bold tracking-tighter my-5 dark:text-[#F4F4F4]">
          Phishblokr
        </h1>
        <div className="bg-white rounded-lg shadow p-10 dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
          <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
            <div className="mb-4">
              <label htmlFor="orgId" className="block text-gray-700 mb-2 dark:text-[#F4F4F4]">
                Organization Id:
              </label>
              <input
                type="orgId"
                id="orgId"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 mb-2 dark:text-[#F4F4F4]">
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
              <label htmlFor="password" className="block text-gray-700 mb-2 dark:text-[#F4F4F4]">
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
            <button
              type="submit"
              className="w-full bg-[#0364BD] text-white py-2 rounded-md hover:bg-[#003A70] transition-colors font-medium"
            >
              Login
            </button>
            <div className="mt-4 text-center">
              <a
                href="/forgot-password"
                className="text-[#0364BD] hover:underline"
              >
                Forgot Password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
