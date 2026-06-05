import { redirect } from "next/navigation";
import { getOptionalAuthenticatedUser } from "@/lib/auth";
import { LoginScreen } from "./login-screen";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const currentUser = await getOptionalAuthenticatedUser();

  if (currentUser) {
    redirect("/");
  }

  return <LoginScreen />;
}