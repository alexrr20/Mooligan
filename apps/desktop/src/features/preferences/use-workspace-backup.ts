import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export function useWorkspaceBackup() {
  const bridge = window.workspace;
  const [result, setResult] = useState<"cancelled" | "exported" | "imported">();
  const exportBackup = useMutation({
    mutationFn: () => {
      if (!bridge) {
        throw new Error("Workspace backups are available in the desktop app.");
      }
      return bridge.exportBackup();
    },
    onSuccess: setResult,
  });
  const importBackup = useMutation({
    mutationFn: () => {
      if (!bridge) {
        throw new Error("Workspace backups are available in the desktop app.");
      }
      return bridge.importBackup();
    },
    onSuccess: setResult,
  });
  const error = exportBackup.error ?? importBackup.error;
  return {
    available: Boolean(bridge),
    busy: exportBackup.isPending || importBackup.isPending,
    error: error instanceof Error ? error.message : null,
    exportBackup: exportBackup.mutate,
    importBackup: importBackup.mutate,
    result,
  };
}
