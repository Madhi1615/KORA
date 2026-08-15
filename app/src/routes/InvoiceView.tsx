import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { generateInvoice, notifyProactive } from '../lib/api'
import { downloadInvoicePdf } from '../lib/pdf'
import { useFormatters, useI18n } from '../lib/i18n'
import type { Invoice } from '../types'

export default function InvoiceView() {
  const { requestId } = useParams<{ requestId: string }>()
  const { companyId, companyName } = useAuth()
  const { t } = useI18n()
  const { euro } = useFormatters()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    if (!requestId || !supabase) return
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setInvoice(data as Invoice)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  async function handleGenerate() {
    if (!requestId) return
    setBusy(true)
    setError(null)
    try {
      const { invoice: created } = await generateInvoice(requestId)
      setInvoice(created)
      if (companyId) {
        await notifyProactive(companyId, 'invoice_ready', { invoice_id: created.id }).catch(() => {})
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1>
        {t('invoice.title')}
        <span className="sub">{t('invoice.subtitle')}</span>
      </h1>

      {!invoice && (
        <div className="card" style={{ marginTop: 20, maxWidth: 480 }}>
          <p className="muted">{t('invoice.notCreated')}</p>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" onClick={handleGenerate} disabled={busy}>
            {busy ? t('invoice.generating') : t('invoice.generate')}
          </button>
        </div>
      )}

      {invoice && (
        <div className="card" style={{ marginTop: 20, maxWidth: 600 }}>
          <h3>
            {t('invoice.title')} {invoice.invoice_number}
          </h3>
          <table style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>{t('invoice.colGuard')}</th>
                <th>{t('invoice.colHours')}</th>
                <th>{t('invoice.colRate')}</th>
                <th>{t('invoice.colAmount')}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map((item, i) => (
                <tr key={i}>
                  <td>{item.guard_name}</td>
                  <td>{item.hours.toFixed(2)}</td>
                  <td>{euro(item.hourly_rate)}</td>
                  <td>{euro(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cost-panel" style={{ marginTop: 16 }}>
            <div className="cost-row">
              <span>{t('invoice.subtotal')}</span>
              <span>{euro(invoice.subtotal)}</span>
            </div>
            <div className="cost-row">
              <span>{t('invoice.vat', { percent: invoice.vat_percent })}</span>
              <span>{euro(invoice.vat_amount)}</span>
            </div>
            <div className="cost-row total">
              <span>{t('invoice.total')}</span>
              <span>{euro(invoice.total)}</span>
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => downloadInvoicePdf(companyName ?? 'KORA', invoice)}>
            {t('invoice.downloadPdf')}
          </button>

          <details style={{ marginTop: 16 }}>
            <summary className="muted">{t('invoice.auditRecord')}</summary>
            <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify(invoice.audit_record, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  )
}
