import { Metadata } from "next";
import TeamInfo from "./TeamInfo";
import TeamMembers from "./TeamMembers";
import TeamInviteKeys from "./TeamInviteKeys";
import TeamPositions from "./TeamPositions";
import AccountInfo from "./AccountInfo";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Team Management",
};

export default function TeamManagementPage() {
  const team = useQuery(api.team.get);

  if (!team) {
    return <Skeleton className="w-full h-8 rounded mb-4" />;
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {team.isSelfAdmin ? (
        <div className="grid grid-cols-2 gap-8">
          <TeamInfo team={team} />

          <AccountInfo team={team} />
        </div>
      ) : (
        <AccountInfo team={team} />
      )}

      <TeamMembers team={team} />

      <TeamPositions team={team} canEdit={team.isSelfAdmin} />

      {team.isSelfAdmin && <TeamInviteKeys teamID={team._id} />}
    </div>
  );
}
