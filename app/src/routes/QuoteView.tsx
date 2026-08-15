import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { downloadQuotePdf } from '../lib/pdf'
import { useFormatters, useI18n } from '../lib/i18n'
import type { Quote, ServiceRequest } from '../types'

export default function QuoteView() {
  const { requestId } = useParams<{ requestId: string }>()
  const { companyName } = useAuth()
  const { t } = useI18n()
  const { euro } = useFormatters()
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)

  useEffect(() => {
    if (!requestId || !supabase) return
    supabase.from('requests').select('*, clients(name)').eq('id', requestId).maybeSingle().then(({ data }) => setRequest(data as ServiceRequest))
    supabase
      .from('quotes')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setQuote(data as Quote))
  }, [requestId])

  if (!request || !quote) return <p className="muted">{t('quote.notReady')}</p>

  return (
    <div>
      <h1>
        {t('quote.title')}
        <span className="sub">{request.title}</span>
      </h1>
      <div className="card" style={{ marginTop: 20, maxWidth: 480 }}>
        <div className="cost-panel">
          <div className="cost-row">
            <span>{t('planner.personnelCost')}</span>
            <span>{euro(quote.hourly_cost)}</span>
          </div>
          <div className="cost-row">
            <span>{t('planner.premiums')}</span>
            <span>{euro(quote.premiums_cost)}</span>
          </div>
          <div className="cost-row">
            <span>{t('quote.marginPercent', { percent: quote.margin_percent })}</span>
            <span>{euro(quote.total - quote.subtotal)}</span>
          </div>
          <div className="cost-row total">
            <span>{t('quote.totalNet')}</span>
            <span>{euro(quote.total)}</span>
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => downloadQuotePdf(companyName ?? 'KORA', request, quote)}>
          {t('quote.downloadPdf')}
        </button>
      </div>
    </div>
  )
}
