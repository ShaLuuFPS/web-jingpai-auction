"use client";

import Link from "next/link";
import { useState, useActionState } from "react";
import { logoutAction } from "@/app/actions";

interface NavbarProps {
  user: { nickname: string; role: string } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, logoutFormAction, isLoggingOut] = useActionState(logoutAction, null);

  return (
    <>
      {/* Logout loading overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">正在退出登录...</p>
          </div>
        </div>
      )}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-lg font-bold text-blue-700">
            🚗 竞拍系统
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            {user?.role === "admin" && (
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                后台管理
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">👤 {user.nickname}</span>
                <form action={logoutFormAction}>
                  <button type="submit" disabled={isLoggingOut} className="text-sm text-red-500 hover:text-red-700 cursor-pointer disabled:opacity-50">
                    {isLoggingOut ? "退出中..." : "退出"}
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800">
                登录
              </Link>
            )}
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-2">
            {!user && (
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800 px-2">
                登录
              </Link>
            )}
            <button
              className="p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="菜单"
            >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 border-t border-gray-100 pt-2">
            {user?.role === "admin" && (
              <Link href="/admin" className="block py-2 text-sm" onClick={() => setMenuOpen(false)}>
                后台管理
              </Link>
            )}
            {user ? (
              <>
                <span className="block py-2 text-sm text-gray-500">👤 {user.nickname}</span>
                <form action={logoutFormAction}>
                  <button
                    type="submit"
                    disabled={isLoggingOut}
                    className="block py-2 text-sm text-red-500 cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingOut ? "退出中..." : "退出登录"}
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="block py-2 text-sm text-blue-600" onClick={() => setMenuOpen(false)}>
                登录
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
    </>
  );
}
