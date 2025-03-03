import { Suspense } from "react";
import AuthErrorPageClient from "./AuthErrorPageClient";

export default function AuthErrorWrapper() {
  return (
    <Suspense fallback={<p>Loading error page...</p>}>
      <AuthErrorPageClient />
    </Suspense>
  );
}