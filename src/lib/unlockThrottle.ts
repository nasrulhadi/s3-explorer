/**
 * Progressive unlock throttle.
 *
 * The real protection against brute force is the vault's PBKDF2 work factor.
 * This adds a gentle, human-facing speed bump for casual guessing: after a few
 * wrong tries the unlock button pauses for a while, and the pause grows the
 * more it happens. The counter is persisted so closing and reopening the app
 * doesn't reset the cooldown.
 */

const STORAGE_KEY = "s3-explorer-unlock-throttle";

/** Wrong attempts allowed before any cooldown kicks in. */
const FREE_ATTEMPTS = 4;

/** Cooldown ladder (seconds) applied on the 5th wrong attempt onward. */
const COOLDOWN_LADDER_SECONDS = [30, 60, 120, 300, 600];

interface ThrottleState {
  /** Consecutive wrong attempts. */
  fails: number;
  /** Epoch ms when the current cooldown ends (0 = none). */
  lockedUntil: number;
}

function read(): ThrottleState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { fails: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw) as Partial<ThrottleState>;
    return {
      fails: typeof parsed.fails === "number" && parsed.fails > 0 ? parsed.fails : 0,
      lockedUntil:
        typeof parsed.lockedUntil === "number" && parsed.lockedUntil > 0
          ? parsed.lockedUntil
          : 0,
    };
  } catch {
    return { fails: 0, lockedUntil: 0 };
  }
}

function write(state: ThrottleState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable — throttle simply won't persist. Not fatal.
  }
}

/**
 * Seconds remaining on the current cooldown, or 0 if the user may try now.
 */
export function getRemainingCooldownSeconds(): number {
  const { lockedUntil } = read();
  if (!lockedUntil) return 0;
  const remainingMs = lockedUntil - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

/**
 * Record a failed attempt and return the resulting cooldown in seconds
 * (0 if the user still has free attempts left).
 */
export function registerFailedAttempt(): number {
  const state = read();
  const fails = state.fails + 1;

  if (fails <= FREE_ATTEMPTS) {
    write({ fails, lockedUntil: 0 });
    return 0;
  }

  // Pick a step on the ladder, clamped to its last (longest) entry.
  const stepIndex = Math.min(fails - FREE_ATTEMPTS - 1, COOLDOWN_LADDER_SECONDS.length - 1);
  const cooldownSeconds = COOLDOWN_LADDER_SECONDS[stepIndex];
  write({ fails, lockedUntil: Date.now() + cooldownSeconds * 1000 });
  return cooldownSeconds;
}

/** Clear all throttle state after a successful unlock. */
export function resetThrottle(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
