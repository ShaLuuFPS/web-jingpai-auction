"use client";

import { useActionState } from "react";
import { updateUser } from "../../actions";

const initialState = { error: "" };

interface UserData {
  id: string;
  username: string;
  nickname: string;
  role: string;
  enabled: boolean;
}

export default function EditUserForm({ user }: { user: UserData }) {
  const [state, formAction, isPending] = useActionState(
    updateUser.bind(null, user.id),
    initialState
  );

  return (
    <form action={formAction} className="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">用户名</label>
        <input value={user.username} disabled className="w-full border rounded px-3 py-2 text-sm bg-gray-50 text-gray-400" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">昵称 *</label>
        <input name="nickname" defaultValue={user.nickname} required className="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">新密码（留空不修改）</label>
        <input name="password" type="password" className="w-full border rounded px-3 py-2 text-sm" placeholder="至少6位" minLength={6} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">角色</label>
          <select name="role" defaultValue={user.role} className="w-full border rounded px-3 py-2 text-sm">
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">状态</label>
          <select name="enabled" defaultValue={user.enabled ? "true" : "false"} className="w-full border rounded px-3 py-2 text-sm">
            <option value="true">启用</option>
            <option value="false">禁用</option>
          </select>
        </div>
      </div>
      {state.error && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3">
          <span className="text-red-600 text-sm">⚠ {state.error}</span>
        </div>
      )}
      <button type="submit" disabled={isPending} className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
        {isPending ? "保存中..." : "保存修改"}
      </button>
    </form>
  );
}
