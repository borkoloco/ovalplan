import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { btnPrimary, btnSecondary } from '../components/ui'
import { useAuth } from '../lib/auth'

/** Login con link mágico y, ya adentro, datos de la cuenta. */
export default function Account() {
  const { t } = useTranslation()
  const { user, isAdmin, ready, enabled, signIn, signOut } = useAuth()
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  if (!ready) return null

  if (!enabled) {
    return <p className="mx-auto max-w-md text-center text-slate-600">{t('auth.disabled')}</p>
  }

  if (user) {
    return (
      <div className="mx-auto max-w-md space-y-5">
        <h1 className="text-2xl font-bold tracking-tight">{t('nav.account')}</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">{t('auth.signedInAs')}</div>
          <div className="font-medium break-all">{user.email}</div>
          {isAdmin && (
            <span className="mt-2 inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
              {t('auth.admin')}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Link to="/library?mine=1" className={btnSecondary}>{t('auth.myExercises')}</Link>
          {isAdmin && <Link to="/review" className={btnSecondary}>{t('auth.review')}</Link>}
          <button type="button" onClick={signOut} className={`${btnSecondary} !text-red-600`}>
            {t('auth.signOut')}
          </button>
        </div>
        <p className="text-xs text-slate-500">{t('auth.privacy')}</p>
      </div>
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    const err = await signIn(email.trim(), next)
    if (err) {
      setError(err)
      setStatus('idle')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">{t('auth.title')}</h1>
      {params.get('next') && <p className="text-slate-600">{t('auth.required')}</p>}
      {status === 'sent' ? (
        <p role="status" className="rounded-2xl bg-emerald-50 p-4 text-emerald-900">
          {t('auth.sent', { email: email.trim() })}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">{t('auth.intro')}</p>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t('auth.email')}</span>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={status === 'sending'} className={`${btnPrimary} w-full disabled:opacity-60`}>
            {status === 'sending' ? t('auth.sending') : t('auth.send')}
          </button>
        </form>
      )}
      <p className="text-xs text-slate-500">{t('auth.privacy')}</p>
    </div>
  )
}
