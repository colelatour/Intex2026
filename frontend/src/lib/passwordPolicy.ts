export const MIN_PASSWORD_LENGTH = 14;

export function passwordMinLengthMessage(subject: string = "Your password"): string {
  return `${subject} must be ${MIN_PASSWORD_LENGTH} characters or more.`;
}

export function isPasswordLongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

