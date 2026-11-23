import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ logout?: string }>;
}) {
  const { logout } = await searchParams;

  return <LoginForm didSignOut={logout === "sucesso"} />;
}
