import * as jwt from "jose";
import * as fs from "fs/promises";
import * as path from "path";

async function generateKeys() {
  try {
    // Generate key pair
    const keys = await jwt.generateKeyPair("RS256", { extractable: true });

    // Export keys
    const publicKey = await jwt.exportSPKI(keys.publicKey);
    const privateKey = await jwt.exportPKCS8(keys.privateKey);

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), "data");
    await fs.mkdir(dataDir, { recursive: true });

    // Save keys to files
    await fs.writeFile(path.join(dataDir, "public.pem"), publicKey);
    await fs.writeFile(path.join(dataDir, "private.pem"), privateKey);

    // Also append or update keys in root .env file. Convert newlines to literal \n
    const repoRoot = process.cwd();
    const envPath = path.join(repoRoot, ".env");

    // Prepare env entries by escaping newlines so values remain single-line
    const PUBLIC_KEY_ESCAPED = '"' + publicKey.replace(/\r?\n/g, "\\n") + '"';
    const PRIVATE_KEY_ESCAPED = '"' + privateKey.replace(/\r?\n/g, "\\n") + '"';

    // Read existing .env if present, otherwise start empty
    let envContents = "";
    try {
      envContents = await fs.readFile(envPath, { encoding: "utf8" });
    } catch (e: any) {
      if (e && e.code !== "ENOENT") throw e;
      // file doesn't exist, will create
      envContents = "";
    }

    // Helper to set or replace a key in env contents
    function setEnvValue(contents: string, key: string, value: string) {
      const regex = new RegExp(`(^${key}=).*`, "m");
      if (regex.test(contents)) {
        return contents.replace(regex, `$1${value}`);
      }
      // append with newline if not empty and not ending with newline
      const prefix = contents && !contents.endsWith("\n") ? "\n" : "";
      return contents + prefix + `${key}=${value}\n`;
    }

    envContents = setEnvValue(
      envContents,
      "JWT_PUBLIC_KEY",
      PUBLIC_KEY_ESCAPED
    );
    envContents = setEnvValue(
      envContents,
      "JWT_PRIVATE_KEY",
      PRIVATE_KEY_ESCAPED
    );

    await fs.writeFile(envPath, envContents, { encoding: "utf8" });

    console.info("Keys generated and saved successfully!");
    console.info("Public key saved to: data/public.pem");
    console.info("Private key saved to: data/private.pem");
    console.info("Escaped keys updated in: .env (PUBLIC_KEY, PRIVATE_KEY)");
  } catch (error) {
    console.error("Error generating keys:", error);
    process.exit(1);
  }
}

generateKeys();
