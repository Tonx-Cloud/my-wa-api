"use client";

import { useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const attributesToRemove = [
      "data-atm-ext-installed",
      "data-new-gr-c-s-check-loaded",
      "data-gr-ext-installed",
      "cz-shortcut-listen"
    ];
    attributesToRemove.forEach(attr => {
      if (document.body.hasAttribute(attr)) {
        document.body.removeAttribute(attr);
      }
    });
  }, []);

  return <>{children}</>;
}
