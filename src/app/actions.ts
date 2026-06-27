"use server";

import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function logoutAction(prevState: any, formData: FormData) {
  const session = await getSession();
  session.destroy();
  await session.save();
  redirect("/");
}
