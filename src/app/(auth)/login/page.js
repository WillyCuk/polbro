"use client";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";
import useSWRMutation from "swr/mutation";
import { useRouter } from "next/navigation";

async function sendLoginRequest(url, { arg }) {
  // (Same as above)
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login failed. Please try again.");
  }
  return response.json();
}
// --- End of sender function ---

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();

  // --- 3. Add state for success/error messages ---

  const { trigger, isMutating, error, reset } = useSWRMutation(
    `${process.env.NEXT_PUBLIC_AUTH_BACKEND_API_URL}/api/v1/auth/login`,
    sendLoginRequest,
    {
      // --- 4. Update onSuccess handler ---
      onSuccess: (data) => {
        console.log("Login successful!", data);
        sessionStorage.setItem("token", data.token);

        // Set success message
        setSuccessMessage("Login successful! Redirecting...");

        // Wait 1.5 seconds, then redirect to dashboard
        setTimeout(() => {
          router.push("/"); // <-- Or wherever you want to go
        }, 1000);
      },
      onError: (err) => {
        console.log(`${process.env.BACKEND_API_URL}/api/v1/auth/login`);
        console.error(err.message);
        setSuccessMessage(""); // Clear any old success message
      },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- 5. Clear old messages on new submit ---
    setSuccessMessage("");
    reset(); // Clears the 'error' object from the last try

    try {
      await trigger({ email, password });
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
            Welcome back!
          </h2>
          <p className="text-gray-600 text-base">Login to your account</p>
        </div>

        {/* Form */}
        <form id="login" onSubmit={handleSubmit}>
          {/* Username Input */}
          <div className="mb-5 relative">
            <input
              type="email"
              id="login-email"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 border border-gray-300 rounded-[10px] text-base bg-gray-50 transition-all duration-300 ease-in-out focus:border-purple-700 focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(106,17,203,0.2)] placeholder:text-gray-500 text-gray-800 focus:text-gray-900"
            />
          </div>

          {/* Password Input */}
          <div className="mb-5 relative">
            <input
              type={showPassword ? "text" : "password"}
              id="login-password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-4 pr-12 border border-gray-300 rounded-[10px] text-base bg-gray-50 transition-all duration-300 ease-in-out focus:border-purple-700 focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(106,17,203,0.2)] placeholder:text-gray-500 text-gray-800 focus:text-gray-900"
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
              {/* Display the specific error from your backend */}
              {error.message}
            </div>
          )}

          <button
            type="submit"
            className="block w-full p-4 border-none rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out mb-4 text-center bg-linear-to-br from-purple-700 to-purple-600 text-white hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(106,17,203,0.4)]"
          >
            Login
          </button>
          {isMutating ? "Logging in..." : "Login"}

          {/* Sign Up Button */}
          <Link
            href="/sign-up"
            className="block w-full p-4 border border-purple-700 rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out mb-4 text-center bg-transparent text-purple-700 hover:bg-purple-700 hover:text-white no-underline"
          >
            Sign Up
          </Link>
        </form>
      </div>
    </div>
  );
}
