import { supabase } from '../lib/supabaseClient'

export async function getActiveProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, price, currency, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
}