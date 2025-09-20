// Header.tsx
import { useRealtimeActiveUsers } from '@/hooks/useRealtime';

export const Header: React.FC = () => {
  // ...
  const active = useRealtimeActiveUsers(10000);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/70 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
      <div className="flex items-center gap-4">
        {/* ...existing */}
        {typeof active === 'number' && (
          <span className="hidden rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300 sm:inline">
            Active: {active}
          </span>
        )}
      </div>
      {/* ...rest */}
    </header>
  );
};
