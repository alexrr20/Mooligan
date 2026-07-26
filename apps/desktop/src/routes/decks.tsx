import { createFileRoute } from "@tanstack/react-router";

import { StarterPage } from "../components/page";

export const Route = createFileRoute("/decks")({
  component: DecksPage,
});

function DecksPage() {
  return (
    <StarterPage
      description="Draft, tune, and revisit deck ideas without losing the thinking behind them."
      emptyCopy="Decklists, sideboards, notes, and revisions will take shape here."
      emptyTitle="Build with intention."
      eyebrow="Workshop"
      number="03"
      title="Ideas become decks here."
    />
  );
}
