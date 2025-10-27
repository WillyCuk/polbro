"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Define navigation items
  const navItems = [
    { name: "HISTORY", href: "/room/history" },
    { name: "HOME", href: "/" },
  ];

  // Check if current path matches the nav item
  const isActive = (href) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-linear-to-br from-purple-700 to-purple-600 relative overflow-hidden font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]">
          {/* Decorative circles */}
          <div className="absolute w-[200px] h-[200px] bg-white rounded-full opacity-10 top-[10%] left-[5%]"></div>
          <div className="absolute w-[150px] h-[150px] bg-[#FF9A8B] rounded-full opacity-10 bottom-[15%] left-[10%]"></div>
          <div className="absolute w-[120px] h-[120px] bg-[#4FACFE] rounded-full opacity-10 top-[15%] right-[10%]"></div>
          <div className="absolute w-[180px] h-[180px] bg-[#43E97B] rounded-full opacity-10 bottom-[10%] right-[5%]"></div>
          <div className="absolute w-[100px] h-[100px] bg-[#FA709A] rounded-full opacity-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>

          {/* Main App Container */}
          <div className="flex flex-col min-h-screen w-full">
            {/* Dashboard Header */}
            <div className="bg-white/90 rounded-b-[20px] shadow-[0_5px_15px_rgba(0,0,0,0.1)] py-5 px-8 z-10 relative">
              <div className="flex justify-between items-center">
                {/* Logo */}
                <Link
                  href="/"
                  className="text-purple-700 text-3xl font-extrabold tracking-[2px] no-underline"
                >
                  POLBRO
                </Link>

                {/* Navigation Links */}
                <div className="flex gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-5 py-2 border-none rounded-[20px] font-semibold cursor-pointer transition-all duration-300 ease-in-out no-underline ${
                        isActive(item.href)
                          ? "bg-linear-to-br from-purple-700 to-purple-600 text-white"
                          : "bg-transparent text-gray-600 hover:bg-purple-700 hover:text-white"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="flex-1 flex justify-center items-center p-5">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
