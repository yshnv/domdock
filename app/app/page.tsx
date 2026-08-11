export const instant = false;

import { redirect } from "next/navigation";
import { connection } from "next/server";

export default async function AppRedirectPage() {
  await connection();
  redirect("/dashboard");
}
