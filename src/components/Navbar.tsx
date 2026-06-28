"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useActionState } from "react";
import { logoutAction } from "@/app/actions";

interface NavbarProps {
  user: { nickname: string; role: string } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [, logoutFormAction, isLoggingOut] = useActionState(logoutAction, null);

  const isAdmin = pathname.startsWith("/admin");
  const isLogin = pathname === "/login";

  // On login page: transparent nav with no border (blends with glow bg)
  // Admin pages: solid white
  // Front pages: translucent with backdrop blur
  const navClass = isLogin
    ? "bg-transparent"
    : isAdmin
      ? "bg-white border-b border-gray-100"
      : "bg-white/85 backdrop-blur-md border-b border-gray-100";

  return (
    <>
      {/* Logout loading overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#635bff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium">正在退出登录...</p>
          </div>
        </div>
      )}

      <nav className={`fixed top-0 w-full z-40 ${navClass}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-[60px] flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-base md:text-lg font-semibold text-[#635bff] tracking-tight"
          >
            竞拍系统
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                后台管理
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{user.nickname}</span>
                <form action={logoutFormAction}>
                  <button
                    type="submit"
                    disabled={isLoggingOut}
                    className="text-sm text-gray-400 hover:text-[#ff6b6b] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingOut ? "退出中..." : "退出"}
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-[#635bff] hover:text-[#4f49cc] transition-colors"
              >
                登录
              </Link>
            )}
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-2">
            {!user && (
              <Link
                href="/login"
                className="text-sm font-medium text-[#635bff] px-2"
              >
                登录
              </Link>
            )}
            <button
              className="p-2 text-gray-500 hover:text-gray-900"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="菜单"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 border-t border-gray-100 pt-3 bg-white">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="block py-2 text-sm text-gray-600"
                onClick={() => setMenuOpen(false)}
              >
                后台管理
              </Link>
            )}
            {user ? (
              <>
                <span className="block py-2 text-sm text-gray-400">
                  {user.nickname}
                </span>
                <form action={logoutFormAction}>
                  <button
                    type="submit"
                    disabled={isLoggingOut}
                    className="block py-2 text-sm text-gray-400 hover:text-[#ff6b6b] cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingOut ? "退出中..." : "退出登录"}
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="block py-2 text-sm text-[#635bff]"
                onClick={() => setMenuOpen(false)}
              >
                登录
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Spacer — matches nav height so content doesn't hide behind fixed nav */}
      <div className={isAdmin ? "h-14" : "h-14 md:h-[60px]"} />
    </>
  );
}
