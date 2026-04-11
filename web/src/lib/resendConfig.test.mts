import assert from "node:assert";
import { test, describe, afterEach } from "node:test";

import {
  getMisconfiguredResendBaseUrlMessage,
  assertProductionResendBaseUrl,
  normalizeResendApiKey,
} from "./resendConfig.ts";

describe("normalizeResendApiKey", () => {
  test("returns undefined for empty or whitespace", () => {
    assert.strictEqual(normalizeResendApiKey(undefined), undefined);
    assert.strictEqual(normalizeResendApiKey(""), undefined);
    assert.strictEqual(normalizeResendApiKey("   "), undefined);
  });

  test("strips one pair of surrounding quotes", () => {
    assert.strictEqual(normalizeResendApiKey('"re_abc"'), "re_abc");
    assert.strictEqual(normalizeResendApiKey("'re_abc'"), "re_abc");
    assert.strictEqual(normalizeResendApiKey('  "re_abc"  '), "re_abc");
  });

  test("leaves keys without surrounding quotes unchanged (after trim)", () => {
    assert.strictEqual(normalizeResendApiKey("  re_abc  "), "re_abc");
  });
});

describe("getMisconfiguredResendBaseUrlMessage", () => {
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
  });

  test("returns null when unset", () => {
    delete process.env.RESEND_BASE_URL;
    assert.strictEqual(getMisconfiguredResendBaseUrlMessage(), null);
  });

  test("returns null for default https://api.resend.com", () => {
    process.env.RESEND_BASE_URL = "https://api.resend.com";
    assert.strictEqual(getMisconfiguredResendBaseUrlMessage(), null);
    process.env.RESEND_BASE_URL = "https://api.resend.com/";
    assert.strictEqual(getMisconfiguredResendBaseUrlMessage(), null);
  });

  test("flags wrong host", () => {
    process.env.RESEND_BASE_URL = "https://example.com";
    const msg = getMisconfiguredResendBaseUrlMessage();
    assert.ok(msg?.includes("RESEND_BASE_URL"));
    assert.ok(msg?.includes("api.resend.com"));
  });

  test("flags non-https", () => {
    process.env.RESEND_BASE_URL = "http://api.resend.com";
    const msg = getMisconfiguredResendBaseUrlMessage();
    assert.ok(msg?.includes("https://api.resend.com"));
  });

  test("flags path other than /", () => {
    process.env.RESEND_BASE_URL = "https://api.resend.com/v1";
    const msg = getMisconfiguredResendBaseUrlMessage();
    assert.ok(msg);
  });
});

describe("assertProductionResendBaseUrl", () => {
  const saved = { ...process.env };
  const savedNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env = { ...saved };
    if (savedNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = savedNodeEnv;
  });

  test("no-op in non-production", () => {
    process.env.NODE_ENV = "development";
    process.env.RESEND_BASE_URL = "https://example.com";
    assert.doesNotThrow(() => assertProductionResendBaseUrl());
  });

  test("throws in production when base URL is wrong", () => {
    process.env.NODE_ENV = "production";
    process.env.RESEND_BASE_URL = "https://wrong.example";
    assert.throws(() => assertProductionResendBaseUrl(), /RESEND_BASE_URL/);
  });
});
