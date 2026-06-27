"use client";

import { useActionState } from "react";
import { updateVehicle } from "../../actions";

const initialState = { error: "" };

interface Vehicle {
  id: string;
  title: string;
  plateNumber: string;
  mileage: number;
  registrationDate: string;
  startingPrice: number;
  minBidIncrement: number;
  description: string;
}

export default function EditVehicleForm({ vehicle }: { vehicle: Vehicle }) {
  const [state, formAction, isPending] = useActionState(
    updateVehicle.bind(null, vehicle.id),
    initialState
  );

  return (
    <form action={formAction} className="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">标题 *</label>
        <input name="title" defaultValue={vehicle.title} required className="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">车牌号 *</label>
          <input name="plateNumber" defaultValue={vehicle.plateNumber} required className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">上牌时间 *</label>
          <input name="registrationDate" defaultValue={vehicle.registrationDate} required className="w-full border rounded px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">里程 (km) *</label>
          <input name="mileage" type="number" defaultValue={vehicle.mileage} required className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">起拍价 (¥) *</label>
          <input name="startingPrice" type="number" step="0.01" defaultValue={vehicle.startingPrice} required className="w-full border rounded px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">加价幅度 (¥) *</label>
        <input name="minBidIncrement" type="number" step="0.01" defaultValue={vehicle.minBidIncrement} required className="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">描述</label>
        <textarea name="description" defaultValue={vehicle.description} rows={3} className="w-full border rounded px-3 py-2 text-sm" />
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
