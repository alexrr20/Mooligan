import { createFileRoute } from "@tanstack/react-router";

import { StarterPage } from "../components/page";

export const Route = createFileRoute("/collection")({
  component: CollectionPage,
});

function CollectionPage() {
  return (
    <StarterPage
      description="Your complete card library, organized for browsing rather than buried in boxes."
      emptyCopy="Card records, quantities, conditions, and printings will gather here."
      emptyTitle="Your collection starts here."
      eyebrow="Library"
      number="02"
      title="Every card, close at hand."
    />
  );
}
