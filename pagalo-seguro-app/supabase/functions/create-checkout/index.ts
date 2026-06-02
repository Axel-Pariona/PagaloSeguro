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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Método no permitido',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  try {
    const supabaseUrl = Deno.env.get('PROJECT_URL')
    const serviceRoleKey = Deno.env.get('PROJECT_SERVICE_ROLE_KEY')
    const mercadoPagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    const appUrl = Deno.env.get('APP_URL')

    const webhookUrl = Deno.env.get('MERCADOPAGO_WEBHOOK_URL')

    if (!supabaseUrl || !serviceRoleKey || !mercadoPagoAccessToken || !appUrl) {
      return new Response(
        JSON.stringify({
          error: 'Faltan variables de entorno en la Edge Function',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'No se envió token de autorización',
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const token = authHeader.replace('Bearer ', '')

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Usuario no autenticado',
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const body = (await req.json()) as CreateCheckoutBody
    const productId = body.product_id

    if (!productId) {
      return new Response(
        JSON.stringify({
          error: 'product_id es requerido',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, description, price, currency, is_active')
      .eq('id', productId)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      return new Response(
        JSON.stringify({
          error: 'Producto no encontrado o inactivo',
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
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
      return new Response(
        JSON.stringify({
          error: 'No se pudo crear la orden',
          detail: orderError?.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
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
      notification_url: webhookUrl,
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

      return new Response(
        JSON.stringify({
          error: 'No se pudo crear la preferencia de Mercado Pago',
          detail: mpData,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
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
      return new Response(
        JSON.stringify({
          error: 'Preferencia creada, pero no se pudo actualizar la orden',
          detail: updateOrderError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
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
      },
    })

    return new Response(
      JSON.stringify({
        order_id: order.id,
        preference_id: preferenceId,
        checkout_url: sandboxCheckoutUrl ?? checkoutUrl,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Error inesperado en create-checkout',
        detail: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})