"use client";

import { useEffect } from "react";
import { Toast, useToast } from "@/components/ui/toast";

interface DashboardToastProps {
  toastMessage?: string;
}

export function DashboardToast({ toastMessage }: DashboardToastProps) {
  const { toast, show } = useToast();

  useEffect(() => {
    if (toastMessage) {
      show(toastMessage);
      const url = new URL(window.location.href);
      url.searchParams.delete("toast");
      window.history.replaceState({}, "", url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toastMessage]);

  return <Toast toast={toast} />;
}
