import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { db } from "./lib/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,

  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,

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

    async jwt(ctx) {
      let token = ctx.token;

      // First run base callback from auth.config.ts so githubAccessToken/id are preserved.
      if (authConfig.callbacks?.jwt) {
        token = await authConfig.callbacks.jwt({
          token,
          user: ctx.user,
          account: ctx.account,
          profile: ctx.profile,
          trigger: ctx.trigger,
          isNewUser: ctx.isNewUser,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          session: (ctx as any).session,
        });
      }

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

    async session(ctx) {
      let session = ctx.session;
      const token = ctx.token;

      // First run base callback from auth.config.ts so githubAccessToken is copied to session.
      if (authConfig.callbacks?.session) {
        session = await authConfig.callbacks.session({
          session,
          token,
          user: ctx.user,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newSession: (ctx as any).newSession,
          trigger: ctx.trigger,
        });
      }

      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.role) session.user.role = token.role;
      }

      return session;
    },
  },
});
