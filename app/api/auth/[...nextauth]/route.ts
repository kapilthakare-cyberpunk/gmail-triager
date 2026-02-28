import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { setRefreshToken } from "@/lib/config";

const ALLOWLIST = new Set([
  "kapilsthakare@gmail.com",
  "kapil.thakare@primesandzooms.com",
]);

export const authOptions = {
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
    async signIn({ profile }: any) {
      const email = (profile?.email || "").toLowerCase();
      return ALLOWLIST.has(email);
    },
    async jwt({ token, account, profile }: any) {
      if (profile?.email) token.email = profile.email.toLowerCase();

      if (account?.refresh_token) {
        const email = (profile?.email || "").toLowerCase();
        if (email === "kapilsthakare@gmail.com") {
          await setRefreshToken(account.refresh_token);
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      session.user.email = token.email;
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
};

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };
