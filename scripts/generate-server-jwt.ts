import "dotenv/config";

const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;

if (!JWT_PRIVATE_KEY) {
  console.error("JWT_PRIVATE_KEY is not set in .env");
  process.exit(1);
}

import * as jwt from "jose";

async function main() {
  const privateKey = await jwt.importPKCS8(JWT_PRIVATE_KEY!, "RS256");

  const token = await new jwt.SignJWT({
    v: "2.0",
    _id: "NEXTJS_SERVER_JWT",
    name: "NEXTJS_SERVER",
    teams: [],
  })
    .setSubject("NEXTJS_SERVER_JWT")
    .setProtectedHeader({ alg: "RS256", kid: "r6-strats-key-1" })
    .setAudience("r6-strats")
    .setIssuer("https://r6-strats.com")
    .setIssuedAt()
    .setExpirationTime(
      new Date(new Date().setFullYear(new Date().getFullYear() + 100))
    )
    .sign(privateKey);

  console.log("Generated server JWT:");
  console.log(token);
}

main();
