"use client";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";
import useSWRMutation from "swr/mutation";
import { useRouter } from "next/navigation";

async function sendSignupRequest(url, { arg }) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // We send the 'arg' object as the body
    body: JSON.stringify(arg),
  });

  // Handle errors
  if (!response.ok) {
    const errorData = await response.json();
    // Throw an error to be caught by useSWRMutation
    throw new Error(errorData.message || "Signup failed.");
  }

  // Return the success data (e.g., the new user object)
  return response.json();
}

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter(); // <-- 2. Initialize the router

  // --- 3. Add state for your success popup ---
  const [successMessage, setSuccessMessage] = useState("");

  // 2. Setup the mutation hook
  const { trigger, isMutating, error, reset } = useSWRMutation(
    `${process.env.NEXT_PUBLIC_AUTH_BACKEND_API_URL}/api/v1/auth/signup`,
    sendSignupRequest,
    {
      // 3. (Optional) Handle success/error
      onSuccess: (data) => {
        // Set the success popup message
        setSuccessMessage("Account created! Redirecting to login...");

        // Clear the form
        setFullname("");
        setEmail("");
        setPassword("");

        // Wait 2 seconds, then redirect to login
        setTimeout(() => {
          router.push("/login"); // <-- Redirect
        }, 1000);
      },
      onError: (err) => {},
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 4. Call 'trigger' with all three fields
    try {
      await trigger({ fullname, email, password });
    } catch (e) {
      // Errors are handled by the 'onError' option
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white/90 rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] w-[90%] max-w-[400px] p-10 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-purple-700 text-4xl font-extrabold tracking-[2px]">
            POLBRO
          </h1>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h2 className="text-gray-800 text-3xl mb-2.5 font-bold">
            Create Account
          </h2>
        </div>

        {/* Form */}
        <form id="signup" onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="mb-5 relative">
            <input
              type="text"
              id="signup-name"
              placeholder="Username"
              required
              onChange={(e) => setFullname(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-[10px] text-base bg-gray-50 transition-all duration-300 ease-in-out focus:border-purple-700 focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(106,17,203,0.2)] placeholder:text-gray-500  text-gray-800 focus:text-gray-900"
            />
          </div>

          {/* Email Input */}
          <div className="mb-5 relative">
            <input
              type="email"
              id="signup-email"
              placeholder="Email Address"
              required
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-[10px] text-base bg-gray-50 transition-all duration-300 ease-in-out focus:border-purple-700 focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(106,17,203,0.2)] placeholder:text-gray-500  text-gray-800 focus:text-gray-900"
            />
          </div>

          {/* Password Input */}
          <div className="mb-5 relative">
            <input
              type={showPassword ? "text" : "password"}
              id="signup-password"
              placeholder="Password"
              required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-[10px] text-base bg-gray-50 transition-all duration-300 ease-in-out focus:border-purple-700 focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(106,17,203,0.2)] placeholder:text-gray-500 text-gray-800 focus:text-gray-900"
            />
            {showPassword ? (
              <FaEyeSlash
                className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-600 hover:text-purple-700 transition-colors duration-200"
                onClick={togglePasswordVisibility}
              />
            ) : (
              <FaEye
                className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-600 hover:text-purple-700 transition-colors duration-200"
                onClick={togglePasswordVisibility}
              />
            )}
          </div>

          {successMessage && (
            <div className="mb-4 p-3 rounded-[10px] bg-green-100 text-green-800 border border-green-300 text-center">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-[10px] bg-red-100 text-red-800 border border-red-300 text-center">
              {error.message}
            </div>
          )}

          {/* Sign Up Button */}
          <button
            type="submit"
            className="block w-full p-4 border-none rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out mb-4 text-center bg-linear-to-br from-purple-700 to-purple-600 text-white hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(106,17,203,0.4)]"
          >
            Sign Up
          </button>

          {/* Login Button */}
          <Link
            href="/login"
            className="block w-full p-4 border border-purple-700 rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out mb-4 text-center bg-transparent text-purple-700 hover:bg-purple-700 hover:text-white no-underline"
          >
            Login
          </Link>
        </form>
      </div>
    </div>
  );
}
