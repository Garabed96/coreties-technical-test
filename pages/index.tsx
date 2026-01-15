import useSWR from 'swr';
import { Shipment } from '@/types/shipment';
import Navigation from '@/components/Navigation';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    // You can customize this to throw specific messages based on status
    throw new Error('An error occurred while fetching the data.');
  }
  return res.json();
};

export default function Home() {
  const {
    data: response,
    error,
    isLoading,
    mutate,
  } = useSWR<{ data: Shipment[]; total: number }>('/api/shipments', fetcher);

  const shipments = response?.data;

  if (error) {
    return (
      <>
        <Navigation />
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-100 bg-white py-12 text-center shadow dark:border-red-900/30 dark:bg-zinc-900">
          {/* Friendly Icon */}
          <div className="mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/20">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Unable to load shipments
          </h3>

          <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            We encountered an issue retrieving the data. This might be a
            temporary connection issue.
          </p>

          {/* Retry Action */}
          <button
            onClick={() => mutate()}
            className="mt-6 inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:outline-none dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Try Again
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Shipments
          </h1>
          <p className="mb-8 text-zinc-600 dark:text-zinc-400">
            Total shipments:{' '}
            {isLoading ? (
              <span className="inline-block h-4 w-12 animate-pulse rounded bg-zinc-200 align-middle dark:bg-zinc-700" />
            ) : (
              (response?.total.toLocaleString() ?? 0)
            )}
          </p>

          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                      Importer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                      Exporter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                      Commodity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                      Weight (MT)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                  {isLoading
                    ? [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {[...Array(7)].map((_, j) => (
                            <td key={j} className="px-6 py-4">
                              <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : shipments?.slice(0, 100).map(shipment => (
                        <tr
                          key={shipment.id}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                            {shipment.id}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                            {shipment.importer_name}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                            {shipment.importer_country}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                            {shipment.exporter_name}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                            {shipment.shipment_date}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                            {shipment.commodity_name}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                            {shipment.weight_metric_tonnes}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            {response && response.total > 100 && (
              <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Showing first 100 of {response.total.toLocaleString()}{' '}
                  shipments
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
