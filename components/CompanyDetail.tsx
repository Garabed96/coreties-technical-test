import useSWR from 'swr';
import type { CompanyDetail as CompanyDetailType } from '@/types/company';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface CompanyDetailProps {
  companyName: string | null;
}

export default function CompanyDetail({ companyName }: CompanyDetailProps) {
  // Fetch company detail when a company is selected
  const { data: detail, isLoading } = useSWR<CompanyDetailType>(
    companyName ? `/api/companies/${encodeURIComponent(companyName)}` : null,
    fetcher
  );

  // No company selected state
  if (!companyName) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Select a company from the list to view details
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse p-6">
        <div className="mb-2 h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-700"></div>
        <div className="mb-4 h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700"></div>
        <div className="mb-6 h-4 w-56 rounded bg-zinc-200 dark:bg-zinc-700"></div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <div className="mb-1 h-8 w-12 rounded bg-zinc-200 dark:bg-zinc-700"></div>
            <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700"></div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <div className="mb-1 h-8 w-12 rounded bg-zinc-200 dark:bg-zinc-700"></div>
            <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700"></div>
          </div>
        </div>

        <div className="mb-6 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-zinc-200 dark:bg-zinc-700"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  // Error or not found state
  if (!detail || 'error' in detail) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Company not found
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {detail.name}
      </h2>
      <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
        {detail.country}
      </p>
      <p className="mb-4 text-xs text-zinc-400 capitalize dark:text-zinc-500">
        Role: {detail.role}
      </p>
      {detail.website && (
        <a
          href={
            detail.website.startsWith('http')
              ? detail.website
              : `https://${detail.website}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          {detail.website}
        </a>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {detail.totalShipments.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Shipments</p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {(detail.totalWeight / 1000).toFixed(1)}k
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">kg Total</p>
        </div>
      </div>

      {/* Top Trading Partners */}
      {detail.topTradingPartners.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Top Trading Partners
          </h3>
          <div className="space-y-2">
            {detail.topTradingPartners.map((partner, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="text-zinc-900 dark:text-zinc-50">
                    {partner.name}
                  </span>
                  <span className="ml-2 text-zinc-400 dark:text-zinc-500">
                    {partner.country}
                  </span>
                </div>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {partner.shipments}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Commodities */}
      {detail.topCommodities.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Top Commodities
          </h3>
          <div className="space-y-2">
            {detail.topCommodities.map((commodity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-zinc-900 dark:text-zinc-50">
                  {commodity.name}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {(commodity.kg / 1000).toFixed(1)}k kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
