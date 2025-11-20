import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    GitHub({
      // Support both legacy AUTH_* names and the GITHUB_* names used in .env
      clientId: process.env.GITHUB_ID ?? process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET ?? process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      // Support both legacy AUTH_* names and the GOOGLE_* names used in .env
      clientId: process.env.GOOGLE_ID ?? process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET ?? process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
} satisfies NextAuthConfig;
