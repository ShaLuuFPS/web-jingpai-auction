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

const inputClass = "w-full border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15";

export default function EditVehicleForm({ vehicle }: { vehicle: Vehicle }) {
  const [state, formAction, isPending] = useActionState(
    updateVehicle.bind(null, vehicle.id),
    initialState
  );

  return (
    <form action={formAction} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">标题 *</label>
        <input name="title" defaultValue={vehicle.title} required className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">车牌号 *</label>
          <input name="plateNumber" defaultValue={vehicle.plateNumber} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">上牌时间 *</label>
          <input name="registrationDate" defaultValue={vehicle.registrationDate} required className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">里程 (km) *</label>
          <input name="mileage" type="number" defaultValue={vehicle.mileage} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">起拍价 (¥) *</label>
          <input name="startingPrice" type="number" step="0.01" defaultValue={vehicle.startingPrice} required className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">加价幅度 (¥) *</label>
        <input name="minBidIncrement" type="number" step="0.01" defaultValue={vehicle.minBidIncrement} required className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
        <textarea name="description" defaultValue={vehicle.description} rows={3}
          className="w-full border border-[#e0e6eb] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/15" />
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
        {isPending ? "保存中..." : "保存修改"}
      </button>
    </form>
  );
}
