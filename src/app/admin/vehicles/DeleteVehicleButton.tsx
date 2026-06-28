"use client";

import { useActionState } from "react";
import { deleteVehicle } from "./actions";
import ConfirmButton from "@/components/ConfirmButton";

export default function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteVehicle.bind(null, vehicleId),
    { error: "" }
  );

  return (
    <form action={formAction} className="inline">
      <ConfirmButton
        title="确定要删除这辆车吗？"
        description="此操作不可撤销。"
        confirmText="删除"
        variant="danger"
        loading={isPending}
        className="text-[#ff6b6b] hover:text-[#e55] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
      >
        {isPending ? "删除中..." : "删除车辆"}
      </ConfirmButton>
      {state.error && (
        <span className="text-[#ff6b6b] text-xs ml-2">{state.error}</span>
      )}
    </form>
  );
}
