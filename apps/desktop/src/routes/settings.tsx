import { createFileRoute } from "@tanstack/react-router";

import { StarterPage } from "../components/page";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <StarterPage
      description="Choose how Mooligan stores, displays, and protects the library on this device."
      emptyCopy="Library location, appearance, backups, and data preferences will live here."
      emptyTitle="Make the workspace yours."
      eyebrow="System"
      number="07"
      title="Quiet controls, one place."
    />
  );
}
