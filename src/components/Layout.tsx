import type { ComponentType, SVGProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router-dom'
import LanguageToggle from './LanguageToggle'
import { useAuth } from '../lib/auth'
import { useExercises } from '../lib/exercises'
import { BookIcon, HomeIcon, Logo, PlusIcon, UserIcon } from './icons'

type NavItem = { to: string; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; end?: boolean }

export default function Layout() {
  const { t } = useTranslation()
  const { user, enabled, isAdmin } = useAuth()
  const { all } = useExercises()
  const pendingCount = isAdmin ? all.filter((e) => e.status === 'pending').length : 0
  const items: NavItem[] = [
    { to: '/', label: t('nav.home'), Icon: HomeIcon, end: true },
    { to: '/plan', label: t('nav.newSession'), Icon: PlusIcon },
    { to: '/library', label: t('nav.library'), Icon: BookIcon },
  ]

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
            <Logo />
            OvalPlan
          </Link>

          {/* Navegación de escritorio */}
          <nav className="ml-4 hidden gap-1 md:flex">
            {items.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            {pendingCount > 0 && (
              <Link
                to="/review"
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200"
              >
                <span className="grid size-5 place-items-center rounded-full bg-amber-500 text-[11px] text-white">{pendingCount}</span>
                <span className="hidden sm:inline">{t('review.toReview')}</span>
              </Link>
            )}
            {enabled && (
              <NavLink
                to="/account"
                aria-label={t('nav.account')}
                title={user?.email ?? t('auth.signIn')}
                className={({ isActive }) =>
                  `grid size-9 place-items-center rounded-full transition ${
                    user ? 'bg-emerald-700 text-white' : isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {user?.email ? (
                  <span className="text-sm font-bold uppercase">{user.email[0]}</span>
                ) : (
                  <UserIcon />
                )}
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-6 md:pt-8 md:pb-12">
        <Outlet />
      </main>

      {/* Navegación inferior en celular */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-3">
          {items.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  isActive ? 'text-emerald-700' : 'text-slate-500'
                }`
              }
            >
              <Icon width={22} height={22} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
