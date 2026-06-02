import { supabase } from '../lib/supabaseClient'

export async function createCheckout(productId) {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      product_id: productId,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data?.checkout_url) {
    throw new Error('No se recibió checkout_url desde el backend')
  }

  return data
}