import { supabase } from '@/lib/supabaseClient'

interface Grocery {
  Name: string
  Price: number
}

export default async function Home() {
  const { data: groceries, error } = await supabase
    .from('Groceries')
    .select('*')

  if (error) {
    return <p className="p-8 text-red-600">Error loading groceries: {error.message}</p>
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 py-16 px-4 dark:bg-black">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-3xl font-semibold text-black dark:text-zinc-50">
          Groceries
        </h1>

        <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-800">
          <table className="w-full text-left">
            <thead className="bg-zinc-100 dark:bg-zinc-900">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </th>
                <th className="px-6 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {(groceries as Grocery[]).map((item,index) => (
                <tr
                  key={index}
                  className="bg-white hover:bg-zinc-50 dark:bg-black dark:hover:bg-zinc-900"
                >
                  <td className="px-6 py-3 text-zinc-900 dark:text-zinc-100">
                    {item.Name}
                  </td>
                  <td className="px-6 py-3 text-zinc-900 dark:text-zinc-100">
                    ${item.Price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}