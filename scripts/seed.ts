import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Admin client, bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const TEST_USER_EMAIL = 'test@example.com'
const TEST_USER_PASSWORD = 'password123'
const PROJECT_DOMAIN = 'vercel.com'
const PROJECT_NAME = 'Vercel AEO'

const KEYWORDS_TO_TRACK = [
  'next.js hosting',
  'serverless functions',
  'edge middleware',
  'best CI/CD for frontend',
  'what is vercel',
  'deploy next.js app',
  'free static site hosting',
  'jamstack hosting',
  'how to use edge functions',
  'vercel vs netlify',
]
const ENGINES = ['Gemini', 'Perplexity', 'ChatGPT']

async function seed() {
  console.log('Starting seed...')

  // 1. Create Test User
  console.log('Creating test user...')
  const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    email_confirm: true,
  })
  if (userError || !user) {
    console.error('Error creating user:', userError?.message)
    // Try to fetch user if already exists
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === TEST_USER_EMAIL);
    if (!existingUser) {
      console.error('Could not find or create user.');
      return;
    }
    console.log('Found existing user.');
    Object.assign(user || {}, existingUser); // Hacky way to assign user if it was null
  } else {
    console.log(`Test user created: ${user.email}`)
  }

  // 2. Create Project
  console.log('Creating project...')
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: PROJECT_NAME,
      domain: PROJECT_DOMAIN,
      brand_name: 'Vercel',
    })
    .select()
    .single()
  if (projectError || !project) {
    console.error('Error creating project:', projectError?.message); return;
  }
  console.log(`Project created: ${project.name}`)

  // 3. Create Keywords
  console.log('Creating keywords...')
  const keywords = await Promise.all(
    KEYWORDS_TO_TRACK.map((text) =>
      supabase.from('keywords').insert({
        project_id: project.id,
        user_id: user.id,
        text,
      }).select().single()
    )
  )

  // 4. Create Checks (The Core Simulation)
  console.log('Simulating 14 days of data...')
  const allChecks = []
  for (let i = 14; i >= 0; i--) { // Loop days
    const timestamp = new Date()
    timestamp.setDate(timestamp.getDate() - i)

    for (const { data: keyword } of keywords) { // Loop keywords
      if (!keyword) continue;
      for (const engine of ENGINES) { // Loop engines

        // --- Realistic Simulation Logic ---
        let basePresence = 0.5 // 50% chance
        // Make some keywords trend up, some down
        if (keyword.text === 'next.js hosting') {
          basePresence = 0.4 + (i / 28) // Trends UP (from 0.4 to 0.9)
        }
        if (keyword.text === 'jamstack hosting') {
          basePresence = 0.8 - (i / 28) // Trends DOWN (from 0.8 to 0.3)
        }

        const presence = Math.random() < basePresence
        let position = null
        let citations_count = 0
        const observed_urls = ['techcrunch.com', 'some-dev-blog.com', 'docs.ai.com']

        if (presence) {
          position = Math.floor(Math.random() * 3) + 1 // Pos 1-3
          citations_count = Math.floor(Math.random() * 5) + 1

          // Simulate our domain being cited
          if (Math.random() > 0.4) { // 60% chance
            observed_urls.push(PROJECT_DOMAIN)
          }
        }

        allChecks.push({
          keyword_id: keyword.id,
          project_id: project.id,
          user_id: user.id,
          engine: engine,
          presence: presence,
          position: position,
          answer_snippet: `For "${keyword.text}", AI highlights solutions...`,
          citations_count: citations_count,
          observed_urls: observed_urls,
          timestamp: timestamp.toISOString()
        });
        // --- End Simulation Logic ---
      }
    }
  }

  console.log(`Inserting ${allChecks.length} check records...`);
  const { error: checksError } = await supabase.from('checks').insert(allChecks);
  if (checksError) {
    console.error('Error inserting checks:', checksError.message);
  }

  console.log('---'.repeat(10));
  console.log('✅ Seed complete!');
  console.log('Test User Login:');
  console.log(`Email: ${TEST_USER_EMAIL}`);
  console.log(`Password: ${TEST_USER_PASSWORD}`);
  console.log('---'.repeat(10));
}

seed();