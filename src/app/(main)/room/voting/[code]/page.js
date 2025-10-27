"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { io } from "socket.io-client";
import withAuth from "@/app/(main)/protected_route";

// --- Fetcher untuk useSWR ---
const fetcher = async (url) => {
  const token = sessionStorage.getItem("token");
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    let errorMessage = "Failed to fetch poll data.";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      errorMessage = await res.text();
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

const JoinPollPage = () => {
  const router = useRouter();
  const params = useParams();
  const pollCode = params?.code;
  const { mutate } = useSWRConfig();

  const [selectedOption, setSelectedOption] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);

  const swrKey = pollCode
    ? `${process.env.NEXT_PUBLIC_POLLING_BACKEND_API_URL}/api/v1/polling/code/${pollCode}`
    : null;

  const {
    data: pollResponse,
    error: loadError,
    isLoading,
    isValidating,
  } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Log state penting
  console.log(
    `Render - isLoading: ${isLoading}, isValidating: ${isValidating}, loadError: ${
      loadError ? loadError.message : "null"
    }, pollResponse exists: ${!!pollResponse}, data obj exists: ${!!pollResponse?.data}`
  );

  // --- Setup Koneksi WebSocket ---
  useEffect(() => {
    if (!pollCode) return;
    const token = sessionStorage.getItem("token");
    if (!token) {
      setErrorMessage("Authentication token not found. Please login.");
      return;
    }

    if (!socketRef.current) {
      console.log("Creating WebSocket connection...");
      socketRef.current = io(process.env.NEXT_PUBLIC_POLLING_BACKEND_API_URL, {
        auth: { token: `Bearer ${token}` },
      });
    }
    const socket = socketRef.current;

    // --- IMPLEMENTASI FUNGSI HANDLER WEBSOCKET ---
    const handleConnect = () => {
      console.log("🟢 WebSocket connected:", socket.id);
      setIsConnected(true);
      setErrorMessage("");
      console.log(`🚀 Emitting polling:join for room ${pollCode}`);
      socket.emit("polling:join", pollCode);
    };

    const handleDisconnect = (reason) => {
      console.log("🔴 WebSocket disconnected:", reason);
      setIsConnected(false);
      if (reason !== "io client disconnect") {
        setErrorMessage("Disconnected from server. Attempting to reconnect...");
      }
    };

    const handlePollingRoom = (updatedOptionsArray) => {
      console.log("📊 WS Received polling:room data:", updatedOptionsArray);
      if (swrKey) {
        if (updatedOptionsArray && Array.isArray(updatedOptionsArray)) {
          console.log("Updating SWR cache with WS data...");
          mutate(
            swrKey,
            (currentFullResponse) => {
              if (!currentFullResponse?.data) {
                console.warn(
                  "Skipping SWR mutate: initial data not yet available."
                );
                return currentFullResponse;
              }
              const updatedPollData = {
                ...currentFullResponse.data,
                pollingOption: updatedOptionsArray,
              };
              console.log("New SWR cache data:", {
                ...currentFullResponse,
                data: updatedPollData,
              });
              return { ...currentFullResponse, data: updatedPollData };
            },
            false
          );
        } else {
          console.warn(
            "Invalid data format from WS polling:room (expected array)"
          );
        }
      } else {
        console.warn("Cannot mutate SWR cache: swrKey is null");
      }
      setIsSubmitting(false);
      setSelectedOption(null);
    };

    const handleException = (error) => {
      console.error("🚫 Server exception:", error);
      setErrorMessage(error?.message || "An error occurred on the server.");
      setIsSubmitting(false);
    };
    // --- AKHIR IMPLEMENTASI FUNGSI HANDLER ---

    // Listener Event WebSocket
    socket.off("connect", handleConnect).on("connect", handleConnect);
    socket
      .off("disconnect", handleDisconnect)
      .on("disconnect", handleDisconnect);
    socket
      .off("polling:room", handlePollingRoom)
      .on("polling:room", handlePollingRoom);
    socket.off("exception", handleException).on("exception", handleException);

    // Cleanup
    return () => {
      if (socketRef.current) {
        console.log("🔌 Disconnecting WebSocket on unmount...");
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [pollCode, mutate, swrKey]);

  const handleSubmit = () => {
    const socket = socketRef.current;
    if (selectedOption === null || !socket || !isConnected) return;
    setErrorMessage("");
    setIsSubmitting(true);
    console.log(`🚀 Emitting polling:submit for option ${selectedOption}`);
    socket.emit("polling:submit", {
      room: pollCode,
      pollingOptionId: selectedOption,
    });
  };

  const handleOptionSelect = (optionId) => {
    if (isSubmitting) return;
    setSelectedOption(optionId);
    setErrorMessage("");
  };

  // --- Render Logic ---

  // 1. Loading Awal
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading poll...</div>
      </div>
    );
  }

  // 2. Error Fatal Awal
  if (loadError && !pollResponse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-10 bg-red-100 text-red-800 rounded-[20px] shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Poll</h2>
          <p className="mb-4">{loadError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 3. Ambil data atau default
  const currentPollData = pollResponse?.data ?? {};
  const currentOptions = Array.isArray(currentPollData?.pollingOption)
    ? currentPollData.pollingOption
    : [];
  const pollTitle = currentPollData?.title ?? "Loading Title...";
  const pollQuestion = currentPollData?.question ?? "Loading Question...";

  // 4. Kondisi Poll Tidak Ditemukan (setelah loading selesai tapi data utama kosong)
  if (!isLoading && !loadError && !pollResponse?.data && pollCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-10 bg-yellow-100 text-yellow-800 rounded-[20px] shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Poll Not Found</h2>
          <p>
            Could not find poll data for code: <strong>{pollCode}</strong>.
          </p>
          <p className="mt-2">
            Please check the code or contact the administrator.
          </p>
          {loadError && (
            <p className="mt-2 text-red-600">
              Last known error: {loadError.message}
            </p>
          )}
          <button
            onClick={() => router.push("/")}
            className="mt-6 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Hitung total vote
  const totalVotes = currentOptions.reduce(
    (sum, option) => sum + parseInt(option.total || "0", 10),
    0
  );

  return (
    <div className="bg-white/90 rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] w-[90%] max-w-[700px] p-10 z-10 relative">
      <div className="text-center mb-8">
        <div className="text-purple-700 text-3xl font-extrabold tracking-[2px] mb-5">
          POLBRO
        </div>
      </div>
      <div className="bg-purple-700/10 py-2.5 px-4 rounded-[10px] mb-5 text-center text-purple-700 font-semibold">
        Room ID: {pollCode}
        <span
          className={`ml-4 text-xs font-bold ${
            isConnected ? "text-green-600" : "text-red-600"
          }`}
        >
          {isConnected ? "● LIVE" : "● DISCONNECTED"}
        </span>
      </div>

      <h3 className="text-2xl text-gray-800 mb-2.5 text-center">{pollTitle}</h3>
      <h2 className="text-3xl text-gray-800 mb-8 text-center">
        {pollQuestion}
      </h2>

      <div className="flex flex-col gap-4 mb-8" id="voting-options">
        {/* Kondisi jika opsi kosong tapi poll ADA */}
        {currentOptions.length === 0 && !isLoading && !loadError && (
          <p className="text-center text-gray-500">
            This poll currently has no options.
          </p>
        )}
        {currentOptions.map((option) => {
          const voteCount = parseInt(option?.total || "0", 10);
          const percentage =
            totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
          const optionId = option?.id;
          const optionText = option?.option || "Unnamed Option";
          const optionDesc = option?.desc;

          if (optionId === undefined || optionId === null) return null;

          return (
            <div
              key={optionId}
              className={`option-item p-4 border rounded-lg transition relative overflow-hidden ${
                selectedOption === optionId
                  ? "bg-purple-100 border-purple-400 ring-2 ring-purple-300"
                  : "border-gray-300 hover:bg-gray-50"
              } ${
                isSubmitting
                  ? "cursor-not-allowed opacity-70"
                  : "cursor-pointer"
              }`}
              onClick={() => handleOptionSelect(optionId)}
            >
              <div className="flex justify-between items-center z-10 relative mb-1">
                <span className="font-medium text-gray-800">{optionText}</span>
                <span className="font-semibold text-gray-600 text-sm">
                  {voteCount} votes ({percentage}%)
                </span>
              </div>
              <div
                className="progress-bar-fill absolute top-0 left-0 h-full bg-purple-200 z-0 rounded-lg transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              ></div>
              {optionDesc && (
                <p className="text-sm text-gray-500 relative z-10 mt-1">
                  {optionDesc}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-[10px] bg-red-100 text-red-800 border border-red-300 text-center">
          {errorMessage}
        </div>
      )}

      <button
        className={`p-4 border-none rounded-[10px] text-lg font-semibold cursor-pointer transition-all duration-300 ease-in-out w-full bg-linear-to-br from-purple-700 to-purple-600 text-white ${
          selectedOption === null || isSubmitting || !isConnected
            ? "opacity-50 cursor-not-allowed"
            : "hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(106,17,203,0.4)]"
        }`}
        id="submit-vote-btn"
        onClick={handleSubmit}
        disabled={selectedOption === null || isSubmitting || !isConnected}
      >
        {isSubmitting
          ? "Submitting..."
          : !isConnected
          ? "Connecting..."
          : "Submit"}
      </button>
      <button
        type="button"
        onClick={() => router.push("/")}
        className="mt-4 w-full text-center text-gray-500 hover:text-gray-700 text-sm"
      >
        Leave Room
      </button>
    </div>
  );
};

export default withAuth(JoinPollPage);
