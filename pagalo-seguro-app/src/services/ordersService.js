import { supabase } from '../lib/supabaseClient'

export async function createPendingOrder({ userId, product }) {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      product_id: product.id,
      amount: product.price,
      currency: product.currency,
      status: 'pending',
      provider: 'mercadopago',
    })
    .select(`
      id,
      amount,
      currency,
      status,
      provider,
      created_at,
      products (
        id,
        name,
        description
      )
    `)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getUserOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      amount,
      currency,
      status,
      provider,
      created_at,
      updated_at,
      products (
        id,
        name,
        description
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getOrderById({ orderId, userId }) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      amount,
      currency,
      status,
      provider,
      provider_preference_id,
      provider_payment_id,
      checkout_url,
      created_at,
      updated_at,
      products (
        id,
        name,
        description,
        price,
        currency
      )
    `)
    .eq('id', orderId)
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}