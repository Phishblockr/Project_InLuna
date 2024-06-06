import React, { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle login logic here
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
              <label htmlFor="email" className="block text-gray-700 mb-2 dark:text-[#F4F4F4]">
                Email:
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
