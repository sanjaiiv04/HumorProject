import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <div className="page-fade-in flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}