import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navigation() {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex h-16 items-center gap-8">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Coreties
          </h1>
          <div className="flex gap-4">
            <Link
              href="/"
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
              }`}
            >
              Shipments
            </Link>
            <Link
              href="/companies"
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/companies')
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
              }`}
            >
              Companies
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
