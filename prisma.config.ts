import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Leitura opcional: `prisma generate` (postinstall / build do Docker) não precisa do banco.
    // Comandos que conectam (migrate, db seed) falham com mensagem clara se a variável faltar.
    url: process.env.DATABASE_URL,
  },
});
