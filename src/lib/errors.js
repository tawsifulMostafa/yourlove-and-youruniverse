export function getFriendlyErrorMessage(error, fallback = "Something went wrong") {
  const message = error?.message || fallback;

  if (message.includes("Could not find the function")) {
    return "Setup is not finished yet. Run the latest Supabase SQL setup and try again.";
  }

  if (message.includes("row-level security")) {
    return "This action is blocked by security rules. Refresh and try again.";
  }

  if (message.includes("permission denied for table")) {
    return "Database setup needs one more update. Run the latest Supabase SQL setup.";
  }

  if (message.includes("check constraint")) {
    return "Database setup is out of date. Run the latest Supabase SQL setup.";
  }

  if (message.includes("duplicate key")) {
    return "This already exists. Try again.";
  }

  if (message.includes("JWT") || message.includes("not authenticated")) {
    return "Please login again.";
  }

  return message;
}
