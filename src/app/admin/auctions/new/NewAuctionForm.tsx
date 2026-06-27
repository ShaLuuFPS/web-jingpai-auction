"use client";

import { useActionState } from "react";
import { createAuction } from "../actions";

const initialState = { error: "" };

interface Vehicle {
  id: string;
  title: string;
  startingPrice: number;
}

export default function NewAuctionForm({ vehicles }: { vehicles: Vehicle[] }) {
  const [state, formAction, isPending] = useActionState(createAuction, initialState);

  return (
    <form action={formAction} className="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">选择车辆 *</label>
        <select name="vehicleId" required className="w-full border rounded px-3 py-2 text-sm">
          <option value="">-- 请选择 --</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title} (起拍价 ¥{v.startingPrice.toLocaleString()})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">倒计时重置秒数</label>
        <input name="bidResetSeconds" type="number" defaultValue={120} className="w-full border rounded px-3 py-2 text-sm" />
      </div>
      {state.error && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3">
          <span className="text-red-600 text-sm">⚠ {state.error}</span>
        </div>
      )}
      <button type="submit" disabled={isPending} className="bg-green-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50">
        {isPending ? "创建中..." : "创建拍卖"}
      </button>
    </form>
  );
}
