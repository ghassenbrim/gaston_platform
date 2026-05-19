import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Récupère la chaîne de connexion à la base de données PostgreSQL
 * depuis la variable d'environnement DATABASE_URL.
 */
const connectionString = process.env.DATABASE_URL;

/**
 * Crée un pool de connexions PostgreSQL natif.
 * Le pool gère automatiquement les connexions réutilisables pour de meilleures performances.
 */
const pool = new Pool({ connectionString });

/**
 * Adaptateur Prisma pour PostgreSQL.
 * Il permet à Prisma d'utiliser le pool de connexions pg natif au lieu de son propre driver.
 */
const adapter = new PrismaPg(pool);

/**
 * Référence globale utilisée pour stocker l'instance Prisma.
 * Ce cast vers `globalThis` permet de persister l'instance entre les rechargements
 * à chaud (hot reload) en développement, évitant ainsi la création de multiples
 * instances de PrismaClient qui épuiseraient le pool de connexions.
 */
const globalForPrisma = globalThis as unknown as { prisma_v2: PrismaClient };

/**
 * Instance unique du client Prisma (pattern Singleton).
 * En développement, on réutilise l'instance déjà attachée à globalThis si elle existe.
 * En production, une nouvelle instance est toujours créée (pas de global partagé).
 * Les logs d'erreurs et d'avertissements sont activés pour faciliter le débogage.
 */
export const prisma =
  globalForPrisma.prisma_v2 ??
  new PrismaClient({
    // @ts-ignore
    adapter,
    log: ["error", "warn"],
  });

/**
 * En dehors de la production, on attache l'instance Prisma à globalThis
 * afin qu'elle soit réutilisée lors des rechargements du serveur Next.js (hot reload).
 * En production, cette ligne est ignorée pour éviter les fuites mémoire.
 */
if (process.env["NODE_ENV"] !== "production") globalForPrisma.prisma_v2 = prisma;
