import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/utils";
import Header from "./Header";

describe("Header", () => {
  it("renders the brand name", () => {
    renderWithProviders(<Header />);
    expect(screen.getByText("Government Guide")).toBeInTheDocument();
  });

  it("has a skip-to-content accessible link", () => {
    renderWithProviders(
      <>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <Header />
      </>
    );
    expect(screen.getByText("Skip to main content")).toBeInTheDocument();
  });

  it("toggles mobile menu on hamburger click", () => {
    renderWithProviders(<Header />);
    const toggle = screen.getByLabelText("Open navigation menu");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Close navigation menu")).toBeInTheDocument();
  });

  it("shows Sign in when not authenticated", () => {
    renderWithProviders(<Header />);
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("has theme toggle button", () => {
    renderWithProviders(<Header />);
    expect(screen.getByLabelText("Toggle theme")).toBeInTheDocument();
  });

  it("has search button with keyboard shortcut", () => {
    renderWithProviders(<Header />);
    expect(screen.getByLabelText("Search services")).toBeInTheDocument();
    expect(screen.getByText("Ctrl K")).toBeInTheDocument();
  });

  it("opens search overlay on Ctrl+K", async () => {
    renderWithProviders(<Header />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(await screen.findByRole("dialog", { name: "Search services" })).toBeInTheDocument();
  });
});
