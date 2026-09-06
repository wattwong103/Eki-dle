export async function boot(): Promise<void> {
  throw new Error("src/app.ts not assembled — wait for unpack-app-once workflow or run: node scripts/assemble-app.mjs");
}
