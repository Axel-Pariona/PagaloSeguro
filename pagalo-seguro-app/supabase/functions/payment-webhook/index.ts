import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type MercadoPagoWebhookBody = {
  id?: number | string
  live_mode?: boolean
  type?: string
  date_created?: string
  user_id?: number | string
  api_version?: string
  action?: string
  topic?: string
  resource?: string
  data?: {
    id?: string
  }
}

type MercadoPagoPayment = {
  id: number
  status: string
  status_detail?: string
  external_reference?: string
  transaction_amount?: number
  currency_id?: string
  date_created?: string
  date_approved?: string
  payment_method_id?: string
  payment_type_id?: string
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

async function sha256HmacHex(secret: string, message: string) {
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message),
  )

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function parseSignatureHeader(xSignature: string | null) {
  if (!xSignature) {
    return {
      ts: null,
      v1: null,
    }
  }

  const parts = xSignature.split(',')

  let ts: string | null = null
  let v1: string | null = null

  for (const part of parts) {
    const [key, value] = part.split('=')

    if (key?.trim() === 'ts') {
      ts = value?.trim() ?? null
    }

    if (key?.trim() === 'v1') {
      v1 = value?.trim() ?? null
    }
  }

  return {
    ts,
    v1,
  }
}

function buildMercadoPagoManifest({
  dataId,
  xRequestId,
  ts,
}: {
  dataId: string | null
  xRequestId: string | null
  ts: string | null
}) {
  let manifest = ''

  if (dataId) {
    manifest += `id:${dataId.toLowerCase()};`
  }

  if (xRequestId) {
    manifest += `request-id:${xRequestId};`
  }

  if (ts) {
    manifest += `ts:${ts};`
  }

  return manifest
}

async function verifyMercadoPagoSignature({
  request,
  dataId,
  secret,
}: {
  request: Request
  dataId: string | null
  secret: string
}) {
  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')

  const { ts, v1 } = parseSignatureHeader(xSignature)

  if (!xSignature || !v1) {
    return {
      valid: false,
      reason: 'No se recibió x-signature o v1',
      debug: {
        hasXSignature: Boolean(xSignature),
        hasXRequestId: Boolean(xRequestId),
        hasDataId: Boolean(dataId),
        hasTs: Boolean(ts),
        hasV1: Boolean(v1),
      },
    }
  }

  const manifest = buildMercadoPagoManifest({
    dataId,
    xRequestId,
    ts,
  })

  if (!manifest) {
    return {
      valid: false,
      reason: 'No se pudo construir manifest para validar firma',
      debug: {
        hasXRequestId: Boolean(xRequestId),
        hasDataId: Boolean(dataId),
        hasTs: Boolean(ts),
        manifest,
      },
    }
  }

  const expectedSignature = await sha256HmacHex(secret, manifest)

  return {
    valid: expectedSignature === v1,
    reason:
      expectedSignature === v1
        ? 'Firma válida'
        : 'La firma calculada no coincide con v1',
    debug: {
      hasXRequestId: Boolean(xRequestId),
      hasDataId: Boolean(dataId),
      hasTs: Boolean(ts),
      receivedSignatureStart: v1.slice(0, 8),
      expectedSignatureStart: expectedSignature.slice(0, 8),
      manifest,
    },
  }
}

function getEventType(rawPayload: MercadoPagoWebhookBody, url: URL) {
  return (
    rawPayload.action ??
    rawPayload.type ??
    rawPayload.topic ??
    url.searchParams.get('topic') ??
    url.searchParams.get('type') ??
    'unknown'
  )
}

function getEventFormat(rawPayload: MercadoPagoWebhookBody, url: URL) {
  const bodyType = rawPayload.type
  const bodyAction = rawPayload.action
  const bodyDataId = rawPayload.data?.id

  const queryDataId = url.searchParams.get('data.id')
  const queryType = url.searchParams.get('type')

  const bodyTopic = rawPayload.topic
  const bodyResource = rawPayload.resource
  const queryTopic = url.searchParams.get('topic')
  const queryId = url.searchParams.get('id')

  const isWebhookStyle =
    Boolean(bodyType && bodyAction && bodyDataId) ||
    Boolean(queryDataId && queryType)

  const isIpnStyle =
    Boolean(bodyTopic || bodyResource || queryTopic || queryId)

  if (isWebhookStyle) return 'webhook'
  if (isIpnStyle) return 'ipn'

  return 'unknown'
}

