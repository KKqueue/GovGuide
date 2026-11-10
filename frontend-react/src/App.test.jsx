import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./test/utils";
import App from "./App";

vi.mock("./api/services", () => ({
  fetchServices: vi.fn().mockResolvedValue([
    { serviceCode: "PAN_INSTANT_EPAN", category: "PAN_CARD", publicationReadiness: "PUBLISHED" },
    { serviceCode: "AADHAAR_NEW_ENROLLMENT", category: "AADHAAR_SERVICES", publicationReadiness: "PUBLISHED" },
  ]),
  verifyCredentials: vi.fn(),
  registerUser: vi.fn(),
  fetchTask: vi.fn(),
  getSavedTaskIds: vi.fn().mockReturnValue([]),
  saveTaskId: vi.fn(),
  createTask: vi.fn(),
  fetchTaskApplication: vi.fn(),
  updateChecklistItem: vi.fn(),
  fetchService: vi.fn(),
}));

describe("App", () => {
  it("renders the header and footer", async () => {
    renderWithProviders(<App />);
    expect(screen.getByText("Government Guide")).toBeInTheDocument();
    expect(screen.getByText(/independent informational tool/i)).toBeInTheDocument();
  });

  it("renders the home page hero", async () => {
    renderWithProviders(<App />);
    expect(await screen.findByText(/know exactly what you need/i)).toBeInTheDocument();
  });

  it("shows 404 for unknown routes", async () => {
    renderWithProviders(<App />, { route: "/unknown-page" });
    expect(await screen.findByText("Page not found")).toBeInTheDocument();
  });

  it("has skip to main content link", () => {
    renderWithProviders(<App />);
    expect(screen.getByText("Skip to main content")).toBeInTheDocument();
  });
});
