type JWTPayload = JWTPayloadV2;
type AllJWTPayloads = JWTPayloadV1 | JWTPayloadV2;

interface JWTPayloadV1 {
  id: number;
  name: string;
  teamID: number;
  isAdmin: boolean;
}

// If new versions are added, it MUST be added to convex/auth.ts
interface JWTPayloadV2 {
  v: "2.0";
  _id: string;
  name: string;
  teams: {
    teamID: string;
    isAdmin: boolean;
  }[];
  activeTeamID?: string;
}
