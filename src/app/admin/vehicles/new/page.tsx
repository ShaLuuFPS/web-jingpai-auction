"use client";

import { useActionState } from "react";
import { createVehicle } from "../actions";

const initialState = { error: "" };

export default function NewVehiclePage() {
  const [state, formAction, isPending] = useActionState(createVehicle, initialState);

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">➕ 添加车辆</h1>
      <form action={formAction} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">标题 *</label>
          <input name="title" required className="w-full border rounded px-3 py-2 text-sm" placeholder="如：2020款 丰田卡罗拉" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">车牌号 *</label>
            <input name="plateNumber" required className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">上牌时间 *</label>
            <input name="registrationDate" required className="w-full border rounded px-3 py-2 text-sm" placeholder="2020-03" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">里程 (km) *</label>
            <input name="mileage" type="number" required className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">起拍价 (¥) *</label>
            <input name="startingPrice" type="number" step="0.01" required className="w-full border rounded px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">加价幅度 (¥) *</label>
          <input name="minBidIncrement" type="number" defaultValue={500} step="0.01" required className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">描述</label>
          <textarea name="description" rows={3} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        {state.error && (
          <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3">
            <span className="text-red-600 text-sm">⚠ {state.error}</span>
          </div>
        )}
        <button type="submit" disabled={isPending} className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {isPending ? "创建中..." : "创建车辆"}
        </button>
      </form>
    </div>
  );
}
