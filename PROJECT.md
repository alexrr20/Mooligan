# Mooligan product context

Mooligan is a desktop app for managing Magic: The Gathering cards, decks, and
collections. The current implementation is an early foundation, not the limit
of the intended product.

## Product direction

Mooligan should make it easy to:

- Find and inspect MTG cards.
- Track a personal card collection.
- Build, organize, and manage decks.
- Use the core product locally without an internet connection or an account.
- Optionally sign in to sync data with a future mobile app and share selected
  content with friends.

This describes the product direction rather than a committed feature roadmap.

## Product principles

### Local and offline first

The desktop app's core card, collection, and deck workflows must work without
an account or a continuous network connection. User-owned data should remain
available locally. Network services may update reference data or add optional
capabilities, but should not become a prerequisite for normal use.

### Accounts are optional

Users should be able to start and continue using Mooligan without signing in.
An account exists for features that inherently need a service, principally
cross-device sync and sharing with friends.

### Cloud features enhance the local product

Sync and sharing must be layered on top of a complete local experience. A
service outage or missing login should not prevent users from viewing or
editing their local cards, decks, and collection.

### Plan for mobile without building it prematurely

Domain concepts and data ownership decisions should leave a clear path to a
future mobile client and synchronization. Do not implement speculative mobile
or sync infrastructure before its requirements are known.

## Decision guidance

When evaluating product or architecture choices:

1. Optimize for the intended card, deck, and collection management experience,
   not only for the features that happen to exist today.
2. Prefer local storage and local execution for core workflows.
3. Keep authentication, sharing, and synchronization outside the critical path
   of offline use.
4. Preserve clear, reusable domain concepts where that supports both desktop
   and a future mobile client, without adding abstractions solely for possible
   future needs.

## Non-goals

- Requiring an account for core functionality.
- Turning the desktop app into a thin client that depends on a remote backend.
- Requiring continuous connectivity to access user-owned data.
- Treating the current barebones interface or feature set as the finished
  product definition.

## Current state

The repository currently contains an early Electron desktop app, a small
Cloudflare API, shared domain types, and an offline Scryfall catalog import and
search foundation. See `README.md` for current setup and implementation details.
