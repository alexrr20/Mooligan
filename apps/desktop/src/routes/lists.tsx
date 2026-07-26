import { createFileRoute } from "@tanstack/react-router";

import { StarterPage } from "../components/page";

export const Route = createFileRoute("/lists")({
  component: ListsPage,
});

function ListsPage() {
  return (
    <StarterPage
      description="Keep wantlists, trade piles, experiments, and every useful grouping together."
      emptyCopy="Saved groups of cards will wait here until you are ready for them."
      emptyTitle="Keep the next idea nearby."
      eyebrow="Notebook"
      number="05"
      title="Lists for what comes next."
    />
  );
}
