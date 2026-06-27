"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">登录</h1>
        <form action={formAction} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              name="username"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入用户名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              name="password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入密码"
              required
            />
          </div>
          {state.error && (
            <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="text-red-600 text-sm">⚠ {state.error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "登录中..." : "登录"}
          </button>
          <p className="text-xs text-gray-400 text-center">
            测试账号：admin / admin123 或 张三 / 123456
          </p>
        </form>
      </div>
    </div>
  );
}
