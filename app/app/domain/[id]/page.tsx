export const instant = false;

import { redirect } from "next/navigation";
import { connection } from "next/server";

export default async function AppDomainRedirectPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  redirect(`/dashboard/domain/${id}`);
}
