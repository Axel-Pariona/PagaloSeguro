import { supabase } from '../lib/supabaseClient'

export async function getAdminOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      user_id,
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
        description
      ),
      profiles (
        id,
        full_name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getPaymentEvents() {
  const { data, error } = await supabase
    .from('payment_events')
    .select(`
      id,
      order_id,
      provider,
      event_type,
      provider_event_id,
      processed,
      error_message,
      raw_payload,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getAuditLogs() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      user_id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function syncPaymentStatus(orderId) {
  const { data, error } = await supabase.functions.invoke(
    'sync-payment-status',
    {
      body: {
        order_id: orderId,
      },
    },
  )

  if (error) {
    let detail = error.message

    try {
      if (error.context) {
        const errorBody = await error.context.json()
        detail = errorBody.detail
          ? `${errorBody.error}: ${JSON.stringify(errorBody.detail)}`
          : errorBody.error
      }
    } catch {
      detail = error.message
    }

    throw new Error(detail)
  }

  return data
}

export async function getAdminOrderById(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      user_id,
      product_id,
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
      ),
      profiles (
        id,
        full_name
      )
    `)
    .eq('id', orderId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}