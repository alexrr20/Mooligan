import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const authQueryKey = ["auth"] as const;
const signedOut: AuthSnapshot = {
  pendingAuth: false,
  status: "signed-out",
  user: null,
};

export function useAuth() {
  const bridge = window.auth;
  const queryClient = useQueryClient();
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: authQueryKey,
    queryFn: () => {
      if (!bridge) {
        throw new Error("Accounts are available in the desktop app.");
      }

      return bridge.read();
    },
    enabled: Boolean(bridge),
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!bridge) {
      return;
    }

    const stopSnapshot = bridge.onChanged((snapshot) => {
      setCallbackError(null);
      queryClient.setQueryData(authQueryKey, snapshot);
    });
    const stopError = bridge.onError(setCallbackError);

    return () => {
      stopSnapshot();
      stopError();
    };
  }, [bridge, queryClient]);

  const signIn = useMutation({
    mutationFn: () => requireBridge(bridge).signIn(),
    onSuccess: (snapshot) => queryClient.setQueryData(authQueryKey, snapshot),
  });
  const complete = useMutation({
    mutationFn: (code: string) => requireBridge(bridge).complete(code),
    onSuccess: (snapshot) => queryClient.setQueryData(authQueryKey, snapshot),
  });
  const refresh = useMutation({
    mutationFn: () => requireBridge(bridge).refresh(),
    onSuccess: (snapshot) => queryClient.setQueryData(authQueryKey, snapshot),
  });
  const signOut = useMutation({
    mutationFn: () => requireBridge(bridge).signOut(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: authQueryKey }),
    onSuccess: (snapshot) => queryClient.setQueryData(authQueryKey, snapshot),
  });
  const mutationError = signIn.error ?? complete.error ?? refresh.error ?? signOut.error;

  return {
    available: Boolean(bridge),
    busy: signIn.isPending || complete.isPending || refresh.isPending || signOut.isPending,
    complete: complete.mutate,
    error: callbackError ?? (mutationError instanceof Error ? mutationError.message : null),
    loading: query.isLoading,
    refresh: refresh.mutate,
    signIn: signIn.mutate,
    signOut: signOut.mutate,
    snapshot: query.data ?? signedOut,
  };
}

function requireBridge(bridge: Window["auth"]): NonNullable<Window["auth"]> {
  if (!bridge) {
    throw new Error("Accounts are available in the desktop app.");
  }

  return bridge;
}
