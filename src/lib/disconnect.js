export const DISCONNECT_HOURS = 24;
const CONFIRMATION_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateSecureSuffix(length = 4) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  return Array.from(values, (value) => CONFIRMATION_CHARS[value % CONFIRMATION_CHARS.length]).join("");
}

export function generateDisconnectPhrase() {
  return `disconnect-${generateSecureSuffix()}`;
}

export function isDisconnectPending(couple) {
  return Boolean(couple?.disconnect_requested_at && couple?.disconnect_delete_after);
}

export function formatDisconnectCountdown(deleteAfter) {
  if (!deleteAfter) return "within 24 hours";

  const remainingMs = new Date(deleteAfter).getTime() - Date.now();
  if (Number.isNaN(remainingMs) || remainingMs <= 0) return "soon";

  const totalMinutes = Math.ceil(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;

  return `${hours}h ${minutes}m`;
}
