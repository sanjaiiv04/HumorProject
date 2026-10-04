import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'

interface Grocery {
  Name: string
  Price: number
}

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: groceries, error } = await supabase
    .from('Groceries')
    .select('*')

  return (
    <AppShell>
      <main className="flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-2xl">
        <h1 className="mb-1 font-display text-3xl text-[var(--color-ink)]">            Groceries
          </h1>

          {error ? (
            <p className="text-red-600">Error loading groceries: {error.message}</p>
          ) : (
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
                  {(groceries as Grocery[])?.map((item, index) => (
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
              {groceries?.length === 0 && (
                <p className="p-6 text-center text-sm text-zinc-400">
                  No items to show while logged in (RLS currently scopes reads to anonymous users).
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  )
}