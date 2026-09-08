import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { approveAccountRequest, getAdminRecords, updateAdminRecord } from '../services/adminRecordService.js'

const statuses = ['all', 'pending', 'approved', 'rejected']

export function VerificationRequestsPage() {
  const [requests, setRequests] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')

  const loadRequests = async () => {
    setLoading(true)
    setError('')
    try {
      setRequests(await getAdminRecords('accountRequests'))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRequests() }, [])

  const visibleRequests = useMemo(
    () => requests.filter((request) => statusFilter === 'all' || (request.status || 'pending') === statusFilter),
    [requests, statusFilter],
  )

  const updateStatus = async (request, status) => {
    setSavingId(request.id)
    setError('')
    try {
      if (status === 'approved') await approveAccountRequest(request)
      else await updateAdminRecord('accountRequests', request.id, { status, reviewedAt: new Date().toISOString() })
      setRequests((records) => records.map((record) => record.id === request.id ? { ...record, status } : record))
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div><div className="page-kicker">User access</div><h2>Verification requests</h2><p className="page-description">Review account requests from students, alumni, and staff before granting access.</p></div>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <Card className="panel-card">
        <div className="data-toolbar-row">
          <div className="filter-inline"><span className="mini-label">Show</span><select className="data-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{status === 'all' ? 'All requests' : `${status[0].toUpperCase()}${status.slice(1)}`}</option>)}</select></div>
          <span className="toolbar-count">{visibleRequests.length} request{visibleRequests.length === 1 ? '' : 's'}</span>
        </div>
      </Card>
      <Card className="panel-card">
        {loading ? <div className="empty-state">Loading verification requests...</div> : visibleRequests.length ? (
          <div className="table-wrapper"><table className="data-table"><thead><tr><th>Requester</th><th>Role</th><th>Linked record</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visibleRequests.map((request) => {
            const status = request.status || 'pending'
            return <tr key={request.id}><td><strong>{request.fullName || request.name || 'Unnamed requester'}</strong><small className="table-subtext">{request.email || 'No email provided'}</small></td><td>{request.role || request.accountType || 'User'}</td><td>{request.linkedRecordName || request.linkedRecordId || 'Not linked'}</td><td><Badge status={status}>{status}</Badge></td><td><div className="inline-actions">{status === 'pending' && <><Button size="sm" disabled={savingId === request.id} onClick={() => updateStatus(request, 'approved')}>Approve</Button><Button size="sm" variant="secondary" disabled={savingId === request.id} onClick={() => updateStatus(request, 'rejected')}>Reject</Button></>}</div></td></tr>
          })}</tbody></table></div>
        ) : <div className="empty-state"><div className="empty-state-title">No {statusFilter === 'all' ? '' : statusFilter} requests</div><div>New registration requests will appear here for administrator review.</div></div>}
      </Card>
    </div>
  )
}
