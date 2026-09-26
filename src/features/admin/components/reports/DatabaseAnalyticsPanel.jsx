import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CircleDollarSign,
  Database,
  ExternalLink,
  Gauge,
  RefreshCw,
  ShieldCheck,
  Wifi,
} from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'
import { Select } from '../ui/Select.jsx'
import {
  infrastructureConsoleLinks,
  loadInfrastructureAnalytics,
} from '../../services/infrastructureAnalyticsService.js'
import { loadLocalAdminPreferences } from '../../services/accountSettingsService.js'

const compactNumber = new Intl.NumberFormat('en-PH', { notation: 'compact', maximumFractionDigits: 1 })
const wholeNumber = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 })

const formatCount = (value) => compactNumber.format(Number(value) || 0)
const formatCurrency = (value, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number(value) || 0)
  } catch {
    return `${currency || 'USD'} ${(Number(value) || 0).toFixed(2)}`
  }
}

const friendlyAnalyticsError = (error) => {
  const code = String(error?.code || '')
  if (code.includes('not-found') || code.includes('unimplemented')) {
    return 'The secure analytics function has not been deployed yet. Complete the setup below, then refresh.'
  }
  if (code.includes('permission-denied')) return 'Your account is not allowed to view infrastructure and billing data.'
  if (code.includes('unauthenticated')) return 'Your session expired. Sign in again to view infrastructure analytics.'
  return error?.message || 'Infrastructure analytics are temporarily unavailable.'
}

function InfrastructureMetric({ icon: Icon, label, value, detail, tone = '' }) {
  return <div className={`infrastructure-metric ${tone}`}>
    <span><Icon size={18} /></span>
    <div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div>
  </div>
}

function UsageChart({ records = [] }) {
  const visibleRecords = records.slice(-30)
  const maximum = Math.max(...visibleRecords.map((record) => Number(record.reads || 0) + Number(record.writes || 0) + Number(record.deletes || 0)), 1)

  if (!visibleRecords.length) return <div className="infrastructure-empty-chart">Usage history will appear after Cloud Monitoring returns its first samples.</div>

  return <>
    <div className="infrastructure-chart" aria-label="Daily Firestore operations chart">
      {visibleRecords.map((record) => {
        const reads = Number(record.reads) || 0
        const writes = Number(record.writes) || 0
        const deletes = Number(record.deletes) || 0
        const total = reads + writes + deletes
        return <div className="infrastructure-chart-column" key={record.date} title={`${record.date}: ${wholeNumber.format(total)} operations`}>
          <div className="infrastructure-chart-stack" style={{ height: `${Math.max((total / maximum) * 100, total ? 4 : 0)}%` }}>
            <span className="is-read" style={{ flex: reads }} />
            <span className="is-write" style={{ flex: writes }} />
            <span className="is-delete" style={{ flex: deletes }} />
          </div>
          <small>{visibleRecords.length <= 14 ? record.date.slice(5) : ''}</small>
        </div>
      })}
    </div>
    <div className="infrastructure-chart-legend"><span className="is-read">Reads</span><span className="is-write">Writes</span><span className="is-delete">Deletes</span></div>
  </>
}

function BillingBreakdown({ billing }) {
  if (billing.status !== 'ready') return <div className="infrastructure-setup">
    <CircleDollarSign size={24} />
    <div><strong>Connect billing export</strong><p>{billing.message || 'Enable the Google Cloud Billing export to BigQuery to display real cost history here.'}</p></div>
    <ol><li>Enable Standard usage cost export in Google Cloud Billing.</li><li>Set <code>BILLING_EXPORT_TABLE</code> for the Firebase Function.</li><li>Grant its service account BigQuery Job User and dataset Data Viewer access.</li></ol>
  </div>

  const largest = Math.max(...billing.byService.map((record) => Math.abs(Number(record.cost) || 0)), 1)
  return <div className="billing-breakdown">
    <div className="billing-summary">
      <div><span>This month</span><strong>{formatCurrency(billing.monthCost, billing.currency)}</strong></div>
      <div><span>Projected month</span><strong>{formatCurrency(billing.projectedMonthCost, billing.currency)}</strong></div>
      <div><span>Monthly budget</span><strong>{billing.monthlyBudget ? formatCurrency(billing.monthlyBudget, billing.currency) : 'Not set'}</strong></div>
    </div>
    {billing.monthlyBudget > 0 && <div className="billing-budget"><div><span>Budget used</span><strong>{Math.round(billing.budgetUsedPercent)}%</strong></div><div><span style={{ width: `${Math.min(billing.budgetUsedPercent, 100)}%` }} /></div></div>}
    <div className="billing-services">
      {billing.byService.length ? billing.byService.slice(0, 6).map((record) => <div key={record.service}>
        <div><span>{record.service}</span><strong>{formatCurrency(record.cost, billing.currency)}</strong></div>
        <div><span style={{ width: `${Math.max((Math.abs(record.cost) / largest) * 100, 2)}%` }} /></div>
      </div>) : <p className="panel-caption">No billed services were returned for this period.</p>}
    </div>
  </div>
}

