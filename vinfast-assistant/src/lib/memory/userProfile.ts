/**
 * User profile — persisted in localStorage.
 * Stores name, car variant, current km so the bot can greet by name.
 */

export interface UserProfile {
  name: string;
  carVariant: string;   // e.g. "VF8 Plus", "VF9 Eco"
  currentKm: number | null;
  updatedAt: number;
}

const KEY = 'vf_user_profile';

export function loadUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch { return null; }
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const existing = loadUserProfile() ?? { name: '', carVariant: '', currentKm: null, updatedAt: 0 };
  const updated = { ...existing, ...profile, updatedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export function clearUserProfile(): void {
  localStorage.removeItem(KEY);
}

/** Convert to backend-compatible dict */
export function profileToApiPayload(p: UserProfile | null): Record<string, unknown> | null {
  if (!p || (!p.name && !p.carVariant)) return null;
  return {
    name: p.name || undefined,
    car_variant: p.carVariant || undefined,
    current_km: p.currentKm ?? undefined,
  };
}
