import { RedeKidsModulePage } from "@/features/rede-kids/module-page";

export const dynamic = "force-dynamic";

export default async function MembrosPage() {
  return <RedeKidsModulePage moduleId="members" />;
}