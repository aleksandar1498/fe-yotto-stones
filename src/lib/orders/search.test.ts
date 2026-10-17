import { describe, expect, it } from "vitest";
import { phoneKey, phoneMatches } from "./search";

describe("phoneKey", () => {
  it("canonicalises Bulgarian country-code numbers", () => {
    expect(phoneKey("+359 89 996 6930")).toBe("0899966930");
    expect(phoneKey("00359 899 966 930")).toBe("0899966930");
    expect(phoneKey("359899966930")).toBe("0899966930");
    expect(phoneKey("0899 966 930")).toBe("0899966930");
    expect(phoneKey("+359 2 123 4567")).toBe("021234567");
  });

  it("leaves other numbers and empty values alone", () => {
    expect(phoneKey("+49 30 123456")).toBe("4930123456");
    expect(phoneKey("")).toBe("");
    expect(phoneKey(undefined)).toBe("");
  });
});

describe("phoneMatches", () => {
  it("matches a local prefix against a +359 number", () => {
    expect(phoneMatches("+359 89 996 6930", "08999")).toBe(true);
    expect(phoneMatches("+359 89 996 6930", "89996")).toBe(true);
    expect(phoneMatches("0899966930", "35989")).toBe(true);
    expect(phoneMatches("+359 89 996 6930", "12345")).toBe(false);
  });

  it("requires digits on both sides", () => {
    expect(phoneMatches("+359 89 996 6930", "")).toBe(false);
    expect(phoneMatches(undefined, "08999")).toBe(false);
  });
});
