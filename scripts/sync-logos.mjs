/**
 * Mirrors issuer logos into public/logos.
 *
 * Run when a new company lists, or if the upstream marks are refreshed. The
 * files are committed rather than fetched at runtime, so the interface never
 * depends on a third-party CDN being up to render a company's identity.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CDN = "https://uatacstrading.acledasecurities.com.kh/cdn/issuers";
const OUT = join(process.cwd(), "public", "logos");
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const symbols = process.argv.slice(2);
if (symbols.length === 0) {
  console.error("Usage: node scripts/sync-logos.mjs ABC PWSA ...");
  process.exit(1);
}

await mkdir(OUT, { recursive: true });

for (const raw of symbols) {
  const symbol = raw.toUpperCase();
  try {
    const response = await fetch(`${CDN}/${symbol}.png`);
    if (!response.ok) {
      console.warn(`  ! ${symbol}: HTTP ${response.status}`);
      continue;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    // A CDN that 404s to an HTML page would otherwise write a broken image.
    if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
      console.warn(`  ! ${symbol}: response was not a PNG`);
      continue;
    }
    await writeFile(join(OUT, `${symbol}.png`), bytes);
    console.log(`  + ${symbol}.png (${bytes.length} bytes)`);
  } catch (error) {
    console.warn(`  ! ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
