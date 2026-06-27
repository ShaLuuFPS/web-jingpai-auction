"use client";

import { useActionState } from "react";
import { deleteVehicle } from "./actions";

export default function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteVehicle.bind(null, vehicleId),
    { error: "" }
  );

  return (
    <form action={formAction} className="inline">
      <button
        type="submit"
        disabled={isPending}
        onClick={(e) => {
          if (!confirm("确定要删除这辆车吗？此操作不可撤销。")) {
            e.preventDefault();
          }
        }}
        className="text-red-500 hover:text-red-700 text-sm cursor-pointer disabled:opacity-50"
      >
        {isPending ? "删除中..." : "🗑 删除车辆"}
      </button>
      {state.error && (
        <span className="text-red-500 text-xs ml-2">⚠ {state.error}</span>
      )}
    </form>
  );
}
