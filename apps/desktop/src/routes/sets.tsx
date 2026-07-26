import { createFileRoute } from "@tanstack/react-router";

import { StarterPage } from "../components/page";

export const Route = createFileRoute("/sets")({
  component: SetsPage,
});

function SetsPage() {
  return (
    <StarterPage
      description="Follow each release, see what you have, and notice the cards still missing."
      emptyCopy="Set checklists and completion progress will appear in this workspace."
      emptyTitle="See the gaps."
      eyebrow="Catalog"
      number="04"
      title="Sets, mapped clearly."
    />
  );
}
