"use client";

import { useActionState } from "react";
import { createUser } from "../actions";

const initialState = { error: "" };

export default function NewUserPage() {
  const [state, formAction, isPending] = useActionState(createUser, initialState);

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">➕ 添加用户</h1>
      <form action={formAction} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">用户名 *</label>
          <input name="username" required className="w-full border rounded px-3 py-2 text-sm" placeholder="登录用户名" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">昵称 *</label>
          <input name="nickname" required className="w-full border rounded px-3 py-2 text-sm" placeholder="显示名称" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">密码 *</label>
          <input name="password" type="password" required className="w-full border rounded px-3 py-2 text-sm" placeholder="至少6位" minLength={6} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">角色</label>
          <select name="role" defaultValue="user" className="w-full border rounded px-3 py-2 text-sm">
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
        </div>
        {state.error && (
          <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3">
            <span className="text-red-600 text-sm">⚠ {state.error}</span>
          </div>
        )}
        <button type="submit" disabled={isPending} className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {isPending ? "创建中..." : "创建用户"}
        </button>
      </form>
    </div>
  );
}
