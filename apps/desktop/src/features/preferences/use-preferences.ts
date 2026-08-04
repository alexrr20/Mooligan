import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const preferencesQueryKey = ["preferences"] as const;
const defaultPreferences: Preferences = { motion: "system" };

export function usePreferences() {
  const bridge = window.preferences;
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: preferencesQueryKey,
    queryFn: () => {
      if (!bridge) {
        throw new Error("Preferences are available in the desktop app.");
      }

      return bridge.read();
    },
    enabled: Boolean(bridge),
    retry: false,
    staleTime: Infinity,
  });
  const mutation = useMutation({
    mutationFn: (update: Partial<Preferences>) => {
      if (!bridge) {
        throw new Error("Preferences are available in the desktop app.");
      }

      return bridge.update(update);
    },
    onSuccess: (preferences) => {
      queryClient.setQueryData(preferencesQueryKey, preferences);
    },
  });

  useEffect(() => {
    if (!bridge) {
      return;
    }

    return bridge.onChanged((preferences) => {
      queryClient.setQueryData(preferencesQueryKey, preferences);
    });
  }, [bridge, queryClient]);

  return {
    available: Boolean(bridge),
    error: query.error ?? mutation.error,
    loading: query.isLoading,
    preferences: query.data ?? defaultPreferences,
    saving: mutation.isPending,
    update: mutation.mutate,
  };
}
