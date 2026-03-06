import NextAuth from "next-auth";

import authConfig from "./auth.config";
import { db } from "./lib/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  callbacks: {
    /**
     * Handle user creation and account linking after a successful sign-in
     */
    async signIn({ user, account }) {
      if (!user || !account) return false;

      try {
        // Check if the user already exists
        const existingUser = await db.user.findUnique({
        where: { email: user.email! },
      });

      // If user does not exist, create a new one
      if (!existingUser) {
        // Create user first
        const newUser = await db.user.create({
          data: {
            email: user.email!,
            name: user.name,
            image: user.image,
          },
        });

        if (!newUser) return false; // Return false if user creation fails

        // Then create the account separately to avoid transaction requirement
        await db.account.create({
          data: {
            userId: newUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state as string | null | undefined,
          },
        });
      } else {
        // Link the account if user exists
        const existingAccount = await db.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        // If the account does not exist, create it
        if (!existingAccount) {
          await db.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state as string | null | undefined,
            },
          });
        }
      }

      return true;
      } catch (error) {
        console.error("[AUTH] signIn callback error:", error);
        // Return true so the user can still sign in even if DB sync fails
        return true;
      }
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      // If we already stored the verified DB user ID in the token, reuse it.
      // This avoids a DB round-trip on every request after the first successful lookup.
      if (token.dbUserId) {
        token.sub = token.dbUserId as string;
        return token;
      }

      // First time (or existing bad token without dbUserId): look up the real DB user.
      try {
        const existingUser = await db.user.findUnique({
          where: { email: token.email as string },
        });

        if (!existingUser) return token;

        // Store DB id in both sub and a dedicated cached field
        token.sub = existingUser.id;
        token.dbUserId = existingUser.id;
        token.name = existingUser.name;
        token.email = existingUser.email;
        token.role = existingUser.role;

        return token;
      } catch (error) {
        console.error("[AUTH] jwt callback error:", error);
        return token;
      }
    },

    async session({ session, token }) {
      // Attach the user ID from the token to the session
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.sub && session.user) {
        session.user.role = token.role;
      }

      return session;
    },
  },

  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  ...authConfig,
});
