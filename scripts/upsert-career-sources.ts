import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import { careerSources } from "../src/config/career-sources";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { createSourceSchema } from "../src/lib/validation/source";

loadEnv({ path: ".env.local" });
loadEnv();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  let created = 0;
  let updated = 0;

  try {
    for (const candidate of careerSources) {
      const source = createSourceSchema.parse(candidate);
      const existing = await prisma.source.findFirst({
        where: { OR: [{ baseUrl: source.baseUrl }, { name: source.name }] },
        select: { id: true },
      });
      const data = {
        name: source.name,
        baseUrl: source.baseUrl,
        crawlConfig: source.crawlConfig as unknown as Prisma.InputJsonValue,
        cadenceMinutes: source.cadenceMinutes,
        enabled: source.enabled,
      };
      if (existing) {
        await prisma.source.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await prisma.source.create({ data });
        created += 1;
      }
    }
    console.log(`Career sources synchronized: ${created} created, ${updated} updated.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
