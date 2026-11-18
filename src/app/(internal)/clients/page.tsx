import { getClientsWithStats } from "@/features/clients/queries";
import { ClientDirectory } from "@/features/clients/components/client-directory";
import { CreateClientDialog } from "@/features/clients/components/create-client-dialog";

export default async function ClientsPage() {
  const clients = await getClientsWithStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Clients</h1>
        <CreateClientDialog />
      </div>
      <ClientDirectory clients={clients} />
    </div>
  );
}
