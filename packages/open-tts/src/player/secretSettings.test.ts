import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "./TTSPluginSettings";
import {
  SecretStore,
  migrateToSecrets,
  resolveSecrets,
} from "./secretSettings";

function stubSecrets(initial: Record<string, string> = {}): SecretStore & {
  values: Record<string, string>;
} {
  const values = { ...initial };
  return {
    values,
    getSecret: (id) => values[id] ?? null,
    setSecret: (id, secret) => {
      values[id] = secret;
    },
    listSecrets: () => Object.keys(values),
  };
}

describe("migrateToSecrets", () => {
  it("moves a plaintext key into the keychain and records the secret's name", () => {
    const secrets = stubSecrets();
    const { settings, migrated } = migrateToSecrets(
      { ...DEFAULT_SETTINGS, openaicompat_apiKey: "sk-or-123" },
      secrets,
    );
    expect(secrets.values).toEqual({
      "aloud-openaicompat-api-key": "sk-or-123",
    });
    expect(settings.secretNames).toEqual({
      openaicompat_apiKey: "aloud-openaicompat-api-key",
    });
    expect(migrated).toEqual(["openaicompat_apiKey"]);
  });

  it("reuses an existing secret that already holds the same key", () => {
    const secrets = stubSecrets({ openrouter: "sk-or-123" });
    const { settings } = migrateToSecrets(
      { ...DEFAULT_SETTINGS, openaicompat_apiKey: "sk-or-123" },
      secrets,
    );
    expect(settings.secretNames.openaicompat_apiKey).toEqual("openrouter");
    expect(secrets.values).toEqual({ openrouter: "sk-or-123" });
  });

  it("never overwrites a different secret that already has the default name", () => {
    const secrets = stubSecrets({ "aloud-openaicompat-api-key": "sk-old" });
    const { settings } = migrateToSecrets(
      { ...DEFAULT_SETTINGS, openaicompat_apiKey: "sk-new" },
      secrets,
    );
    expect(secrets.values["aloud-openaicompat-api-key"]).toEqual("sk-old");
    expect(settings.secretNames.openaicompat_apiKey).toEqual(
      "aloud-openaicompat-api-key-2",
    );
    expect(secrets.values["aloud-openaicompat-api-key-2"]).toEqual("sk-new");
  });
});

describe("resolveSecrets", () => {
  it("fills keys from their named secrets and reports names missing on this device", () => {
    const secrets = stubSecrets({ openrouter: "sk-or-123" });
    const { settings, missing } = resolveSecrets(
      {
        ...DEFAULT_SETTINGS,
        secretNames: {
          openaicompat_apiKey: "openrouter",
          openai_apiKey: "aloud-openai-api-key",
        },
      },
      secrets,
    );
    expect(settings.openaicompat_apiKey).toEqual("sk-or-123");
    expect(settings.openai_apiKey).toEqual("");
    expect(missing).toEqual([
      { field: "openai_apiKey", name: "aloud-openai-api-key" },
    ]);
  });
});
