import { Card, Title, List, ListItem, Badge } from '@tremor/react'

type Recommendation = {
  id: string
  message: string
  type: 'missing' | 'citation'
}

// This is a simple heuristic. You'd make this query much more complex.
async function getRecommendations(supabase: any, projectId: string) {
  const recommendations: Recommendation[] = []

  // Heuristic 1: Find keywords missing on any engine in the last 24h
  const { data: missing } = await supabase
    .from('checks')
    .select('keyword_id, engine, keywords(text)')
    .eq('project_id', projectId)
    .eq('presence', false)
    .gt('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(5)

  if (missing && missing.length > 0) {
    for (const item of missing) {
      recommendations.push({
        id: `miss-${item.keyword_id}-${item.engine}`,
        message: `Your brand is <strong>missing</strong> on <strong>${item.engine}</strong> for the keyword: "${item.keywords?.text || 'Unknown'}"`,
        type: 'missing',
      })
    }
  }

  // Heuristic 2: Find keywords where present but not cited
  const { data: notCited } = await supabase
    .from('checks')
    .select('keyword_id, engine, keywords(text), observed_urls')
    .eq('project_id', projectId)
    .eq('presence', true)
    .gt('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(10)

  if (notCited && notCited.length > 0) {
    // Get the project domain to check if it's cited
    const { data: project } = await supabase
      .from('projects')
      .select('domain')
      .eq('id', projectId)
      .single()

    const domain = project?.domain

    for (const item of notCited) {
      const urls = item.observed_urls || []
      const isDomainCited = urls.some((url: string) => url.includes(domain))
      
      if (!isDomainCited) {
        recommendations.push({
          id: `cite-${item.keyword_id}-${item.engine}`,
          message: `You are <strong>present</strong> on <strong>${item.engine}</strong> for "${item.keywords?.text || 'Unknown'}" but your domain <strong>was not cited</strong>.`,
          type: 'citation',
        })
      }
    }
  }

  // If no real recommendations, add a placeholder
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'placeholder-1',
      message: `Great job! Your brand has <strong>strong visibility</strong> across all AI engines. Keep monitoring for changes.`,
      type: 'citation',
    })
  }

  return recommendations
}

type RecommendationsProps = {
  projectId: string
  supabaseClient: any
}

export async function Recommendations({ projectId, supabaseClient }: RecommendationsProps) {
  const recommendations = await getRecommendations(supabaseClient, projectId)

  return (
    <Card className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 border-l-4 border-amber-400">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <Title>AI-Powered Recommendations</Title>
      </div>
      
      {recommendations.length > 0 ? (
        <List className="mt-4">
          {recommendations.map((rec) => (
            <ListItem key={rec.id} className="py-3">
              <div className="flex items-start space-x-3">
                <Badge color={rec.type === 'missing' ? 'red' : 'yellow'} size="sm" className="mt-1">
                  {rec.type === 'missing' ? '⚠️ Missing' : '💡 Optimize'}
                </Badge>
                <span 
                  className="text-sm text-gray-700 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: rec.message }} 
                />
              </div>
            </ListItem>
          ))}
        </List>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          No recommendations at this time. Keep checking back!
        </p>
      )}
    </Card>
  )
}
