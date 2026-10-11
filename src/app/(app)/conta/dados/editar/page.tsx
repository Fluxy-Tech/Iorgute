import type { Metadata } from "next";
import { BackHeader } from "@/components/app/back-header";
import { requireUser } from "@/lib/session";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Editar dados" };

export default async function EditProfilePage() {
  const user = await requireUser();
  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-6 lg:max-w-2xl lg:p-0">
      <BackHeader title="Editar dados" href="/conta/dados" />
      <ProfileForm name={user.name} phone={user.phone ?? ""} email={user.email} />
    </div>
  );
}
