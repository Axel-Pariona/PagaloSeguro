import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type CreateCheckoutBody = {
  product_id?: string
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      {
        error: 'Método no permitido',
      },
      405,
    )
  }

  try {
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL')

    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      Deno.env.get('PROJECT_SERVICE_ROLE_KEY')

    const mercadoPagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    const appUrl = Deno.env.get('APP_URL')

    const webhookUrl = Deno.env.get('MERCADOPAGO_WEBHOOK_URL')

    const notificationUrl = webhookUrl
      ? `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}source_news=webhooks`
      : undefined

    if (!supabaseUrl || !serviceRoleKey || !mercadoPagoAccessToken || !appUrl) {
      return jsonResponse(
        {
          error: 'Faltan variables de entorno en la Edge Function',
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

    const body = (await req.json()) as CreateCheckoutBody
    const productId = body.product_id

    if (!productId) {
      return jsonResponse(
        {
          error: 'product_id es requerido',
        },
        400,
      )
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, description, price, currency, is_active')
      .eq('id', productId)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      return jsonResponse(
        {
          error: 'Producto no encontrado o inactivo',
        },
        404,
      )
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        product_id: product.id,
        amount: product.price,
        currency: product.currency,
        status: 'pending',
        provider: 'mercadopago',
      })
      .select('id, amount, currency, status')
      .single()

    if (orderError || !order) {
      return jsonResponse(
        {
          error: 'No se pudo crear la orden',
          detail: orderError?.message,
        },
        500,
      )
    }

    const preferencePayload = {
      items: [
        {
          id: product.id,
          title: product.name,
          description: product.description ?? '',
          quantity: 1,
          currency_id: product.currency,
          unit_price: Number(product.price),
        },
      ],
      external_reference: order.id,
      back_urls: {
        success: `${appUrl}/payment/success?order_id=${order.id}`,
        failure: `${appUrl}/payment/failure?order_id=${order.id}`,
        pending: `${appUrl}/payment/pending?order_id=${order.id}`,
      },
      auto_return: 'approved',
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      metadata: {
        order_id: order.id,
        user_id: user.id,
        product_id: product.id,
      },
    }

    const mpResponse = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mercadoPagoAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferencePayload),
      },
    )

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'error',
        })
        .eq('id', order.id)

      return jsonResponse(
        {
          error: 'No se pudo crear la preferencia de Mercado Pago',
          detail: mpData,
        },
        500,
      )
    }

    const checkoutUrl = mpData.init_point
    const sandboxCheckoutUrl = mpData.sandbox_init_point
    const preferenceId = mpData.id

    const { error: updateOrderError } = await supabaseAdmin
      .from('orders')
      .update({
        provider_preference_id: preferenceId,
        checkout_url: sandboxCheckoutUrl ?? checkoutUrl,
      })
      .eq('id', order.id)

    if (updateOrderError) {
      return jsonResponse(
        {
          error: 'Preferencia creada, pero no se pudo actualizar la orden',
          detail: updateOrderError.message,
        },
        500,
      )
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'checkout_created',
      entity_type: 'orders',
      entity_id: order.id,
      metadata: {
        provider: 'mercadopago',
        preference_id: preferenceId,
        notification_url_configured: Boolean(notificationUrl),
      },
    })

    return jsonResponse(
      {
        order_id: order.id,
        preference_id: preferenceId,
        checkout_url: sandboxCheckoutUrl ?? checkoutUrl,
      },
      200,
    )
  } catch (error) {
    return jsonResponse(
      {
        error: 'Error inesperado en create-checkout',
        detail: error instanceof Error ? error.message : String(error),
      },
      500,
    )
  }
})