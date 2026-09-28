import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Database,
  ExternalLink,
  Gauge,
  HardDrive,
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

const wholeNumber = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 })
const formatCount = (value) => wholeNumber.format(Math.max(Number(value) || 0, 0))
const formatBytes = (value) => {
  const bytes = Math.max(Number(value) || 0, 0)
  if (bytes < 1024) return `${formatCount(bytes)} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)) - 1, units.length - 1)
  return `${(bytes / (1024 ** (unitIndex + 1))).toLocaleString('en-PH', { maximumFractionDigits: 2 })} ${units[unitIndex]}`
}

const friendlyAnalyticsError = (error) => {
  const code = String(error?.code || '')
  if (code.includes('not-found') || code.includes('unimplemented')) {
    return 'The secure usage function has not been deployed yet. Deploy it, then refresh.'
  }
  if (code.includes('permission-denied')) return 'Your account is not allowed to view database usage data.'
  if (code.includes('unauthenticated')) return 'Your session expired. Sign in again to view database usage.'
  return error?.message || 'Database usage is temporarily unavailable.'
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

  if (!visibleRecords.length) return <div className="infrastructure-empty-chart">No operation samples were returned for this period.</div>

  return <>
    <div className="infrastructure-chart" aria-label="Daily Firestore operations chart">
      {visibleRecords.map((record) => {
        const reads = Number(record.reads) || 0
        const writes = Number(record.writes) || 0
        const deletes = Number(record.deletes) || 0
        const total = reads + writes + deletes
        return <div className="infrastructure-chart-column" key={record.date} title={`${record.date}: ${wholeNumber.format(total)} observed operations`}>
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
  const database = analytics?.database || { status: 'unavailable', reads: 0, writes: 0, deletes: 0, storageBytes: 0, activeConnections: 0, snapshotListeners: 0, dailyUsage: [] }
  const generatedAt = analytics?.generatedAt ? new Date(analytics.generatedAt) : null

  return <section className="infrastructure-section" aria-labelledby="infrastructure-heading">
    <div className="infrastructure-heading">
      <div><span className="section-eyebrow"><Database size={15} /> Firebase infrastructure</span><h3 id="infrastructure-heading">Database usage</h3><p>Observed Firestore activity from Google Cloud Monitoring. Only measured usage is shown.</p></div>
      <div className="infrastructure-controls">
        <label><span>Period</span><Select value={periodDays} onChange={(event) => setPeriodDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></Select></label>
        <Button variant="secondary" onClick={refresh} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh</Button>
      </div>
    </div>

    {error && <Card className="infrastructure-notice is-warning"><Gauge size={24} /><div><strong>Usage connection required</strong><p>{error}</p><span>The regular GradBook report above remains live and unaffected.</span></div></Card>}

    <div className="infrastructure-metric-grid" aria-busy={loading}>
      <InfrastructureMetric icon={Activity} label="Document reads" value={loading ? '—' : formatCount(database.reads)} detail={`${periodDays}-day observed total`} />
      <InfrastructureMetric icon={Database} label="Document writes" value={loading ? '—' : formatCount(database.writes)} detail={`${periodDays}-day observed total`} />
      <InfrastructureMetric icon={Database} label="Document deletes" value={loading ? '—' : formatCount(database.deletes)} detail={`${periodDays}-day observed total`} tone="is-coral" />
      <InfrastructureMetric icon={HardDrive} label="Database storage" value={loading ? '—' : formatBytes(database.storageBytes)} detail={loading ? 'Latest reported sample' : `${formatCount(database.storageBytes)} bytes reported`} tone="is-gold" />
      <InfrastructureMetric icon={Wifi} label="Active connections" value={loading ? '—' : formatCount(database.activeConnections)} detail={`${formatCount(database.snapshotListeners)} snapshot listeners`} tone="is-blue" />
    </div>

    <div className="infrastructure-detail-grid is-usage-only">
      <Card className="panel-card infrastructure-panel">
        <div className="section-title-row"><div><h4>Firestore activity</h4><span className="panel-caption">Successful document operations reported by Cloud Monitoring</span></div><Activity size={19} /></div>
        {loading ? <div className="infrastructure-loading">Loading Cloud Monitoring metrics…</div> : database.status === 'ready' ? <UsageChart records={database.dailyUsage} /> : <div className="infrastructure-setup compact"><Gauge size={22} /><div><strong>Monitoring is not connected</strong><p>{database.message || 'Deploy the secure function and grant its service account Monitoring Viewer access.'}</p></div></div>}
      </Card>
    </div>

    <div className="infrastructure-footer">
      <span><ShieldCheck size={15} /> Displayed integers come directly from sampled Cloud Monitoring data{generatedAt && ` · refreshed ${generatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}.</span>
      {projectId && <nav aria-label="Google Cloud usage links"><a href={links.firestore} target="_blank" rel="noreferrer">Firestore usage <ExternalLink size={13} /></a><a href={links.monitoring} target="_blank" rel="noreferrer">Cloud Monitoring <ExternalLink size={13} /></a></nav>}
    </div>
  </section>
}
