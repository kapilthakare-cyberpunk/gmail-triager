import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { setRefreshToken } from "@/lib/config";

const ALLOWLIST = new Set([
  "kapilsthakare@gmail.com",
  "kapil.thakare@primesandzooms.com",
]);

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.modify",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = ((profile as any)?.email || "").toLowerCase();
      return ALLOWLIST.has(email);
    },
    async jwt({ token, account, profile }) {
      if ((profile as any)?.email) token.email = ((profile as any).email as string).toLowerCase();

      // Only store refresh token for Mailbox A
      if (account?.refresh_token) {
        const email = (((profile as any)?.email as string) || "").toLowerCase();
        if (email === "kapilsthakare@gmail.com") {
          await setRefreshToken(account.refresh_token);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).email = (token as any).email;
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
};
