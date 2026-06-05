import type { ReactNode } from "react";

export function PageContainer({
  message,
  isPending,
  showStatus = true,
  children,
}: {
  message: string;
  isPending: boolean;
  showStatus?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      {showStatus && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
          <span className="font-medium text-zinc-700">{message}</span>
          {isPending ? (
            <span className="font-semibold text-amber-700">Salvando...</span>
          ) : (
            <span className="font-semibold text-emerald-700">Online</span>
          )}
        </div>
      )}

      {children}
    </main>
  );
}