function isMerchantOrderEvent(
  eventType: string,
  rawPayload: MercadoPagoWebhookBody,
  url: URL,
) {
  const normalizedEventType = eventType.toLowerCase()
  const topic = url.searchParams.get('topic')?.toLowerCase()
  const bodyTopic = rawPayload.topic?.toLowerCase()

  return (
    normalizedEventType.includes('merchant_order') ||
    topic === 'merchant_order' ||
    bodyTopic === 'merchant_order' ||
    Boolean(rawPayload.resource?.includes('/merchant_orders/'))
  )
}

function getMerchantOrderId(rawPayload: MercadoPagoWebhookBody, url: URL) {
  const queryId = url.searchParams.get('id')

  if (queryId) return queryId

  if (rawPayload.id) return String(rawPayload.id)

  if (rawPayload.resource) {
    const match = rawPayload.resource.match(/merchant_orders\/(\d+)/)
    if (match?.[1]) return match[1]
  }

  return null
}

function getPaymentId(rawPayload: MercadoPagoWebhookBody, url: URL) {
  return (
    url.searchParams.get('data.id') ??
    rawPayload.data?.id ??
    url.searchParams.get('payment_id') ??
    null
  )
}

function getSignatureDataId(_rawPayload: MercadoPagoWebhookBody, url: URL) {
  return url.searchParams.get('data.id')
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const mercadoPagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
  const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET')
  const skipSignatureValidation =
    Deno.env.get('SKIP_MP_SIGNATURE_VALIDATION') === 'true'

  if (!supabaseUrl || !serviceRoleKey || !mercadoPagoAccessToken) {
    return jsonResponse(
      {
        error: 'Faltan variables de entorno requeridas',
      },
      500,
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  let rawPayload: MercadoPagoWebhookBody = {}

  try {
    rawPayload = (await req.json()) as MercadoPagoWebhookBody
  } catch (error) {
    await supabaseAdmin.from('payment_events').insert({
      provider: 'mercadopago',
      event_type: 'invalid_json',
      raw_payload: {
        error: error instanceof Error ? error.message : String(error),
      },
      processed: false,
      error_message: 'No se pudo parsear el JSON del webhook',
    })

    return jsonResponse(
      {
        received: true,
      },
      200,
    )
  }

  const url = new URL(req.url)
  const eventType = getEventType(rawPayload, url)
  const eventFormat = getEventFormat(rawPayload, url)

  /*
    Mercado Pago puede enviar merchant_order además de payment.
    En esta fase lo registramos, pero no lo procesamos como pago,
    porque merchant_order_id no es igual a payment_id.
  */
  if (isMerchantOrderEvent(eventType, rawPayload, url)) {
    const merchantOrderId = getMerchantOrderId(rawPayload, url)

    const { data: eventRow, error: insertError } = await supabaseAdmin
      .from('payment_events')
      .insert({
        provider: 'mercadopago',
        event_type: 'merchant_order',
        provider_event_id: merchantOrderId,
        raw_payload: {
          ...rawPayload,
          event_format: eventFormat,
        },
        processed: false,
        error_message:
          'Evento merchant_order recibido. Registrado, pero no procesado como pago.',
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error guardando merchant_order:', insertError.message)
    }

    return jsonResponse(
      {
        received: true,
        processed: false,
        payment_event_id: eventRow?.id ?? null,
        message: 'merchant_order registrado, no procesado como payment',
      },
      200,
    )
  }

  /*
    Si llega como IPN/topic-resource, lo registramos pero no actualizamos órdenes.
    Esto evita aprobar pagos desde un formato que no estamos validando como webhook firmado.
  */
  if (eventFormat === 'ipn') {
    const ipnEventId =
      url.searchParams.get('id') ??
      rawPayload.id?.toString() ??
      rawPayload.resource ??
      null

    const { data: eventRow, error: insertError } = await supabaseAdmin
      .from('payment_events')
      .insert({
        provider: 'mercadopago',
        event_type: eventType ?? 'ipn',
        provider_event_id: ipnEventId,
        raw_payload: {
          ...rawPayload,
          event_format: eventFormat,
        },
        processed: false,
        error_message:
          'Evento IPN/topic-resource recibido. Registrado, pero no procesado como webhook firmado.',
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error guardando IPN:', insertError.message)
    }

    return jsonResponse(
      {
        received: true,
        processed: false,
        payment_event_id: eventRow?.id ?? null,
        message: 'IPN registrado, no procesado como pago firmado',
      },
      200,
    )
  }

  if (eventFormat !== 'webhook') {
    const { data: eventRow, error: insertError } = await supabaseAdmin
      .from('payment_events')
      .insert({
        provider: 'mercadopago',
        event_type: eventType ?? 'unknown',
        provider_event_id: null,
        raw_payload: {
          ...rawPayload,
          event_format: eventFormat,
        },
        processed: false,
        error_message:
          'Evento con formato desconocido. Registrado, pero no procesado.',
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error guardando evento desconocido:', insertError.message)
    }

    return jsonResponse(
      {
        received: true,
        processed: false,
        payment_event_id: eventRow?.id ?? null,
        message: 'Evento desconocido registrado, no procesado',
      },
      200,
    )
  }

  const paymentId = getPaymentId(rawPayload, url)
  const signatureDataId = getSignatureDataId(rawPayload, url)

  let paymentEventId: string | null = null

  try {
    const shouldValidateSignature =
      Boolean(webhookSecret) && !skipSignatureValidation

    if (shouldValidateSignature) {
      const signatureResult = await verifyMercadoPagoSignature({
        request: req,
        dataId: signatureDataId,
        secret: webhookSecret!,
      })

      if (!signatureResult.valid) {
        const { data: eventRow } = await supabaseAdmin
          .from('payment_events')
          .insert({
            provider: 'mercadopago',
            event_type: eventType ?? 'invalid_signature',
            provider_event_id: paymentId ? String(paymentId) : null,
            raw_payload: {
              ...rawPayload,
              event_format: eventFormat,
              signature_debug: signatureResult.debug,
            },
            processed: false,
            error_message: `Firma de webhook inválida: ${signatureResult.reason}`,
          })
          .select('id')
          .single()

        paymentEventId = eventRow?.id ?? null

        return jsonResponse(
          {
            received: true,
            processed: false,
            warning: 'Firma inválida',
            payment_event_id: paymentEventId,
          },
          200,
        )
      }
    }

    const { data: eventRow, error: insertEventError } = await supabaseAdmin
      .from('payment_events')
      .insert({
        provider: 'mercadopago',
        event_type: eventType ?? 'payment',
        provider_event_id: paymentId ? String(paymentId) : null,
        raw_payload: {
          ...rawPayload,
          event_format: eventFormat,
          signature_validation_skipped: skipSignatureValidation,
        },
        processed: false,
      })
      .select('id')
      .single()

    if (insertEventError) {
      console.error('Error guardando payment_event:', insertEventError.message)
    }

    paymentEventId = eventRow?.id ?? null

    if (!paymentId) {
      if (paymentEventId) {
        await supabaseAdmin
          .from('payment_events')
          .update({
            processed: false,
            error_message: 'No se recibió data.id del pago',
          })
          .eq('id', paymentEventId)
      }

      return jsonResponse(
        {
          received: true,
          warning: 'No se recibió paymentId',
        },
        200,
      )
    }

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mercadoPagoAccessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    const paymentData = (await paymentResponse.json()) as MercadoPagoPayment

    if (!paymentResponse.ok) {
      if (paymentEventId) {
        await supabaseAdmin
          .from('payment_events')
          .update({
            processed: false,
            error_message: `No se pudo consultar el pago en Mercado Pago: ${JSON.stringify(paymentData)}`,
          })
          .eq('id', paymentEventId)
      }

      return jsonResponse(
        {
          received: true,
          warning: 'No se pudo consultar el pago',
        },
        200,
      )
    }

    const orderId = paymentData.external_reference

    if (!orderId) {
      if (paymentEventId) {
        await supabaseAdmin
          .from('payment_events')
          .update({
            processed: false,
            error_message: 'El pago no tiene external_reference',
          })
          .eq('id', paymentEventId)
      }

      return jsonResponse(
        {
          received: true,
          warning: 'Pago sin external_reference',
        },
        200,
      )
    }

    const newStatus = mapMercadoPagoStatus(paymentData.status)

    const { data: existingOrder, error: orderLookupError } = await supabaseAdmin
      .from('orders')
      .select('id, status, provider_payment_id')
      .eq('id', orderId)
      .single()

    if (orderLookupError || !existingOrder) {
      if (paymentEventId) {
        await supabaseAdmin
          .from('payment_events')
          .update({
            processed: false,
            error_message: 'No se encontró la orden asociada al pago',
          })
          .eq('id', paymentEventId)
      }

      return jsonResponse(
        {
          received: true,
          warning: 'Orden no encontrada',
        },
        200,
      )
    }

    const isSamePayment =
      existingOrder.provider_payment_id &&
      existingOrder.provider_payment_id === String(paymentData.id)

    const isSameStatus = existingOrder.status === newStatus

    if (!isSamePayment || !isSameStatus) {
      const { error: updateOrderError } = await supabaseAdmin
        .from('orders')
        .update({
          status: newStatus,
          provider_payment_id: String(paymentData.id),
        })
        .eq('id', orderId)

      if (updateOrderError) {
        if (paymentEventId) {
          await supabaseAdmin
            .from('payment_events')
            .update({
              processed: false,
              error_message: `No se pudo actualizar la orden: ${updateOrderError.message}`,
            })
            .eq('id', paymentEventId)
        }

        return jsonResponse(
          {
            received: true,
            warning: 'No se pudo actualizar la orden',
          },
          200,
        )
      }
    }

    if (paymentEventId) {
      await supabaseAdmin
        .from('payment_events')
        .update({
          order_id: orderId,
          processed: true,
        })
        .eq('id', paymentEventId)
    }

    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
      user_id: null,
      action: `payment_${newStatus}`,
      entity_type: 'orders',
      entity_id: orderId,
      metadata: {
        provider: 'mercadopago',
        payment_id: paymentData.id,
        payment_status: paymentData.status,
        payment_status_detail: paymentData.status_detail,
        payment_method_id: paymentData.payment_method_id,
        payment_type_id: paymentData.payment_type_id,
        event_id: paymentEventId,
        signature_validation_skipped: skipSignatureValidation,
      },
    })

    if (auditError) {
      console.error('Error guardando audit_log:', auditError.message)
    }

    return jsonResponse(
      {
        received: true,
        processed: true,
        order_id: orderId,
        payment_id: paymentData.id,
        status: newStatus,
      },
      200,
    )
  } catch (error) {
    console.error('Error inesperado en payment-webhook:', error)

    if (paymentEventId) {
      await supabaseAdmin
        .from('payment_events')
        .update({
          processed: false,
          error_message: error instanceof Error ? error.message : String(error),
        })
        .eq('id', paymentEventId)
    } else {
      await supabaseAdmin.from('payment_events').insert({
        provider: 'mercadopago',
        event_type: eventType ?? 'unexpected_error',
        provider_event_id: paymentId ? String(paymentId) : null,
        raw_payload: {
          ...rawPayload,
          event_format: eventFormat,
        },
        processed: false,
        error_message: error instanceof Error ? error.message : String(error),
      })
    }

    return jsonResponse(
      {
        received: true,
        warning: 'Error interno registrado',
      },
      200,
    )
  }
})