import { redirect } from "next/navigation";

export default async function AppDomainRedirectPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/domain/${id}`);
}
