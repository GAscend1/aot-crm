import { afterEach, describe, expect, it } from "vitest";

import { appOrigin, authBaseUrl, secureCookiesEnabled } from "../../lib/server/auth-env";

const ORIGINAL = { ...process.env };

/** Set a single env var for the duration of a test, restoring it afterwards. */
function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

afterEach(() => {
  for (const key of [
    "AUTH_URL",
    "NEXTAUTH_URL",
    "VERCEL_URL",
    "WEBSITE_HOSTNAME",
    "NODE_ENV",
  ]) {
    setEnv(key, ORIGINAL[key]);
  }
});

describe("auth-env (deployment base URL + secure cookie policy)", () => {
  it("resolves AUTH_URL with precedence over the legacy NEXTAUTH_URL alias", () => {
    setEnv("AUTH_URL", "https://app.example.com");
    setEnv("NEXTAUTH_URL", "https://legacy.example.com");
    expect(authBaseUrl()).toBe("https://app.example.com");
    expect(appOrigin()).toBe("https://app.example.com");
  });

  it("falls back to NEXTAUTH_URL when AUTH_URL is unset", () => {
    setEnv("AUTH_URL", undefined);
    setEnv("NEXTAUTH_URL", "https://app.example.com");
    expect(authBaseUrl()).toBe("https://app.example.com");
    expect(appOrigin()).toBe("https://app.example.com");
  });

  it("strips a trailing slash from the resolved origin", () => {
    setEnv("AUTH_URL", "https://app.example.com/");
    expect(appOrigin()).toBe("https://app.example.com");
  });

  it("falls back to the Azure App Service hostname, then localhost", () => {
    setEnv("AUTH_URL", undefined);
    setEnv("NEXTAUTH_URL", undefined);
    setEnv("VERCEL_URL", undefined);
    setEnv("WEBSITE_HOSTNAME", "aot-crm.azurewebsites.net");
    expect(appOrigin()).toBe("https://aot-crm.azurewebsites.net");

    setEnv("WEBSITE_HOSTNAME", undefined);
    expect(appOrigin()).toBe("http://localhost:3000");
  });

  it("uses secure cookies for an https AUTH_URL (production)", () => {
    setEnv("AUTH_URL", "https://app.example.com");
    expect(secureCookiesEnabled()).toBe(true);
  });

  it("does not use secure cookies for http in development", () => {
    setEnv("AUTH_URL", "http://localhost:3000");
    setEnv("NODE_ENV", "development");
    expect(secureCookiesEnabled()).toBe(false);
  });

  it("assumes secure cookies in production even without AUTH_URL", () => {
    setEnv("AUTH_URL", undefined);
    setEnv("NODE_ENV", "production");
    expect(secureCookiesEnabled()).toBe(true);
  });
});
