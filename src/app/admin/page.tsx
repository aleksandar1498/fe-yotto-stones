import { Suspense } from "react";
import AdminTabs from "@/components/admin/AdminTabs";

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminTabs />
    </Suspense>
  );
}
