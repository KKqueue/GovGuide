import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "./Toast";

function TestConsumer() {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast("Test message", "success")}>
      Show Toast
    </button>
  );
}

describe("Toast", () => {
  it("renders a toast when showToast is called", async () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByText("Show Toast").click();
    });

    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("auto-dismisses toasts after timeout", async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByText("Show Toast").click();
    });
    expect(screen.getByText("Test message")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText("Test message")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("limits to 3 visible toasts", async () => {
    function MultiToast() {
      const { showToast } = useToast();
      return (
        <button onClick={() => {
          showToast("Toast 1", "info");
          showToast("Toast 2", "info");
          showToast("Toast 3", "info");
          showToast("Toast 4", "info");
        }}>
          Show Many
        </button>
      );
    }

    render(
      <ToastProvider>
        <MultiToast />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByText("Show Many").click();
    });

    const alerts = screen.getAllByRole("alert");
    expect(alerts.length).toBeLessThanOrEqual(3);
  });
});