export function DatabaseAnalyticsPanel() {
  const [periodDays, setPeriodDays] = useState(() => loadLocalAdminPreferences().defaultReportPeriod)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setAnalytics(await loadInfrastructureAnalytics(periodDays))
    } catch (loadError) {
      setAnalytics(null)
      setError(friendlyAnalyticsError(loadError))
    } finally {
      setLoading(false)
    }
  }, [periodDays])

  useEffect(() => { refresh() }, [refresh])

  const projectId = analytics?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || ''
  const links = useMemo(() => infrastructureConsoleLinks(projectId), [projectId])
  const database = analytics?.database || { status: 'unavailable', reads: 0, writes: 0, deletes: 0, activeConnections: 0, snapshotListeners: 0, dailyUsage: [] }
  const billing = analytics?.billing || { status: 'not_configured', byService: [] }

  return <section className="infrastructure-section" aria-labelledby="infrastructure-heading">
    <div className="infrastructure-heading">
      <div><span className="section-eyebrow"><Database size={15} /> Firebase infrastructure</span><h3 id="infrastructure-heading">Database usage &amp; billing</h3><p>Secure Cloud Monitoring and billing data visible only to administrators.</p></div>
      <div className="infrastructure-controls">
        <label><span>Period</span><Select value={periodDays} onChange={(event) => setPeriodDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></Select></label>
        <Button variant="secondary" onClick={refresh} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh</Button>
      </div>
    </div>

    {error && <Card className="infrastructure-notice is-warning"><Gauge size={24} /><div><strong>Analytics connection required</strong><p>{error}</p><span>The regular GradBook report above remains live and unaffected.</span></div></Card>}

    <div className="infrastructure-metric-grid" aria-busy={loading}>
      <InfrastructureMetric icon={Activity} label="Document reads" value={loading ? '—' : formatCount(database.reads)} detail={`${periodDays}-day total`} />
      <InfrastructureMetric icon={Database} label="Document writes" value={loading ? '—' : formatCount(database.writes)} detail={`${periodDays}-day total`} />
      <InfrastructureMetric icon={Database} label="Document deletes" value={loading ? '—' : formatCount(database.deletes)} detail={`${periodDays}-day total`} tone="is-coral" />
      <InfrastructureMetric icon={Wifi} label="Active connections" value={loading ? '—' : formatCount(database.activeConnections)} detail={`${formatCount(database.snapshotListeners)} snapshot listeners`} tone="is-blue" />
      <InfrastructureMetric icon={CircleDollarSign} label="Current month" value={loading || billing.status !== 'ready' ? '—' : formatCurrency(billing.monthCost, billing.currency)} detail={billing.status === 'ready' ? 'Net cost after credits' : 'Connect billing export'} tone="is-gold" />
    </div>

    <div className="infrastructure-detail-grid">
      <Card className="panel-card infrastructure-panel">
        <div className="section-title-row"><div><h4>Firestore activity</h4><span className="panel-caption">Up to 30 daily samples from Cloud Monitoring</span></div><Activity size={19} /></div>
        {loading ? <div className="infrastructure-loading">Loading Cloud Monitoring metrics…</div> : database.status === 'ready' ? <UsageChart records={database.dailyUsage} /> : <div className="infrastructure-setup compact"><Gauge size={22} /><div><strong>Monitoring is not connected</strong><p>{database.message || 'Deploy the secure function and grant its service account Monitoring Viewer access.'}</p></div></div>}
      </Card>
      <Card className="panel-card infrastructure-panel">
        <div className="section-title-row"><div><h4>Cloud cost</h4><span className="panel-caption">BigQuery billing export · estimates may be delayed</span></div><CircleDollarSign size={19} /></div>
        {loading ? <div className="infrastructure-loading">Loading billing totals…</div> : <BillingBreakdown billing={billing} />}
      </Card>
    </div>

    <div className="infrastructure-footer">
      <span><ShieldCheck size={15} /> Billing credentials stay in the Firebase Function, never in the browser.</span>
      {projectId && <nav aria-label="Google Cloud report links"><a href={links.firestore} target="_blank" rel="noreferrer">Firestore usage <ExternalLink size={13} /></a><a href={links.monitoring} target="_blank" rel="noreferrer">Cloud Monitoring <ExternalLink size={13} /></a><a href={links.billing} target="_blank" rel="noreferrer">Cloud Billing <ExternalLink size={13} /></a></nav>}
    </div>
  </section>
}
