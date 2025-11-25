import { Doc, Id } from "@/convex/_generated/dataModel";

export interface FullTeam extends Doc<"teams"> {
  teamPositions: TeamPosition[];
  members: TeamMember[];
}

export interface TeamPosition {
  _id: Id<"teamPositions">;
  playerID: Id<"users"> | null;
  positionName: string | null;
  index: number;
}

export interface TeamMember {
  isAdmin: boolean;
  id: Id<"users">;
  name: string;
  ubisoftID: string | null;
  teamPositionID: Id<"teamPositions"> | null;
  defaultColor: string | null;
  memberSince: number;
}

export interface InviteKey {
  inviteKey: string;
  teamID: Id<"teams">;
  usedBy: Id<"users"> | null;
  usedAt: string | null;
}
