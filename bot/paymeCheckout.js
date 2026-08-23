export function buildPaymeCheckoutUrl({ merchantId, orderId, amountUzs, returnUrl }) {
  const amountTiyin = Math.round(Number(amountUzs) * 100)
  const params = [
    `m=${merchantId}`,
    `ac.order_id=${orderId}`,
    `a=${amountTiyin}`,
  ]
  if (returnUrl) params.push(`c=${returnUrl}`)
  const payload = Buffer.from(params.join(';'), 'utf8').toString('base64')
  const base = process.env.PAYME_CHECKOUT_URL || 'https://checkout.paycom.uz'
  return `${base}/${payload}`
}

export function isPaymeDemo() {
  return process.env.PAYME_DEMO === '1' || !process.env.PAYME_MERCHANT_ID
}
