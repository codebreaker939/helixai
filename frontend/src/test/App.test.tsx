import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { ToastProvider } from "../components/ui";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return {
    ...actual,
    endpoints: {
      ...actual.endpoints,
      overview: vi.fn().mockRejectedValue(new Error("offline"))
    }
  };
});

describe("HelixAI application", () => {
  it("renders the branded landing page and dashboard entry point", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/"]}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(
      await screen.findByRole("heading", {
        name: /precision medicine,\s*engineered for trust/i
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open dashboard/i })).toHaveAttribute("href", "/app");
  });
});
