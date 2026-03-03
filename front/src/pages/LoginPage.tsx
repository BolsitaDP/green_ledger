import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGreenLedger } from '../app/GreenLedgerContext'
import { useToast } from '../app/toastContext'
import { envConfig } from '../config/env'
import { getUserFacingErrorMessage } from '../lib/http'

function formatQuickLabel(email: string): string {
  const localPart = email.split('@')[0] ?? email
  return localPart
    .split('.')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticating } = useGreenLedger()
  const { showToast } = useToast()
  const [email, setEmail] = useState(envConfig.enableDevLoginShortcuts ? (envConfig.devQuickLoginEmails[0] ?? '') : '')
  const [password, setPassword] = useState(envConfig.enableDevLoginShortcuts ? envConfig.devLoginPassword : '')

  const redirectPath = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  async function submitLogin(nextEmail: string, nextPassword: string) {
    try {
      await login({ email: nextEmail, password: nextPassword })
      navigate(redirectPath, { replace: true })
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'No pudimos iniciar sesion',
        description: getUserFacingErrorMessage(error, 'No pudimos iniciar sesion.'),
      })
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitLogin(email, password)
  }

  return (
    <div className="login-page">
      <section className="login-hero">
        <span className="brand-kicker">GreenLedger</span>
        <h1>Trazabilidad regulatoria para operaciones de cannabis medicinal.</h1>
        <p>
          Accede al entorno de cumplimiento para supervisar lotes, evidencia documental y decisiones auditables en una
          sola consola.
        </p>

        <div className="login-feature-grid">
          <article>
            <strong>Lotes controlados</strong>
            <span>Seguimiento por etapa desde cultivo hasta liberacion y distribucion.</span>
          </article>
          <article>
            <strong>Evidencia protegida</strong>
            <span>Documentos con integridad SHA256, versionado y fechas de vencimiento.</span>
          </article>
          <article>
            <strong>Gobierno por rol</strong>
            <span>Acciones operativas alineadas con permisos reales y politicas del backend.</span>
          </article>
        </div>
      </section>

      <section className="login-card-shell">
        <div className="login-card-large">
          <div className="login-card-header">
            <span className="panel-label">Inicio de sesion</span>
            <strong>Accede a tu espacio de trabajo</strong>
          </div>

          <form className="login-form" onSubmit={(event) => void handleSubmit(event)}>
            <label>
              Correo corporativo
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Clave
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button type="submit" className="auth-button" disabled={isAuthenticating}>
              {isAuthenticating ? 'Ingresando...' : 'Entrar'}
            </button>
            <p className="helper-text">Usa tus credenciales autorizadas para entrar al entorno operativo.</p>
          </form>

        </div>

        {envConfig.enableDevLoginShortcuts ? (
          <div className="dev-shortcuts-card">
            <div className="login-card-header">
              <span className="panel-label">Accesos rapidos</span>
              <strong>Ingreso asistido del entorno</strong>
            </div>
            <p>Disponible solo en este entorno para acelerar pruebas internas con cuentas ya habilitadas.</p>

            <div className="quick-login-list">
              {envConfig.devQuickLoginEmails.map((quickEmail: string) => (
                <button
                  key={quickEmail}
                  type="button"
                  className="quick-login-button"
                  onClick={() => {
                    setEmail(quickEmail)
                    setPassword(envConfig.devLoginPassword)
                    void submitLogin(quickEmail, envConfig.devLoginPassword)
                  }}
                  disabled={isAuthenticating}
                >
                  <strong>{formatQuickLabel(quickEmail)}</strong>
                  <span>{quickEmail}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
