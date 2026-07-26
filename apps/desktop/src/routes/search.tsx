import { createFileRoute } from "@tanstack/react-router";

import { StarterPage } from "../components/page";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  return (
    <StarterPage
      description="Search across names, sets, colors, types, and the details that make a card useful."
      emptyCopy="Fast, filterable results will appear once the card index is connected."
      emptyTitle="Find the exact card."
      eyebrow="Index"
      number="06"
      title="Search without the noise."
    />
  );
}
