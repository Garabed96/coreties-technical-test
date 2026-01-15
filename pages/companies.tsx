import { useState } from 'react';
import useSWR from 'swr';
import Navigation from '@/components/Navigation';
import CompanyDetail from '@/components/CompanyDetail';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { StatsResponse, CompaniesResponse } from '@/types/company';

const fetcher = (url: string) => fetch(url).then(res => res.json());
const PAGE_SIZE = 20;

export default function CompaniesPage() {
  const [selectedCompanyOverride, setSelectedCompanyOverride] = useState<
    string | null
  >(null);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useSWR<StatsResponse>('/api/companies/stats', fetcher);

  // Fetch company list with pagination
  const {
    data: companiesData,
    isLoading: companiesLoading,
    error: companiesError,
  } = useSWR<CompaniesResponse>(
    `/api/companies?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
    fetcher
  );

  // Filter companies by search query (client-side)
  const filteredCompanies =
    companiesData?.data?.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  // Calculate pagination info
  const totalPages = Math.ceil((companiesData?.total ?? 0) / PAGE_SIZE);
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  // Derive selected company: Use override if set, otherwise default to the first filtered company
  const selectedCompany =
    selectedCompanyOverride ?? filteredCompanies[0]?.name ?? null;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Companies Overview
          </h1>

          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Total Companies Card */}
            <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Total Companies
              </h2>
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="mb-2 h-8 w-20 rounded bg-zinc-200 dark:bg-zinc-700"></div>
                  <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700"></div>
                </div>
              ) : statsError ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Failed to load stats
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                      {stats?.totalImporters?.toLocaleString() ?? '-'}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Importers
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                      {stats?.totalExporters?.toLocaleString() ?? '-'}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Exporters
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Top Commodities Card */}
            <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Top 5 Commodities by Weight
              </h2>
              {statsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700"></div>
                      <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700"></div>
                    </div>
                  ))}
                </div>
              ) : statsError ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Failed to load commodities
                </p>
              ) : (
                <div className="space-y-3">
                  {stats?.topCommodities?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-zinc-400 dark:text-zinc-600">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-zinc-900 dark:text-zinc-50">
                          {item.commodity}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        {new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          compactDisplay: 'short',
                        }).format(item.kg)}{' '}
                        kg
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Monthly KG Chart */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="mb-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Total Weight Shipped per Month (kg)
            </h2>
            <div className="h-64">
              {statsLoading ? (
                <div className="h-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
              ) : statsError ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Failed to load chart data
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.monthlyVolume ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="month"
                      stroke="#71717a"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="#71717a"
                      style={{ fontSize: '12px' }}
                      tickFormatter={value => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        color: '#fafafa',
                      }}
                      formatter={value => [
                        `${Number(value).toLocaleString()} kg`,
                        'Weight',
                      ]}
                    />
                    <Bar dataKey="kg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Master-Detail: Company List + Detail Panel */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Company List (Left/Main) */}
            <div className="flex flex-col rounded-lg bg-white shadow lg:col-span-2 dark:bg-zinc-900">
              {/* Header - Fixed */}
              <div className="flex-shrink-0 border-b border-zinc-200 p-6 dark:border-zinc-800">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      Company List
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {companiesData?.total
                        ? `${companiesData.total.toLocaleString()} companies`
                        : 'Loading...'}
                      {searchQuery && ` · ${filteredCompanies.length} matches`}
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search companies..."
                      value={searchQuery}
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        setPage(0);
                        setSelectedCompanyOverride(null);
                      }}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 pr-10 pl-10 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-64 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
                    />
                    <svg
                      className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setPage(0);
                          setSelectedCompanyOverride(null);
                        }}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable Table Area - Fixed Height */}
              <div className="h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white dark:bg-zinc-900">
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                        Company Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                        Country
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                        Shipments
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                        Total Weight
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {companiesLoading ? (
                      [...Array(10)].map((_, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-zinc-100 dark:border-zinc-800"
                        >
                          <td className="px-6 py-4">
                            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="ml-auto h-4 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="ml-auto h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
                          </td>
                        </tr>
                      ))
                    ) : companiesError ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-sm text-red-600 dark:text-red-400"
                        >
                          Failed to load companies
                        </td>
                      </tr>
                    ) : filteredCompanies.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
                        >
                          {searchQuery
                            ? `No results for "${searchQuery}"`
                            : 'No companies found'}
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((company, idx) => (
                        <tr
                          key={idx}
                          onClick={() =>
                            setSelectedCompanyOverride(company.name)
                          }
                          className={`cursor-pointer border-b border-zinc-100 transition-colors dark:border-zinc-800 ${
                            selectedCompany === company.name
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                            {company.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {company.country}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-zinc-900 dark:text-zinc-50">
                            {company.totalShipments.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                            {company.totalWeight.toLocaleString()} kg
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls - Fixed at Bottom */}
              <div className="flex flex-shrink-0 items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPage(0);
                      setSelectedCompanyOverride(null);
                    }}
                    disabled={!hasPrevPage || !!searchQuery}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    title="First page"
                  >
                    ««
                  </button>
                  <button
                    onClick={() => {
                      setPage(p => p - 1);
                      setSelectedCompanyOverride(null);
                    }}
                    disabled={!hasPrevPage || !!searchQuery}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    title="Previous page"
                  >
                    «
                  </button>
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {searchQuery
                    ? `${filteredCompanies.length} results`
                    : `Page ${page + 1} of ${totalPages}`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPage(p => p + 1);
                      setSelectedCompanyOverride(null);
                    }}
                    disabled={!hasNextPage || !!searchQuery}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    title="Next page"
                  >
                    »
                  </button>
                  <button
                    onClick={() => {
                      setPage(totalPages - 1);
                      setSelectedCompanyOverride(null);
                    }}
                    disabled={!hasNextPage || !!searchQuery}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    title="Last page"
                  >
                    »»
                  </button>
                </div>
              </div>
            </div>

            {/* Company Detail Panel (Right) */}
            <div className="rounded-lg bg-white shadow dark:bg-zinc-900">
              <CompanyDetail companyName={selectedCompany} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
