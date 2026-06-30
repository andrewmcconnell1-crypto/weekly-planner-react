import { User } from "lucide-react";

// The coloured initial circle (or a neutral person icon for guests). Used small
// in the header and large in Settings.
function ProfileAvatar({ identity, size = "sm" }) {
  const { initial, tone, isGuest } = identity;
  const neutral = isGuest || !initial;
  const iconSize = size === "lg" ? 24 : 18;

  return (
    <span
      className={`profile-avatar profile-avatar-${size} ${
        neutral ? "profile-avatar-guest" : ""
      }`}
      // No tone on the neutral (guest) avatar, so its soft style isn't
      // out-specified by the [data-tone] colour rules.
      data-tone={neutral ? undefined : tone}
      aria-hidden="true"
    >
      {neutral ? <User size={iconSize} /> : initial}
    </span>
  );
}

export default ProfileAvatar;
