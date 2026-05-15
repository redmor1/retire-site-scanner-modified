import { describe, it } from "node:test";
import assert from "node:assert/strict";
import getDomain from "../src/suffix-list";

async function expectDomain(
  target: string,
  expectedDomain: string,
): Promise<void> {
  const d = await getDomain("https://" + target, "https://www.banana.com");
  assert.equal(d, expectedDomain);
}

describe("tld extractor", () => {
  it("should find tlds correctly", async () => {
    await expectDomain("hola.com", "hola.com");
    await expectDomain("www.hola.com", "hola.com");

    await expectDomain("www.hola.net.ck", "hola.net.ck");

    await expectDomain("www.hola.co.cm", "hola.co.cm");
    await expectDomain("www.hola.cm", "hola.cm");
  });
});
