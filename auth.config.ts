import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    GitHub({
      // Support both legacy AUTH_* names and the GITHUB_* names used in .env
      clientId: process.env.GITHUB_ID ?? process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET ?? process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          // Needed for committing file changes via GitHub Contents/Git APIs.
          scope: "read:user user:email repo",
        },
      },
    }),
    Google({
      // Support both legacy AUTH_* names and the GOOGLE_* names used in .env
      clientId: process.env.GOOGLE_ID ?? process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET ?? process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // ✅ keep existing user data
      if (user) {
        token.id = user.id;
      }

      // ✅ add github token ONLY when github login happens
      if (account?.provider === "github") {
        token.githubAccessToken = account.access_token;
      }

      return token;
    },

    async session({ session, token }) {
      // ✅ restore user id (THIS FIXES YOUR APP)
      if (session.user) {
        session.user.id = token.id as string;
      }

      // ✅ add github token (NEW FEATURE)
      session.githubAccessToken = token.githubAccessToken as string;

      return session;
    },
  },
} satisfies NextAuthConfig;
