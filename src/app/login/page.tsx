"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <>
      {/* Full-screen warm gradient glow — login page exclusive */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className="absolute inset-[-20%] opacity-50"
          style={{
            background:
              "radial-gradient(circle at 70% 30%, rgba(255,120,80,0.45), transparent 50%), " +
              "radial-gradient(circle at 80% 55%, rgba(255,180,60,0.45), transparent 50%), " +
              "radial-gradient(circle at 50% 25%, rgba(99,91,255,0.35), transparent 50%), " +
              "radial-gradient(circle at 85% 75%, rgba(200,60,180,0.35), transparent 50%)",
            filter: "blur(100px)",
            transform: "rotate(-8deg)",
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-[70vh]">

      <div className="relative w-full max-w-sm">
        <h1 className="text-[28px] font-semibold text-gray-900 text-center mb-8 tracking-tight">
          登录
        </h1>

        <form
          action={formAction}
          className="bg-white rounded-2xl p-8 space-y-5"
          style={{
            boxShadow:
              "0 50px 100px -20px rgba(50,50,93,0.1), 0 30px 60px -30px rgba(0,0,0,0.15)",
          }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              用户名
            </label>
            <input
              type="text"
              name="username"
              className="w-full border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm
                text-gray-900 placeholder:text-gray-400
                transition-all duration-200
                focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              密码
            </label>
            <input
              type="password"
              name="password"
              className="w-full border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm
                text-gray-900 placeholder:text-gray-400
                transition-all duration-200
                focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15"
              placeholder="请输入密码"
              required
            />
          </div>

          {state.error && (
            <div className="bg-red-50 border border-[#ff6b6b]/30 rounded-lg px-4 py-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#ff6b6b] shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-[#ff6b6b]">{state.error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#635bff] text-white rounded-lg px-4 py-2.5 text-sm font-medium
              transition-all duration-150 ease-out
              hover:bg-[#0a2540] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]
              active:translate-y-0
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isPending ? "登录中..." : "登录"}
          </button>

          <p className="text-xs text-gray-400 text-center pt-1">
            测试账号：admin / admin123 或 张三 / 123456
          </p>
        </form>
      </div>
    </div>
    </>
  );
}
