/** Site oturumu — @supabase/ssr çerez parçaları bu anahtar adıyla saklanır */
export const SITE_AUTH_STORAGE_KEY = "sk-site-auth";

/** Site geneli oturum — tüm sayfalarda geçerli */
export const SITE_AUTH_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
};
