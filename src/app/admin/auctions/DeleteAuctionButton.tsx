"use client";

import { useActionState } from "react";
import { deleteAuction } from "./actions";
import ConfirmButton from "@/components/ConfirmButton";

const initialState = { error: "" };

export default function DeleteAuctionButton({ auctionId }: { auctionId: string }) {
  const [state, formAction, isPending] = useActionState(deleteAuction, initialState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="auctionId" value={auctionId} />
      <ConfirmButton
        title="确定要删除这个拍卖吗？"
        description="此操作不可撤销。"
        confirmText="删除"
        variant="danger"
        loading={isPending}
        className="text-xs text-[#ff6b6b] hover:text-[#e55] font-medium transition-colors cursor-pointer disabled:opacity-50"
      >
        {isPending ? "删除中..." : "删除"}
      </ConfirmButton>
      {state.error && (
        <span className="text-[#ff6b6b] text-xs ml-2">{state.error}</span>
      )}
    </form>
  );
}
