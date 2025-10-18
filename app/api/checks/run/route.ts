import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  
  const { keywordId } = await request.json()
  if (!keywordId) return new Response('Missing keywordId', { status: 400 })

  // 1. Verify user owns this keyword
  const { data: keyword } = await supabase
    .from('keywords')
    .select('id, project_id, user_id, text')
    .eq('id', keywordId)
    .single()
    
  if (!keyword || keyword.user_id !== user.id) {
    return new Response('Forbidden', { status: 403 })
  }

  // 2. Use ADMIN client to insert checks (bypasses RLS for inserts)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const ENGINES = ['Gemini', 'Perplexity', 'ChatGPT']
  const newChecks = []
  
  for (const engine of ENGINES) {
    // 3. Run the *same* simulation logic from seed.ts
    // In a real app, this is where you'd call the AI APIs
    const presence = Math.random() < 0.7 // 70% chance of being present on a manual check
    const newCheck = {
      keyword_id: keyword.id,
      project_id: keyword.project_id,
      user_id: user.id,
      engine: engine,
      presence: presence,
      position: presence ? Math.floor(Math.random() * 3) + 1 : null,
      answer_snippet: `Simulated check for "${keyword.text}" on ${engine}...`,
      citations_count: presence ? Math.floor(Math.random() * 5) + 1 : 0,
      observed_urls: presence ? ['vercel.com', 'othersite.com'] : [],
      timestamp: new Date().toISOString()
    }
    newChecks.push(newCheck)
  }

  const { error } = await supabaseAdmin.from('checks').insert(newChecks)
  if (error) return new Response(error.message, { status: 500 })
  
  return NextResponse.json({ success: true, checks: newChecks })
}
