/**
 * Maps Supabase auth error codes to translation keys
 */
export function getAuthErrorKey(error: any) {
  const message = error?.message?.toLowerCase() || "";
  const code = error?.code || "";

  // Invalid credentials
  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password") ||
    code === "invalid_credentials"
  ) {
    return "auth.error.invalidCredentials" as const;
  }

  // Email already exists
  if (
    message.includes("user already registered") ||
    message.includes("email already exists") ||
    code === "user_already_exists"
  ) {
    return "auth.error.emailExists" as const;
  }

  // Weak password
  if (
    message.includes("password") && message.includes("6 characters") ||
    code === "weak_password"
  ) {
    return "auth.error.weakPassword" as const;
  }

  // Invalid email
  if (
    message.includes("invalid email") ||
    code === "invalid_email"
  ) {
    return "auth.error.invalidEmail" as const;
  }

  // User not found
  if (
    message.includes("user not found") ||
    code === "user_not_found"
  ) {
    return "auth.error.userNotFound" as const;
  }

  // Too many requests
  if (
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    code === "over_request_rate_limit"
  ) {
    return "auth.error.tooManyRequests" as const;
  }

  // Network error
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    code === "network_error"
  ) {
    return "auth.error.networkError" as const;
  }

  // Default unknown error
  return "auth.error.unknownError" as const;
}

