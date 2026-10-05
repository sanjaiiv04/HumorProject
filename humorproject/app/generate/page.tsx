import AppShell from '@/components/AppShell'
import { createClient } from '@/lib/supabase/server'
import GenerateForm from './generate-form'
import MyGenerations from '@/app/generate/my-generations'

export default async function GeneratePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: myGenerations } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false })

  return (
    <AppShell>
      <main className="flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-lg">
          <h1 className="mb-6 font-display text-3xl text-[var(--color-content-ink)]">
            Generate a Caption
          </h1>
          <GenerateForm />

          <div className="mt-10 text-center">
            <a
              href="/rate"
              className="sticker inline-block rounded-full bg-[var(--color-like)] px-6 py-3 text-sm font-bold text-[var(--color-ink)]"
            >
              Rate Captions →
            </a>
          </div>

          <MyGenerations generations={myGenerations ?? []} />
        </div>
      </main>
    </AppShell>
  )
}