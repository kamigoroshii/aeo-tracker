import '../src/app/globals.css'

export const metadata = {
  title: 'AEO Tracker - Monitor Your AI Engine Presence',
  description: 'Track your brand visibility across AI search engines like ChatGPT, Perplexity, and Gemini',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {children}
      </body>
    </html>
  )
}
