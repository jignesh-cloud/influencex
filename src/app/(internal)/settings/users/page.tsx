import { getAllUsers } from "@/features/settings/users/queries";
import { UserManagement } from "@/features/settings/users/components/user-management";
import { requireUser } from "@/lib/auth";

export default async function SettingsUsersPage() {
  const [users, currentUser] = await Promise.all([getAllUsers(), requireUser()]);

  return <UserManagement users={users} isAdmin={currentUser.role === "admin"} />;
}
