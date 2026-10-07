'use server'

import { createClient } from '@/lib/supabase/server'
export async function castVote(generationId: string, voteType: 'up' | 'down') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not logged in')
  }

  const { error } = await supabase
    .from('votes')
    .upsert(
      {
        generation_id: generationId,
        user_id: user.id,
        vote_type: voteType,
      },
      { onConflict: 'generation_id,user_id' }
    )

  if (error) throw new Error(error.message)
}