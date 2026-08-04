import { electronProxyClient } from "@better-auth/electron/proxy";
import { createAuthClient } from "better-auth/client";

import { parseElectronQuery } from "./auth-query";

const protocol = "com.mooligan.app";
const authorizationCookie = "better-auth.electron";
const query = parseElectronQuery(new URLSearchParams(location.search));
const authClient = createAuthClient({
  baseURL: location.origin,
  plugins: [electronProxyClient({ protocol })],
});
const signInButton = element<HTMLButtonElement>("sign-in");
const continueButton = element<HTMLButtonElement>("continue");
const signedIn = element<HTMLDivElement>("signed-in");
const signedOut = element<HTMLDivElement>("signed-out");
const identity = element<HTMLParagraphElement>("identity");
const errorMessage = element<HTMLParagraphElement>("error");
const manual = element<HTMLDivElement>("manual");
const code = element<HTMLElement>("authorization-code");
const copyButton = element<HTMLButtonElement>("copy-code");
const copyLabel = element<HTMLSpanElement>("copy-label");
let authorizationCode: string | null = null;

const stopRedirect = watchForAuthorizationCode();
window.addEventListener("pagehide", stopRedirect, { once: true });

if (!query) {
  showError("This sign-in link is incomplete. Return to Mooligan and try again.");
  signInButton.disabled = true;
} else {
  void showSession();
}

signInButton.addEventListener("click", () => {
  if (!query) {
    return;
  }

  setBusy(signInButton, true);
  void authClient.signIn
    .social({ provider: "google", fetchOptions: { query } })
    .then(({ error }) => {
      if (error) {
        throw error;
      }
    })
    .catch(() => {
      setBusy(signInButton, false);
      showError("Google sign-in could not be started. Please try again.");
    });
});

continueButton.addEventListener("click", () => {
  if (!query) {
    return;
  }

  setBusy(continueButton, true);
  void authClient.electron
    .transferUser({ fetchOptions: { query } })
    .then(({ error }) => {
      if (error) {
        throw error;
      }
    })
    .catch(() => {
      setBusy(continueButton, false);
      showError("This account could not be sent to Mooligan. Please try again.");
    });
});

copyButton.addEventListener("click", () => {
  if (!authorizationCode) {
    return;
  }

  void navigator.clipboard.writeText(authorizationCode).then(() => {
    copyLabel.textContent = "Copied";
    setTimeout(() => {
      copyLabel.textContent = "Copy";
    }, 2_000);
  });
});

async function showSession() {
  try {
    const { data } = await authClient.getSession();

    if (!data) {
      return;
    }

    identity.textContent = `Signed in as ${data.user.name}`;
    signedOut.hidden = true;
    signedIn.hidden = false;
  } catch {
    // A browser session is optional; the provider button can still start sign-in.
  }
}

function setBusy(button: HTMLButtonElement, busy: boolean) {
  button.disabled = busy;
  button.setAttribute("aria-busy", String(busy));
}

function showError(message: string) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function watchForAuthorizationCode() {
  const startedAt = Date.now();
  const redirectTimer = window.setInterval(() => {
    const nextCode = authClient.electron.getAuthorizationCode();

    if (!nextCode) {
      if (Date.now() - startedAt >= 5 * 60 * 1_000) {
        clearInterval(redirectTimer);
      }
      return;
    }

    clearInterval(redirectTimer);
    authorizationCode = nextCode;
    code.textContent = nextCode;
    manual.hidden = false;
    document.cookie = `${authorizationCookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    window.location.replace(`${protocol}://auth/callback#token=${encodeURIComponent(nextCode)}`);
  }, 100);

  return () => clearInterval(redirectTimer);
}

function element<ElementType extends HTMLElement>(id: string) {
  const value = document.getElementById(id);

  if (!value) {
    throw new Error(`Missing sign-in element: ${id}`);
  }

  return value as ElementType;
}
