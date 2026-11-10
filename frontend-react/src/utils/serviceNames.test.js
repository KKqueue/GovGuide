import { describe, it, expect } from "vitest";
import { codeToName, DESC_FALLBACKS } from "./serviceNames";

describe("codeToName", () => {
  it("converts snake_case to title case", () => {
    expect(codeToName("BIRTH_CERTIFICATE_REGISTRATION")).toBe("Birth Certificate Registration");
  });

  it("preserves known acronyms", () => {
    expect(codeToName("GST_REGISTRATION")).toBe("GST Registration");
    expect(codeToName("PAN_INSTANT_EPAN")).toBe("PAN Instant Epan");
    expect(codeToName("ITR_FILING")).toBe("ITR Filing");
  });

  it("uses override for special codes", () => {
    expect(codeToName("NGO_SECTION8")).toBe("NGO (Section 8) Registration");
    expect(codeToName("UDYAM_ASSIST")).toBe("Udyam Assist Registration");
    expect(codeToName("NON_CREAMY_LAYER")).toBe("Non-Creamy Layer Certificate");
  });

  it("lowercases small words after the first word", () => {
    expect(codeToName("POWER_OF_ATTORNEY")).toBe("Power of Attorney");
  });

  it("handles empty and null input", () => {
    expect(codeToName("")).toBe("");
    expect(codeToName(null)).toBe("");
    expect(codeToName(undefined)).toBe("");
  });
});

describe("DESC_FALLBACKS", () => {
  it("provides descriptions for known service codes", () => {
    expect(DESC_FALLBACKS.RTI_APPLICATION).toBeTruthy();
    expect(DESC_FALLBACKS.COOPERATIVE_SOCIETY).toBeTruthy();
  });

  it("descriptions are non-empty strings", () => {
    Object.values(DESC_FALLBACKS).forEach(desc => {
      expect(typeof desc).toBe("string");
      expect(desc.length).toBeGreaterThan(10);
    });
  });
});
