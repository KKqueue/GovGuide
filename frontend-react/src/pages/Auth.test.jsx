import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/utils";
import Auth from "./Auth";

describe("Auth page", () => {
  it("renders sign in form by default", () => {
    renderWithProviders(<Auth />, { route: "/auth" });
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("switches to sign up form", () => {
    renderWithProviders(<Auth />, { route: "/auth" });
    fireEvent.click(screen.getByText("Sign up"));
    expect(screen.getByRole("heading", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("shows sign up form when tab prop is signup", () => {
    renderWithProviders(<Auth tab="signup" />, { route: "/signup" });
    expect(screen.getByRole("heading", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("validates username format on sign up", async () => {
    renderWithProviders(<Auth tab="signup" />, { route: "/signup" });
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInputs = screen.getAllByLabelText(/password/i);

    fireEvent.change(usernameInput, { target: { value: "bad user!" } });
    fireEvent.change(passwordInputs[0], { target: { value: "password1" } });
    fireEvent.change(passwordInputs[1], { target: { value: "password1" } });

    fireEvent.click(screen.getByText("Create Account"));
    expect(await screen.findByText(/username can only contain/i)).toBeInTheDocument();
  });

  it("shows password strength meter", () => {
    renderWithProviders(<Auth tab="signup" />, { route: "/signup" });
    const passwordInputs = screen.getAllByLabelText(/password/i);

    fireEvent.change(passwordInputs[0], { target: { value: "abcd1234" } });
    expect(screen.getByText(/weak|fair|good|strong/i)).toBeInTheDocument();
  });
});
