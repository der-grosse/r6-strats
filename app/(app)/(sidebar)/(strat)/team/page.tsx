import { getPayload } from "@/lib/auth/getPayload";
import { getInviteKeys } from "@/lib/auth/inviteKeys";
import { getTeam } from "@/lib/auth/team";
import { Metadata } from "next";
import TeamInfo from "./TeamInfo";
import TeamMembers from "./TeamMembers";
import TeamInviteKeys from "./TeamInviteKeys";
import TeamPlayerPositions from "./TeamPlayerPositions";
import AccountInfo from "./AccountInfo";

export const metadata: Metadata = {
  title: "Team Management",
};

export default async function TeamManagementPage() {
  const user = await getPayload();
  const team = await getTeam();
  const inviteKeys = user?.isAdmin ? await getInviteKeys() : [];

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {user?.isAdmin ? (
        <div className="grid grid-cols-2 gap-8">
          <TeamInfo team={team} />

          <AccountInfo team={team} />
        </div>
      ) : (
        <AccountInfo team={team} />
      )}

      <TeamMembers team={team} />

      <TeamPlayerPositions team={team} canEdit={user?.isAdmin ?? false} />

      {user?.isAdmin && <TeamInviteKeys inviteKeys={inviteKeys} />}
    </div>
  );
}
