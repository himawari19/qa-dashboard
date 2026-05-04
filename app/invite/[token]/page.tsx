import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getInviteByToken } from "@/lib/invites";
import { InviteView } from "./invite-view";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  if (!invite) notFound();

  const user = await getCurrentUser();
  return <InviteView invite={JSON.parse(JSON.stringify(invite))} currentUser={JSON.parse(JSON.stringify(user))} token={token} />;
}
