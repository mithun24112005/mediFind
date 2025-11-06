import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-4 border-emerald-200 dark:border-gray-700"></div>
        <div className="absolute inset-0 h-24 w-24 rounded-full border-4 border-t-emerald-600 dark:border-t-emerald-400 animate-spin"></div>
        <Loader2 className="absolute inset-0 m-auto h-12 w-12 text-emerald-600 dark:text-emerald-400 animate-pulse" />
      </div>
      <p className="mt-6 text-emerald-700 dark:text-emerald-400 animate-pulse">
        Finding nearby pharmacies...
      </p>
    </div>
  );
}
