export function getUserDisplayName(user, fallbackName = "") {
  return (
    fallbackName?.trim() ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "You"
  );
}

export async function ensureUserProfile(supabase, user, fallbackName = "") {
  const { data: existingProfile, error: profileLoadError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLoadError) {
    return { profile: null, isNewProfile: false, error: profileLoadError };
  }

  if (existingProfile) {
    return { profile: existingProfile, isNewProfile: false, error: null };
  }

  const { data: createdProfile, error: profileCreateError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      name: getUserDisplayName(user, fallbackName),
      email: user.email,
    })
    .select("id")
    .single();

  return {
    profile: createdProfile,
    isNewProfile: !profileCreateError,
    error: profileCreateError,
  };
}

function getTrustedDeviceKey(userId) {
  return `yourlove-trusted-device:${userId}`;
}

export function isTrustedDevice(userId) {
  if (typeof window === "undefined" || !userId) return false;
  return localStorage.getItem(getTrustedDeviceKey(userId)) === "true";
}

export function trustCurrentDevice(userId) {
  if (typeof window === "undefined" || !userId) return;
  localStorage.setItem(getTrustedDeviceKey(userId), "true");
}

export function hasEmailLoginPassword(user) {
  return user?.user_metadata?.password_set === true;
}
