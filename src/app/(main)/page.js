"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import withAuth from "./protected_route";

const DashboardPage = () => {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const handleCreateRoom = () => {
    router.push("/room/create");
  };

  const handleJoinRoom = () => {
    if (roomId.trim() === "") {
      alert("Please enter a Room ID");
      return;
    }

    router.push(`/room/voting/${encodeURIComponent(roomId.trim())}`);
  };

  return (
    <div className="bg-white/90 rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] w-[90%] max-w-[800px] p-10 z-10 relative">
      {/* Welcome Message */}
      <div className="text-center mb-10">
        <h2 className="text-gray-800 text-3xl mb-2.5 font-bold">
          Welcome back, <span id="user-name">User</span>!
        </h2>
      </div>

      {/* Room Controls */}
      <div className="flex flex-col gap-5 w-full max-w-[500px] mx-auto">
        {/* Room Input Group */}
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 p-4 border border-gray-300 rounded-[10px] text-base bg-gray-50 transition-all duration-300 ease-in-out focus:border-purple-700 focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(106,17,203,0.2)] placeholder:text-gray-500 text-gray-800 focus:text-gray-900"
            id="room-id"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
          />
          <button
            className="px-6 py-4 border border-purple-700 rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out bg-transparent text-purple-700 hover:bg-purple-700 hover:text-white"
            id="join-room-btn"
            onClick={handleJoinRoom}
          >
            Join Room
          </button>
        </div>

        {/* Room Buttons */}
        <div className="flex gap-4">
          <button
            className="flex-1 p-4 border-none rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out bg-linear-to-br from-purple-700 to-purple-600 text-white hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(106,17,203,0.4)]"
            id="create-room-btn"
            onClick={handleCreateRoom}
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default withAuth(DashboardPage);
