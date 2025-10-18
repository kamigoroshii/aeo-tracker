import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function checkUsers() {
  console.log('Fetching all users...\n')
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Error:', error.message)
    return
  }
  
  console.log(`Found ${users.length} user(s):\n`)
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. Email: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
    console.log(`   Created: ${user.created_at}`)
    console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}\n`)
  })
  
  // Try to test login
  console.log('Testing login with test@example.com...')
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  })
  
  if (loginError) {
    console.error('Login failed:', loginError.message)
  } else {
    console.log('✅ Login successful!')
    console.log('User:', data.user?.email)
  }
}

checkUsers()
