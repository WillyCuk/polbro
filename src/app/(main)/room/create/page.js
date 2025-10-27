"use client";
import { useState } from "react";
import { FaPlus, FaCopy, FaTrash } from "react-icons/fa";
import useSWRMutation from "swr/mutation";
import { useRouter } from "next/navigation";
import withAuth from "../../protected_route";

async function sendCreatePollRequest(url, { arg }) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create poll.");
  }
  return response.json();
}

const CreateRoomPage = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([
    { id: crypto.randomUUID(), option: "", desc: "" },
    { id: crypto.randomUUID(), option: "", desc: "" },
  ]);
  const [pollLink, setPollLink] = useState("");
  const [pollCode, setPollCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [expiryHours, setExpiryHours] = useState(1);
  const [expiryMinutes, setExpiryMinutes] = useState(0);

  const colorOptions = [
    "#4285F4",
    "#EA4335",
    "#34A853",
    "#FF9800",
    "#9C27B0",
    "#607D8B",
  ];

  const { trigger, isMutating, reset } = useSWRMutation(
    `${process.env.NEXT_PUBLIC_POLLING_BACKEND_API_URL}/api/v1/polling`,
    sendCreatePollRequest,
    {
      onSuccess: (data) => {
        setSuccessMessage("Poll created successfully!");
        setPollCode(data.data.code); // Simpan pollCode untuk navigasi
        setPollLink(`localhost:3000/room/voting/${data.data.code}`); // Simpan link dari respons
        setErrorMessage("");
      },
      onError: (err) => {
        console.error(err);
        setErrorMessage(err.message);
        setSuccessMessage("");
      },
    }
  );

  const handleOptionChange = (id, field, value) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt))
    );
  };

  const handleAddOption = () => {
    if (options.length >= colorOptions.length) {
      setErrorMessage(`You can only add up to ${colorOptions.length} options.`);
      return;
    }
    setOptions([...options, { id: crypto.randomUUID(), option: "", desc: "" }]);
  };

  const handleRemoveOption = (id) => {
    if (options.length <= 2) {
      setErrorMessage("You must have at least two options.");
      return;
    }
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pollLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    reset();

    if (title.trim() === "" || question.trim() === "") {
      setErrorMessage("Please fill out the subject and question.");
      return;
    }
    const filledOptions = options.filter((opt) => opt.option.trim() !== "");
    if (filledOptions.length < 2) {
      setErrorMessage("Please provide at least two valid poll options.");
      return;
    }

    const now = new Date();
    const expiryInMs =
      (Number(expiryHours) * 3600 + Number(expiryMinutes) * 60) * 1000;
    // Hindari poll yang langsung expired
    if (expiryInMs <= 0) {
      setErrorMessage("Expiry time must be in the future.");
      return;
    }
    const expiredAtISO = new Date(now.getTime() + expiryInMs).toISOString();

    const pollingOption = filledOptions.map(({ option, desc }) => ({
      option,
      desc: desc || "",
    }));

    // 4. Buat request body
    const body = {
      title,
      question,
      expiredAt: expiredAtISO,
      pollingOption,
    };

    // 5. Kirim ke backend
    try {
      await trigger(body);
    } catch (e) {
      // onError akan menangani ini
    }
  };

  return (
    <form
      className="bg-white/90 rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] w-[90%] max-w-[900px] p-10 z-10 relative min-h-[600px]"
      onSubmit={handleSubmit}
    >
      {/* Poll Section */}
      <div className="flex flex-col gap-5 mb-8">
        <h2 className="text-xl text-gray-800 font-semibold">
          Create Your Poll
        </h2>

        {/* Subject Input */}
        <input
          type="text"
          className="w-full p-4 border border-gray-300 rounded-[10px] text-xl bg-gray-50 transition-all duration-300 ease-in-out focus:border-purple-700 focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(106,17,203,0.2)] placeholder:text-gray-500 text-gray-800 focus:text-gray-900"
          id="poll-subject"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter subject"
        />

        {/* Question Input */}
        <input
          type="text"
          className="w-full p-4 border border-gray-300 rounded-[10px] text-xl bg-gray-50 transition-all duration-300 ease-in-out focus:border-purple-700 focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(106,17,203,0.2)] placeholder:text-gray-500 text-gray-800 focus:text-gray-900 min-h-[60px]"
          id="poll-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask your question here..."
        />

        {/* Poll Options */}
        <div className="flex flex-col gap-4" id="poll-options">
          {options.map((opt, index) => (
            <div key={opt.id} className="flex items-center gap-4">
              <div
                className="w-5 h-5 rounded-full shrink-0"
                style={{
                  backgroundColor: colorOptions[index % colorOptions.length],
                }}
              ></div>

              {/* Wrapper untuk 2 input */}
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  className="flex-1 p-3 border border-gray-300 rounded-[10px] text-base bg-gray-50 transition-all duration-300 ease-in-out focus:border-purple-700 focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(106,17,203,0.2)] placeholder:text-gray-500 text-gray-800 focus:text-gray-900"
                  placeholder={`Option ${index + 1}`}
                  value={opt.option}
                  onChange={(e) =>
                    handleOptionChange(opt.id, "option", e.target.value)
                  }
                  disabled={isMutating || !!pollLink}
                  required
                />
                <input
                  type="text"
                  className="flex-1 p-3 border border-gray-300 rounded-[10px] text-base bg-gray-50 transition-all duration-300 ease-in-out focus:border-purple-700 focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(106,17,203,0.2)] placeholder:text-gray-500 text-gray-800 focus:text-gray-900"
                  placeholder="Description (optional)"
                  value={opt.desc}
                  onChange={(e) =>
                    handleOptionChange(opt.id, "desc", e.target.value)
                  }
                  disabled={isMutating || !!pollLink}
                />
              </div>

              {/* Tombol Hapus Opsi */}
              <button
                type="button" // <-- TAMBAHAN (penting agar tidak submit form)
                className="text-red-500 text-xl cursor-pointer  transition-all duration-300 ease-in-out hover:scale-110 disabled:opacity-50"
                onClick={() => handleRemoveOption(opt.id)} // <-- TAMBAHAN
                disabled={isMutating || !!pollLink || options.length <= 2} // <-- TAMBAHAN
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        {/* Add Option Button */}
        <button
          type="button"
          className="self-start py-2.5 px-5 bg-transparent text-purple-700 border border-dashed border-purple-700 rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out flex items-center gap-2 hover:bg-purple-700/10 disabled:opacity-50"
          id="add-option-btn"
          onClick={handleAddOption}
          disabled={
            isMutating || !!pollLink || options.length >= colorOptions.length
          }
        >
          <FaPlus /> Add option
        </button>
      </div>

      {/* Settings Section */}
      <div className="flex flex-col gap-5 mb-8">
        <h2 className="text-xl text-gray-800 font-semibold">Settings</h2>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-base">Polling expires in</span>
            <div className="flex items-center gap-4">
              <input
                type="number"
                className="p-2.5 border border-gray-300 rounded-[10px] text-base bg-gray-50 transition-all duration-300 ease-in-out focus:border-purple-700 focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(106,17,203,0.2)] w-24 text-gray-800 focus:text-gray-900"
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                min="0"
                max="24"
                disabled={isMutating || !!pollLink}
              />
              <span className="text-gray-600">hours</span>
              <input
                type="number"
                className="p-2.5 border border-gray-300 rounded-[10px] text-base bg-gray-50 transition-all duration-300 ease-in-out focus:border-purple-700 focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(106,17,203,0.2)] w-24 text-gray-800 focus:text-gray-900"
                value={expiryMinutes}
                onChange={(e) => setExpiryMinutes(e.target.value)}
                min="0"
                max="59"
                step="5"
                disabled={isMutating || !!pollLink}
              />
              <span className="text-gray-600">minutes</span>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-[10px] bg-red-100 text-red-800 border border-red-300 text-center">
          {errorMessage}
        </div>
      )}
      {successMessage && !pollLink && (
        <div className="mb-4 p-3 rounded-[10px] bg-blue-100 text-blue-800 border border-blue-300 text-center">
          {successMessage} Generating link...
        </div>
      )}

      {pollLink && (
        <div className="flex flex-col gap-4 mb-8">
          <h2 className="text-xl text-green-600 font-semibold">
            Poll Created Successfully!
          </h2>
          <p>Share this link with your voters:</p>
          <div className="flex gap-2.5">
            <input
              type="text"
              className="flex-1 p-3 border border-gray-300 rounded-[10px] text-base bg-gray-100 transition-all duration-300 ease-in-out text-gray-800"
              id="share-link"
              readOnly
              value={pollLink}
            />
            <button
              type="button"
              className="py-3 px-5 bg-linear-to-br from-purple-700 to-purple-600 text-white border-none rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(106,17,203,0.4)]"
              id="copy-link-btn"
              onClick={handleCopy}
            >
              <FaCopy /> {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center mt-5">
        {/* Tampilkan 'Start Poll' / 'Cancel' HANYA jika poll BELUM dibuat */}
        {!pollLink && (
          <>
            <button
              type="submit"
              className="py-4 px-8 border-none rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out bg-linear-to-br from-purple-700 to-purple-600 text-white hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(106,17,203,0.4)] disabled:opacity-50"
              id="start-poll-btn"
              disabled={isMutating}
            >
              {isMutating ? "Starting..." : "Start Poll"}
            </button>
            <button
              type="button"
              className="py-4 px-8 border border-purple-700 rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out bg-transparent text-purple-700 hover:bg-purple-700 hover:text-white"
              id="cancel-btn"
              onClick={() => router.push("/")} // Kembali ke home
              disabled={isMutating}
            >
              Cancel
            </button>
          </>
        )}
        {pollLink && (
          <>
            {/* Tombol "View Poll" baru Anda */}
            <button
              type="button"
              className="py-4 px-8 border-none rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out bg-linear-to-br from-purple-700 to-purple-600 text-white hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(106,17,203,0.4)]"
              // Arahkan ke halaman vote menggunakan pollCode
              onClick={() => router.push(`/room/voting/${pollCode}`)}
            >
              View Poll
            </button>

            {/* Tombol "Create Another" */}
            <button
              type="button"
              className="py-4 px-8 border border-purple-700 rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out bg-transparent text-purple-700 hover:bg-purple-700 hover:text-white"
              onClick={() => window.location.reload()} // Refresh halaman
            >
              Create Another
            </button>
          </>
        )}
      </div>
    </form>
  );
};

export default withAuth(CreateRoomPage);
