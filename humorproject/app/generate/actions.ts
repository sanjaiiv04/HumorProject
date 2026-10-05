'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveGeneration(imageUrl: string, prompt: string, caption: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { error } = await supabase.from('generations').insert({
    user_id: user.id,
    image_url: imageUrl,
    prompt,
    caption,
  })

  if (error) throw new Error(error.message)
}