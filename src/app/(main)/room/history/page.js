"use client";
import { useRouter } from "next/navigation";
import { FaCalendarAlt, FaClock, FaChevronRight } from "react-icons/fa";
import useSWR from "swr";
import withAuth from "../../protected_route";

const fetcher = async (url) => {
  const token = sessionStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found.");
  }
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    let errorMessage = "Failed to fetch polling history.";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      errorMessage = await res.text();
    }
    throw new Error(errorMessage);
  }
  const responseData = await res.json();
  // Pastikan data yang dikembalikan adalah array
  if (!responseData || !Array.isArray(responseData.data)) {
    throw new Error("Invalid data format received from API.");
  }
  return responseData.data;
};

const HistoryPage = () => {
  const router = useRouter();
  const {
    data: historyData,
    error,
    isLoading,
  } = useSWR("http://localhost:8000/api/v1/polling/my-pollings", fetcher);

  const handleHistoryItemClick = (pollCode) => {
    router.push(`/room/result/${encodeURIComponent(pollCode)}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      // Contoh format: Oct 26, 2025
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  // --- Render Logic ---

  // Tampilkan loading state
  if (isLoading) {
    return (
      <div className="bg-white/90 rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] w-[90%] max-w-[900px] p-10 z-10 relative min-h-[600px] flex items-center justify-center">
        <p className="text-lg text-gray-500">Loading history...</p>
      </div>
    );
  }

  // Tampilkan error state
  if (error) {
    return (
      <div className="bg-white/90 rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] w-[90%] max-w-[900px] p-10 z-10 relative min-h-[600px]">
        <h2 className="text-xl text-red-600 font-semibold mb-8">
          Error Loading History
        </h2>
        <p className="text-red-500 bg-red-100 p-4 rounded-lg">
          {error.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Jika tidak loading dan tidak error, tampilkan data (atau empty state)
  const polls = historyData || []; // Fallback ke array kosong jika data undefined

  return (
    <div className="bg-white/90 rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] w-[90%] max-w-[900px] p-10 z-10 relative min-h-[600px]">
      <h2 className="text-xl text-gray-800 font-semibold mb-8">
        Polling History
      </h2>

      <div className="flex flex-col gap-4" id="history-list">
        {polls.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p className="text-lg">No polling history found.</p>
            <p className="text-sm mt-2">
              Create your first poll to see it here!
            </p>
          </div>
        ) : (
          polls.map((item) => (
            <div
              key={item.id} // Gunakan ID unik dari API
              className="flex justify-between items-center p-5 bg-gray-50 rounded-[10px] cursor-pointer transition-all duration-300 ease-in-out hover:bg-purple-700/10 hover:-translate-y-0.5"
              onClick={() => handleHistoryItemClick(item.code)} // <-- Gunakan item.code
            >
              <div className="flex-1 mr-4">
                <div
                  className="text-xl font-semibold text-gray-800 mb-1 truncate"
                  title={item.title}
                >
                  {item.title}
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <FaClock className="text-purple-700" />
                    Expired: {formatDate(item.expiredAt)} {/* Format tanggal */}
                  </div>
                  {/* Tambahkan Room Code jika perlu */}
                  <div className="flex items-center gap-1 text-xs bg-gray-200 px-2 py-0.5 rounded">
                    Code: {item.code}
                  </div>
                </div>
              </div>

              <div className="text-purple-700 text-xl">
                <FaChevronRight />
              </div>
            </div>
          ))
        )}
      </div>

      {polls.length === 0 && !isLoading && !error && (
        <div className="text-center mt-10">
          <button
            className="px-8 py-3 bg-linear-to-br from-purple-700 to-purple-600 text-white ..."
            onClick={() => router.push("/room/create")} // Arahkan ke halaman create
          >
            Create Your First Poll
          </button>
        </div>
      )}
    </div>
  );
};

export default withAuth(HistoryPage);
