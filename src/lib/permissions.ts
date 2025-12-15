const DEFAULT_MASTER_EMAILS = ["wesleykrzyzanovski@gmail.com"];

export function getMasterEmails(): string[] {
  const env = process.env.NEXT_PUBLIC_MASTER_EMAILS;
  if (!env) return DEFAULT_MASTER_EMAILS;
  return env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isMasterEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const masterEmails = getMasterEmails();
  return masterEmails.includes(email.toLowerCase());
}
