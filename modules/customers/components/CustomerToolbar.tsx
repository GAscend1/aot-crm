import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CustomerToolbar() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <Input
        placeholder="Search customers..."
        className="md:max-w-sm"
      />

      <Button>
        Add Customer
      </Button>
    </div>
  );
}