export function parseElectronQuery(search: URLSearchParams) {
  const clientId = search.get("client_id");
  const state = search.get("state");
  const codeChallenge = search.get("code_challenge");
  const codeChallengeMethod = search.get("code_challenge_method");

  if (
    clientId !== "electron" ||
    !isOpaqueValue(state, 128) ||
    !isOpaqueValue(codeChallenge, 128) ||
    codeChallengeMethod?.toUpperCase() !== "S256"
  ) {
    return null;
  }

  return {
    client_id: clientId,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  };
}

function isOpaqueValue(value: string | null, maxLength: number): value is string {
  return Boolean(value && value.length <= maxLength && /^[\w-]+$/.test(value));
}
