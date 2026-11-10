import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchServices, fetchService, registerUser, verifyCredentials } from "./services";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("fetchServices", () => {
  it("returns service data on success", async () => {
    const data = [{ serviceCode: "PAN" }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data }),
    });
    const result = await fetchServices();
    expect(result).toEqual(data);
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/services");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchServices()).rejects.toThrow("Failed to load services: 500");
  });
});

describe("fetchService", () => {
  it("fetches a single service", async () => {
    const data = { serviceCode: "PAN", name: "PAN Card" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data }),
    });
    const result = await fetchService("PAN");
    expect(result).toEqual(data);
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/services/PAN");
  });
});

describe("registerUser", () => {
  it("sends registration request", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ registered: true }),
    });
    const result = await registerUser("testuser", "pass1234");
    expect(result).toEqual({ registered: true });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/auth/register",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("throws with server message on failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      text: () => Promise.resolve(JSON.stringify({ message: "Username already taken" })),
    });
    await expect(registerUser("taken", "pass1234")).rejects.toThrow("Username already taken");
  });
});

describe("verifyCredentials", () => {
  it("returns auth header on success", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const result = await verifyCredentials("user", "pass");
    expect(result).toBe("Basic " + btoa("user:pass"));
  });

  it("returns null on failure", async () => {
    mockFetch.mockResolvedValue({ ok: false });
    const result = await verifyCredentials("user", "wrong");
    expect(result).toBeNull();
  });
});
