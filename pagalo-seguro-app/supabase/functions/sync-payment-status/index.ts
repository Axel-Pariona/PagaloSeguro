import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type SyncPaymentBody = {
  order_id?: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function mapMercadoPagoStatus(status: string) {
  const normalized = status?.toLowerCase()

  if (normalized === 'approved') return 'approved'
  if (normalized === 'rejected') return 'rejected'
  if (normalized === 'cancelled') return 'cancelled'
  if (normalized === 'refunded') return 'refunded'
  if (normalized === 'charged_back') return 'error'
  if (normalized === 'in_process') return 'pending'
  if (normalized === 'pending') return 'pending'
  if (normalized === 'authorized') return 'pending'

  return 'error'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido' }, 405)
  }

  try {
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL')

    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      Deno.env.get('PROJECT_SERVICE_ROLE_KEY')

    const mercadoPagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')

    if (!supabaseUrl || !serviceRoleKey || !mercadoPagoAccessToken) {
      return jsonResponse(
        {
          error: 'Faltan variables de entorno requeridas',
        },
        500,
      )
    }

    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return jsonResponse(
        {
          error: 'No se envió token de autorización',
        },
        401,
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const token = authHeader.replace('Bearer ', '')

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return jsonResponse(
        {
          error: 'Usuario no autenticado',
        },
        401,
      )
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return jsonResponse(
        {
          error: 'No tienes permisos para sincronizar pagos',
        },
        403,
      )
    }

    const body = (await req.json()) as SyncPaymentBody
    const orderId = body.order_id

    if (!orderId) {
      return jsonResponse(
        {
          error: 'order_id es requerido',
        },
        400,
      )
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        status,
        provider,
        provider_payment_id,
        provider_preference_id
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return jsonResponse(
        {
          error: 'Orden no encontrada',
        },
        404,
      )
    }

    if (order.provider !== 'mercadopago') {
      return jsonResponse(
        {
          error: 'Proveedor no soportado',
        },
        400,
      )
    }

    if (!order.provider_payment_id) {
      return jsonResponse(
        {
          error:
            'La orden no tiene provider_payment_id. No se puede sincronizar directamente todavía.',
        },
        400,
      )
    }

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${order.provider_payment_id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mercadoPagoAccessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    const paymentData = await paymentResponse.json()

    if (!paymentResponse.ok) {
      return jsonResponse(
        {
          error: 'No se pudo consultar el pago en Mercado Pago',
          detail: paymentData,
        },
        500,
      )
    }

    const newStatus = mapMercadoPagoStatus(paymentData.status)

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: newStatus,
        provider_payment_id: String(paymentData.id),
      })
      .eq('id', order.id)

    if (updateError) {
      return jsonResponse(
        {
          error: 'No se pudo actualizar la orden',
          detail: updateError.message,
        },
        500,
      )
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'manual_sync_executed',
      entity_type: 'orders',
      entity_id: order.id,
      metadata: {
        provider: 'mercadopago',
        payment_id: paymentData.id,
        old_status: order.status,
        new_status: newStatus,
        payment_status: paymentData.status,
        payment_status_detail: paymentData.status_detail,
      },
    })

    return jsonResponse(
      {
        synced: true,
        order_id: order.id,
        payment_id: paymentData.id,
        status: newStatus,
      },
      200,
    )
  } catch (error) {
    return jsonResponse(
      {
        error: 'Error inesperado en sync-payment-status',
        detail: error instanceof Error ? error.message : String(error),
      },
      500,
    )
  }
})