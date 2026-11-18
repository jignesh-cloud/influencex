import { Card } from "@/components/ui/card";

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 p-5">
      <p className="text-3xl font-semibold text-neutral-900">{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </Card>
  );
}
