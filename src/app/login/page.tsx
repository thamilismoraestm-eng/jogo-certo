import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ logout?: string; returnTo?: string }>;
}) {
  const { logout, returnTo } = await searchParams;

  return <LoginForm didSignOut={logout === "sucesso"} returnTo={returnTo} />;
}
