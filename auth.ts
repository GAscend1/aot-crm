import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

import { clearGraphRefreshToken, persistGraphRefreshToken } from "@/lib/server/graph-tokens";
import { extractTenantId, msIssuer, msTokenUrl } from "@/lib/server/ms-auth";
import { isAotPlatformTenantId } from "@/lib/server/platform-tenant";

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    authError?: string;
    /** Authenticated Microsoft Entra tenant ID (tid claim of the id_token). */
    tenantId?: string | null;
  }
}

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** Authenticated Microsoft Entra tenant ID — the SaaS tenant key. */
      tenantId?: string | null;
      /**
       * True when the verified Entra tid equals AOT_PLATFORM_TENANT_ID
       * (authorization-only — never the OAuth authority). Used to surface the
       * "Platform Owner" label in the avatar menu. Server routes enforce the
       * same rule via requirePlatformOwner(); this flag is display-only.
       */
      isPlatformOwner?: boolean;
    };
  }
}

export const AUTHORIZATION_ERROR = "admin_consent_required";

/**
 * Microsoft-only authentication.
 *
 * The Entra App Registration is multi-tenant: work/school accounts from ANY
 * Entra organization can sign in (`organizations` authority — personal
 * Microsoft accounts are excluded). The original AOT/Ascend One tenant is NOT
 * forced. Google/Facebook/phone login are not offered.
 *
 * The authenticated tenant ID (`tid`) is extracted from the id_token and
 * persisted on the JWT + session so organization resolution never relies on
 * the email domain alone.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: msIssuer(),
      authorization: {
        params: {
          // Delegated permissions granted on the Entra app registration. The
          // refresh_token (offline_access) is required for token renewal.
          scope:
            "openid profile email offline_access " +
            "Calendars.ReadWrite Mail.ReadWrite Mail.Send " +
            "OnlineMeetings.ReadWrite User.Read User.ReadBasic.All Presence.Read",
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
    error: "/auth/error",
  },

  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "microsoft-entra-id" && !account.access_token) {
        // The OAuth exchange did not produce a token — surface a consent
        // error on the shared error page instead of a fake approval screen.
        return `/auth/error?error=${AUTHORIZATION_ERROR}`;
      }
      return true;
    },

    async jwt({ token, account, profile }) {
      if (account) {
        if (!account.access_token || !account.expires_at) {
          token.authError = AUTHORIZATION_ERROR;
          return token;
        }
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.authError = undefined;
        // Persist the authenticated Microsoft tenant ID (tid) — the key used
        // to resolve/create the customer's AOT Organization. Never derived
        // from the email domain.
        token.tenantId =
          extractTenantId(account.id_token) ??
          (profile as { tid?: string | null } | undefined)?.tid ??
          token.tenantId ??
          null;
        // Persist an encrypted copy for background/webhook sync workers that
        // have no browser session (Phase 5). Fire-and-forget; never blocks auth.
        void persistGraphRefreshToken(token.email, token.refreshToken);
      }

      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      if (token.refreshToken) {
        try {
          const url = msTokenUrl();
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
            // Rotate the at-rest copy when Microsoft issues a new refresh token.
            void persistGraphRefreshToken(token.email, token.refreshToken);
          }
        } catch {
          token.accessToken = undefined;
          token.refreshToken = undefined;
          token.expiresAt = undefined;
          // Permanent failure — drop the stored copy so workers stop retrying.
          void clearGraphRefreshToken(token.email);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.tenantId = (token.tenantId as string | null | undefined) ?? null;
        // Display-only badge — enforcement lives in requirePlatformOwner().
        session.user.isPlatformOwner = isAotPlatformTenantId(
          (token.tenantId as string | null | undefined) ?? null,
        );
      }
      return session;
    },
  },
});
