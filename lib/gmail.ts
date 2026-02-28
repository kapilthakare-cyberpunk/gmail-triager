import { google } from "googleapis";
import { getAppConfig } from "./config";

export async function getGmailClient() {
  const cfg = await getAppConfig();
  const refreshToken = cfg?.gmail_refresh_token;
  if (!refreshToken) {
    throw new Error(
      "No Gmail refresh token stored yet. Sign in as kapilsthakare@gmail.com once to capture it."
    );
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2.setCredentials({ refresh_token: refreshToken });

  return google.gmail({ version: "v1", auth: oauth2 });
}
