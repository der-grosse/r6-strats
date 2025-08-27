import { verifyJWT } from "@/src/auth/jwt";

export async function GET(request: Request) {
  const jwt = request.headers.get("Authorization")?.split(" ")[1];

  if (!jwt) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify the JWT and extract user information
  const user = await verifyJWT(jwt);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Handle the authenticated request
  return Response.json({
    name: user.name,
    isAdmin: user.isAdmin,
    teamID: user.teamID,
  });
}
