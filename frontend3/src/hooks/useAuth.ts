// src/hooks/useAuth.ts
// Lightweight bridge: export the single Auth context hook from the central provider.
// This ensures every component uses the same auth state (no duplicated local hooks).
export { useAuth } from "../context/AuthProvider";

export default function _unused(): never {
  throw new Error('Do not call default export from src/hooks/useAuth. Use named import { useAuth } instead.');
}
