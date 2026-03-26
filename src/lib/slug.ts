import slugify from "slugify";
import { prisma } from "@/lib/prisma";

export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true, locale: "es" });
  let slug = base;
  let i = 1;

  while (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${base}-${i}`;
    i++;
  }

  return slug;
}
