import { defineConfig } from "drizzle-kit";
import 'dotenv/config';

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres.ratzyxwpzrqbtpheygh:rYo74C8halR1mErM@aws-0-eu-central-1.pooler.supabase.com:5432/postgres",
  },
});
