import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    authError?: string;
  }
}

export const AUTHORIZATION_ERROR = "admin_consent_required";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email offline_access",
        },
      },
    }),
  ],

  secret: process.env.AUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/auth/admin-approval-required",
  },

  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "microsoft-entra-id") {
        if (!account.access_token) {
          return `/auth/admin-approval-required?error=${AUTHORIZATION_ERROR}`;
        }
      }
      return true;
    },

    async jwt({ token, account }) {
      if (account) {
        if (!account.access_token || !account.expires_at) {
          token.authError = AUTHORIZATION_ERROR;
          return token;
        }
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.authError = undefined;
      }

      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      if (token.refreshToken) {
        try {
          const url = `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/oauth2/v2.0/token`;
          const body = new URLSearchParams({
            client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
            client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
            refresh_token: token.refreshToken as string,
            grant_type: "refresh_token",
          });

          const res = await fetch(url, { method: "POST", body });
          const data = await res.json();

          if (res.ok && data.access_token) {
            token.accessToken = data.access_token;
            token.refreshToken = data.refresh_token ?? token.refreshToken;
            token.expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
          }
        } catch {
          token.accessToken = undefined;
          token.refreshToken = undefined;
          token.expiresAt = undefined;
        }
      }

      return token;
    },

    async session({ session }) {
      return session;
    },
  },
});
