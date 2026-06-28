"use client";

import { useActionState } from "react";
import { clearEndedAuctions } from "./actions";
import ConfirmButton from "@/components/ConfirmButton";

const initialState = { error: "" };

export default function ClearEndedAuctionsButton() {
  const [state, formAction, isPending] = useActionState(clearEndedAuctions, initialState);

  return (
    <form action={formAction} className="inline">
      <ConfirmButton
        title="确定要清空所有已结束的拍卖吗？"
        description="此操作将删除所有已结束拍卖及其出价记录，并释放关联车辆。此操作不可撤销。"
        confirmText="清空"
        variant="danger"
        loading={isPending}
        className="bg-white border border-[#ff6b6b] text-[#ff6b6b] px-4 py-2 rounded-lg text-sm font-medium
          transition-all duration-150 ease-out
          hover:bg-[#ff6b6b] hover:text-white hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,107,107,0.2)]
          active:translate-y-0
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:bg-white disabled:hover:text-[#ff6b6b]"
      >
        {isPending ? "清空中..." : state.count ? `已清空 ${state.count} 场拍卖` : "一键清空拍卖"}
      </ConfirmButton>
      {state.error && (
        <span className="text-[#ff6b6b] text-xs ml-2">{state.error}</span>
      )}
    </form>
  );
}
