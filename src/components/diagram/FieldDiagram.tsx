import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ballOffsets, positionsAt, simulate, stepCount, type Diagram } from '../../data/diagram'
import { PlayIcon, RefreshIcon } from '../icons'
import DiagramLegend from './DiagramLegend'
import DiagramSvg from './DiagramSvg'

/** Duración de cada paso de la animación. */
const STEP_MS = 1400

/** Diagrama con animación paso a paso (sólo lectura). */
export default function FieldDiagram({ diagram, title, compact = false }: { diagram: Diagram; title?: string; compact?: boolean }) {
  const { t } = useTranslation()
  const frames = useMemo(() => simulate(diagram), [diagram])
  const steps = stepCount(diagram)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const last = useRef<number | null>(null)

  useEffect(() => {
    if (!playing) return
    let raf = 0
    const tick = (now: number) => {
      const dt = last.current === null ? 0 : now - last.current
      last.current = now
      setTime((prev) => {
        const next = prev + dt / STEP_MS
        if (next >= steps) {
          setPlaying(false)
          return steps
        }
        return next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      last.current = null
    }
  }, [playing, steps])

  const pos = positionsAt(diagram, frames, time)
  const offsets = ballOffsets(frames, time)
  const atStart = time === 0
  const currentStep = atStart ? null : Math.min(Math.floor(time), steps - 1)

  const toggle = () => {
    if (playing) return setPlaying(false)
    if (time >= steps) setTime(0)
    setPlaying(true)
  }

  return (
    <figure className="space-y-2">
      <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
        <DiagramSvg
          d={diagram}
          frames={frames}
          pos={pos}
          offsets={offsets}
          activeStep={playing || !atStart ? currentStep : null}
          showStepNumbers={steps > 1 && atStart}
          title={title}
        />
      </div>
      {steps > 0 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            {playing ? (
              <>
                <span aria-hidden className="inline-block size-3 border-x-4 border-white" /> {t('diagram.pause')}
              </>
            ) : time >= steps ? (
              <>
                <RefreshIcon width={16} height={16} /> {t('diagram.replay')}
              </>
            ) : (
              <>
                <PlayIcon width={16} height={16} /> {t('diagram.play')}
              </>
            )}
          </button>
          {!atStart && (
            <button type="button" onClick={() => { setPlaying(false); setTime(0) }} className="rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              {t('diagram.reset')}
            </button>
          )}
          {steps > 1 && (
            <span className="ml-auto text-xs font-medium text-slate-500 tabular-nums">
              {t('diagram.step', { n: currentStep === null ? 1 : currentStep + 1, total: steps })}
            </span>
          )}
        </div>
      )}
      {!compact && <DiagramLegend diagram={diagram} />}
    </figure>
  )
}
