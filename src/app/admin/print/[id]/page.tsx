import { Suspense } from "react";
import PrintOrder from "@/components/admin/orders/print/PrintOrder";

export default function PrintOrderPage() {
  return (
    <Suspense>
      <PrintOrder />
    </Suspense>
  );
}
