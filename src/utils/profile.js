// Derives the bits the UI needs to show an account: a display name, the email,
// a single initial for the avatar, and a stable tone (0–4) so each account gets
// a consistent avatar colour. Google sign-ins carry a name in user_metadata;
// email sign-ups fall back to the email.

const TONES = 5;

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function profileIdentity(user, guest = false) {
  if (guest || !user) {
    return {
      isGuest: true,
      name: guest ? "Guest" : "You",
      displayName: null,
      email: null,
      initial: null,
      tone: 0,
    };
  }

  const meta = user.user_metadata || {};
  const fullName = String(meta.full_name || meta.name || "").trim();
  const email = String(user.email || "").trim();
  const source = fullName || email;
  const match = source.match(/[a-zA-Z0-9]/);

  return {
    isGuest: false,
    name: fullName || email || "Your account",
    displayName: fullName || null,
    email: email || null,
    initial: match ? match[0].toUpperCase() : "?",
    tone: hashString(email || source) % TONES,
  };
}
