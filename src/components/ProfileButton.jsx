import ProfileAvatar from "./ProfileAvatar";
import { profileIdentity } from "../utils/profile";

// The header account button — a profile avatar that opens Settings, replacing
// the old settings cog.
function ProfileButton({ user, guest, onClick }) {
  const identity = profileIdentity(user, guest);
  const label = identity.isGuest
    ? "Account and settings"
    : `Account and settings — ${identity.name}`;

  return (
    <button
      type="button"
      className="header-profile"
      aria-label={label}
      onClick={onClick}
    >
      <ProfileAvatar identity={identity} size="sm" />
    </button>
  );
}

export default ProfileButton;
