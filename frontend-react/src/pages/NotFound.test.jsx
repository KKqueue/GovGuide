import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils";
import NotFound from "./NotFound";

describe("NotFound page", () => {
  it("shows page not found heading", () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("has a link back to home", () => {
    renderWithProviders(<NotFound />);
    const link = screen.getByRole("link", { name: /back to home/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
