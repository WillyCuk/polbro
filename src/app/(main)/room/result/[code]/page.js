"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { io } from "socket.io-client";
import Link from "next/link";
import withAuth from "@/app/(main)/protected_route";

const fetcher = async (url) => {
  const token = sessionStorage.getItem("token");
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    let errorMessage = "Failed to fetch poll results.";
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

const colorPalette = [
  "#4285F4",
  "#EA4335",
  "#34A853",
  "#FF9800",
  "#9C27B0",
  "#00BCD4",
  "#E91E63",
  "#607D8B",
];

const ResultPage = () => {
  const router = useRouter();
  const params = useParams();
  const pollCode = params?.code;
  const { mutate } = useSWRConfig();

  const [errorMessage, setErrorMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

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

  console.log(
    `Result Render - isLoading: ${isLoading}, isValidating: ${isValidating}, loadError: ${
      loadError ? loadError.message : "null"
    }, pollResponse exists: ${!!pollResponse}, isExpired: ${isExpired}`
  );

  useEffect(() => {
    if (!pollResponse?.data || !pollCode) {
      console.log("WebSocket Effect: Menunggu data poll awal...");
      return;
    }

    const expiryDate = new Date(pollResponse.data.expiredAt);
    const now = new Date();
    const pollHasExpired = now >= expiryDate;
    setIsExpired(pollHasExpired);
    console.log(`WebSocket Effect: Poll Expired Check: ${pollHasExpired}`);

    if (pollHasExpired) {
      console.log(
        "WebSocket Effect: Poll sudah expired, tidak menghubungkan WebSocket."
      );
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    console.log("WebSocket Effect: Poll belum expired, setup WebSocket...");
    const token = sessionStorage.getItem("token");
    if (!token) {
      setErrorMessage("Token not found.");
      return;
    }

    if (!socketRef.current) {
      console.log("Creating WebSocket connection for results...");
      socketRef.current = io(process.env.NEXT_PUBLIC_POLLING_BACKEND_API_URL, {
        auth: { token: `Bearer ${token}` },
      });
    }
    const socket = socketRef.current;

    const handleConnect = () => {
      console.log("🟢 WS connected (Result):", socket.id);
      setIsConnected(true);
      setErrorMessage("");
      console.log(`🚀 Emitting polling:join for room ${pollCode}`);
      socket.emit("polling:join", pollCode);
    };
    const handleDisconnect = (reason) => {
      console.log("🔴 WS disconnected (Result):", reason);
      setIsConnected(false);
      if (reason !== "io client disconnect") setErrorMessage("Disconnected...");
    };
    const handlePollingRoom = (updatedOptionsArray) => {
      console.log(
        "📊 WS Received polling:room data (Result):",
        updatedOptionsArray
      );
      if (swrKey && !isExpired) {
        if (updatedOptionsArray && Array.isArray(updatedOptionsArray)) {
          console.log("Updating SWR cache with WS data (Result)...");
          mutate(
            swrKey,
            (currentFullResponse) => {
              if (!currentFullResponse?.data) return currentFullResponse;
              const updatedPollData = {
                ...currentFullResponse.data,
                pollingOption: updatedOptionsArray,
              };
              return { ...currentFullResponse, data: updatedPollData };
            },
            false
          );
        } else {
          console.warn("Invalid data from WS polling:room (Result)");
        }
      } else {
        console.warn("Skipping WS update: swrKey null or poll expired.");
      }
    };
    const handleException = (error) => {
      console.error("🚫 Server exception (Result):", error);
      setErrorMessage(error?.message || "Server error.");
    };

    socket.off("connect", handleConnect).on("connect", handleConnect);
    socket
      .off("disconnect", handleDisconnect)
      .on("disconnect", handleDisconnect);
    socket
      .off("polling:room", handlePollingRoom)
      .on("polling:room", handlePollingRoom);
    socket.off("exception", handleException).on("exception", handleException);

    return () => {
      if (socketRef.current) {
        console.log("🔌 Disconnecting WebSocket on unmount/re-run...");
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [pollCode, mutate, swrKey, pollResponse]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading poll results...</div>
      </div>
    );
  }
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

  const currentPollData = pollResponse?.data ?? {};
  const currentOptions = Array.isArray(currentPollData?.pollingOption)
    ? currentPollData.pollingOption
    : [];
  const pollTitle = currentPollData?.title ?? "Poll Results";
  const pollQuestion = currentPollData?.question ?? "Loading question...";

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

  const totalVotes = currentOptions.reduce(
    (sum, option) => sum + parseInt(option.total || "0", 10),
    0
  );
  const getPercentage = (votes) => {
    const numericVotes = parseInt(votes || "0", 10);
    if (totalVotes === 0) return 0;
    return ((numericVotes / totalVotes) * 100).toFixed(1);
  };

  return (
    <div className="bg-white/90 rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] w-[90%] max-w-[700px] p-10 z-10 relative">
      <div className="text-center mb-8">
        <div className="text-purple-700 text-3xl font-extrabold tracking-[2px] mb-5">
          POLBRO
        </div>
        <p
          className={`text-xs font-bold ${
            isExpired
              ? "text-gray-500"
              : isConnected
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {isExpired
            ? "● FINAL RESULTS"
            : isConnected
            ? "● LIVE RESULTS"
            : "● CONNECTING..."}
        </p>
        <h3 className="text-2xl text-gray-800 mt-4 mb-2.5 text-center font-bold">
          {pollTitle}
        </h3>
        <h2 className="text-3xl text-gray-800 mb-2.5 text-center font-bold">
          {pollQuestion}
        </h2>
        <div
          className="text-xl text-gray-600 mb-8 text-center"
          id="total-votes"
        >
          Total votes: {totalVotes}
        </div>
      </div>

      <div className="flex flex-col gap-5 mb-8" id="results-options">
        {currentOptions.length === 0 && !isLoading && !loadError && (
          <p className="text-center text-gray-500 py-4">
            No options or votes yet.
          </p>
        )}
        {currentOptions.map((option, index) => {
          const voteCount = parseInt(option?.total || "0", 10);
          const percentage = getPercentage(voteCount);
          const optionId = option?.id;
          const optionText = option?.option || "N/A";
          const optionColor = colorPalette[index % colorPalette.length];

          if (optionId === undefined || optionId === null) return null;

          return (
            <div key={optionId} className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <div className="text-lg text-gray-800 flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: optionColor }}
                  ></div>
                  <span className="truncate" title={optionText}>
                    {optionText}
                  </span>
                </div>
                <div className="text-lg text-gray-600 font-semibold shrink-0">
                  {voteCount} votes ({percentage}%)
                </div>
              </div>
              <div className="w-full h-5 bg-gray-200 rounded-[10px] overflow-hidden">
                <div
                  className="h-full rounded-[10px] transition-all duration-500 ease-out"
                  style={{
                    backgroundColor: optionColor,
                    width: `${percentage}%`,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-[10px] bg-red-100 text-red-800 border border-red-300 text-center">
          {errorMessage}
        </div>
      )}

      <Link
        href="/"
        className="block p-4 bg-transparent text-purple-700 border border-purple-700 rounded-[10px] text-lg font-semibold cursor-pointer transition-all duration-300 ease-in-out w-full hover:bg-purple-700 hover:text-white text-center no-underline"
        id="back-to-home-btn"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default withAuth(ResultPage);
