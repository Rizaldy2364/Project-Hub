"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Toast, useToast } from "@/components/ui/toast";

export function LoginToast() {
  const searchParams = useSearchParams();
  const { toast, show } = useToast();

  useEffect(() => {
    const toastParam = searchParams.get("toast");
    if (toastParam) {
      show(toastParam);
      const url = new URL(window.location.href);
      url.searchParams.delete("toast");
      window.history.replaceState({}, "", url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return <Toast toast={toast} />;
}
