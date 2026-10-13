import { Suspense } from "react";
import PrintCutlist from "@/components/admin/orders/print/PrintCutlist";

export default function PrintCutlistPage() {
  return (
    <Suspense>
      <PrintCutlist />
    </Suspense>
  );
}
