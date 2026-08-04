import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const preferenceSyncQueryKey = ["preference-sync"] as const;
const localOnly: PreferenceSyncSnapshot = { status: "local-only" };

export function usePreferenceSync() {
  const bridge = window.preferenceSync;
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: preferenceSyncQueryKey,
    queryFn: () => {
      if (!bridge) {
        throw new Error("Preference sync is available in the desktop app.");
      }
      return bridge.read();
    },
    enabled: Boolean(bridge),
    retry: false,
    staleTime: Infinity,
  });
  const retry = useMutation({
    mutationFn: () => {
      if (!bridge) {
        throw new Error("Preference sync is available in the desktop app.");
      }
      return bridge.retry();
    },
    onSuccess: (snapshot) => queryClient.setQueryData(preferenceSyncQueryKey, snapshot),
  });

  useEffect(() => {
    if (!bridge) {
      return;
    }
    return bridge.onChanged((snapshot) => {
      queryClient.setQueryData(preferenceSyncQueryKey, snapshot);
    });
  }, [bridge, queryClient]);

  return {
    available: Boolean(bridge),
    busy: retry.isPending,
    retry: retry.mutate,
    snapshot: query.data ?? localOnly,
  };
}
