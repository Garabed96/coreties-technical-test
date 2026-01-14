import useSWR from 'swr';
import { Shipment } from '@/types/shipment';
import Navigation from '@/components/Navigation';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const {
    data: response,
    error,
    isLoading,
  } = useSWR<{ data: Shipment[]; total: number }>('/api/shipments', fetcher);

  const shipments = response?.data;

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
          <div className="mx-auto max-w-7xl">
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading shipments...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
          <div className="mx-auto max-w-7xl">
            <p className="text-red-600 dark:text-red-400">
              Error: {error.message}
            </p>
          </div>
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
            Total shipments: {response?.total.toLocaleString() ?? 0}
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
                  {shipments?.slice(0, 100).map(shipment => (
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
