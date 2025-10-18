import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  Grid,
  Metric,
  Text,
  Title,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
} from '@tremor/react'
import { Recommendations } from '@/components/Recommendations'
import { RunCheckButton } from '@/components/RunCheckButton'
import dynamic from 'next/dynamic'

// Import chart with no SSR to prevent hydration errors
const TrendChart = dynamic(() => import('@/components/TrendChart').then(mod => ({ default: mod.TrendChart })), {
  ssr: false,
  loading: () => (
    <div className="h-72 flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading chart...</div>
    </div>
  )
})

type PageProps = {
  params: { id: string }
}

export default async function ProjectDashboard({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const projectId = params.id

  // 1. Fetch project details
  const { data: project } = await supabase
    .from('projects')
    .select('name, domain')
    .eq('id', projectId)
    .single()

  // 2. Fetch data from our RPC functions
  const { data: kpis } = await supabase.rpc('get_project_kpis', {
    p_project_id: projectId,
  })

  const { data: trendData } = await supabase.rpc('get_project_trend', {
    p_project_id: projectId,
  })

  // 3. Fetch data for the keyword list
  const { data: keywordsData } = await supabase
    .from('keywords')
    .select('id, text')
    .eq('project_id', projectId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 backdrop-blur-lg bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">{project?.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project?.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{project?.domain}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Back to Projects
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="mb-8">
          <Title className="text-3xl font-bold">{project?.name} Dashboard</Title>
          <Text className="mt-2">Monitor your AI Engine visibility across ChatGPT, Perplexity, and Gemini</Text>
        </div>

        {/* KPI Cards */}
        <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mt-6">
          <Card decoration="top" decorationColor="blue">
            <Text>Overall Visibility (24h)</Text>
            <Metric>{Number(kpis?.visibility_score || 0).toFixed(1)}%</Metric>
            <Text className="mt-2 text-sm text-gray-500">
              Average presence across all engines
            </Text>
          </Card>
          <Card decoration="top" decorationColor="purple">
            <Text>Tracked Keywords</Text>
            <Metric>{kpis?.total_keywords || 0}</Metric>
            <Text className="mt-2 text-sm text-gray-500">
              Active keyword monitoring
            </Text>
          </Card>
          <Card decoration="top" decorationColor="emerald">
            <Text>Engines Covered</Text>
            <Metric>{kpis?.engines_covered || 0}</Metric>
            <Text className="mt-2 text-sm text-gray-500">
              ChatGPT, Perplexity, Gemini
            </Text>
          </Card>
        </Grid>

        {/* Visibility Trend Chart */}
        <Card className="mt-6">
          <Title>Visibility Trend (30 days)</Title>
          <Text className="mt-2">Daily visibility score showing your AI Engine presence over time</Text>
          <TrendChart 
            data={trendData?.map((item: any) => ({
              day: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              'Visibility %': Number(item.visibility).toFixed(1),
            })) || []}
          />
        </Card>

        {/* Keyword Breakdown Table */}
        <Card className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <Title>Keyword Breakdown</Title>
              <Text className="mt-2">Performance overview for each tracked keyword</Text>
            </div>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              + Add Keyword
            </button>
          </div>
          
          {keywordsData && keywordsData.length > 0 ? (
            <Table className="mt-4">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Keyword</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Trend</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {keywordsData.map((keyword) => (
                  <TableRow key={keyword.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{keyword.text}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge color="emerald" size="sm">Tracking</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-sm font-medium">Improving</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RunCheckButton keywordId={keyword.id} keywordText={keyword.text} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No keywords tracked yet. Add your first keyword to start monitoring.</p>
            </div>
          )}
        </Card>

        {/* AI-Powered Recommendations */}
        <Recommendations projectId={projectId} supabaseClient={supabase} />
      </main>
    </div>
  )
}
