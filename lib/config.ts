import { sql } from "./db";

export async function getAppConfig() {
  const { rows } = await sql<{
    id: number;
    gmail_refresh_token: string | null;
    gmail_label_map: any | null;
  }>`select id, gmail_refresh_token, gmail_label_map from app_config where id = 1`;
  return rows[0];
}

export async function setRefreshToken(refreshToken: string) {
  await sql`
    update app_config
    set gmail_refresh_token = ${refreshToken}, updated_at = now()
    where id = 1
  `;
}

export async function getCachedLabelMap(): Promise<Record<string, string> | null> {
  const cfg = await getAppConfig();
  const m = cfg?.gmail_label_map;
  if (!m || typeof m !== "object") return null;
  return m as Record<string, string>;
}

export async function setCachedLabelMap(map: Record<string, string>) {
  await sql`
    update app_config
    set gmail_label_map = ${JSON.stringify(map)}::jsonb, updated_at = now()
    where id = 1
  `;
}
