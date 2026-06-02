import { useEffect, useState } from 'react'
import { getAuditLogs } from '../../services/adminService'

export default function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadLogs() {
      try {
        setError('')
        setLoading(true)

        const data = await getAuditLogs()
        setLogs(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  if (loading) {
    return (
      <section>
        <h1>Admin · Logs</h1>
        <p>Cargando logs...</p>
      </section>
    )
  }

  return (
    <section>
      <h1>Admin · Logs</h1>
      <p>Registro de acciones importantes del sistema.</p>

      {error && <p className="error-message">{error}</p>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Acción</th>
              <th>Entidad</th>
              <th>ID entidad</th>
              <th>Metadata</th>
              <th>Fecha</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.action}</td>
                <td>{log.entity_type ?? 'N/A'}</td>
                <td className="mono-text">{log.entity_id ?? 'N/A'}</td>
                <td>
                  <pre className="json-preview">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </td>
                <td>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}