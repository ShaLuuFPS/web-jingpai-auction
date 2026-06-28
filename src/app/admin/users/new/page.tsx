"use client";

import { useActionState } from "react";
import { createUser } from "../actions";

const initialState = { error: "" };

export default function NewUserPage() {
  const [state, formAction, isPending] = useActionState(createUser, initialState);

  return (
    <div className="max-w-lg">
      <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-8">添加用户</h1>
      <form action={formAction} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名 *</label>
          <input name="username" required
            className="w-full border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm
              focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15"
            placeholder="登录用户名" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">昵称 *</label>
          <input name="nickname" required
            className="w-full border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm
              focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15"
            placeholder="显示名称" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">密码 *</label>
          <input name="password" type="password" required
            className="w-full border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm
              focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15"
            placeholder="至少6位" minLength={6} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">角色</label>
          <select name="role" defaultValue="user"
            className="w-full border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm text-gray-900
              focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15
              bg-white">
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
        </div>
        {state.error && (
          <div className="bg-red-50 border border-[#ff6b6b]/30 rounded-lg px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#ff6b6b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-[#ff6b6b]">{state.error}</span>
          </div>
        )}
        <button type="submit" disabled={isPending}
          className="bg-[#635bff] text-white px-6 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-150 ease-out
            hover:bg-[#0a2540] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]
            active:translate-y-0
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none">
          {isPending ? "创建中..." : "创建用户"}
        </button>
      </form>
    </div>
  );
}
