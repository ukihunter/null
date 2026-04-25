import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { db } from "./lib/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,

  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,

  callbacks: {
    // merge authConfig callbacks safely (if they exist)
    ...(authConfig.callbacks ?? {}),

    /**
     * Handle user creation and account linking after a successful sign-in
     */
    async signIn({ user, account }) {
      if (!user || !account) return false;

      try {
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          const newUser = await db.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
            },
          });

          if (!newUser) return false;

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
          const existingAccount = await db.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

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
                session_state: account.session_state as
                  | string
                  | null
                  | undefined,
              },
            });
          }
        }

        return true;
      } catch (error) {
        console.error("[AUTH] signIn callback error:", error);
        return true;
      }
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      if (token.dbUserId) {
        token.sub = token.dbUserId as string;
        return token;
      }

      try {
        const existingUser = await db.user.findUnique({
          where: { email: token.email as string },
        });

        if (!existingUser) return token;

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
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.role) session.user.role = token.role;
      }

      return session;
    },
  },
});
