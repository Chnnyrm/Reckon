import React, { useState, useEffect, useRef } from 'react'
import {
  CaretRight,
  MagnifyingGlass,
  ArrowUp,
  ArrowDown,
  ArrowClockwise,
  WarningCircle,
  CheckCircle,
  ArrowLeft
} from '@phosphor-icons/react'
import { Logo } from './components/Logo'

export interface Market {

function Sparkline({ isUp }: { isUp: boolean | null }) {
  if (isUp === null) {
    return <div className="w-12 h-3 border-b border-[#313131]" />
  }
  const color = isUp ? '#4ADE80' : '#F87171'
  return (
    <svg width="48" height="14" viewBox="0 0 48 14" className="shrink-0 overflow-visible" aria-hidden="true">
      {isUp ? (
        <path
          d="M 2 11 L 14 9 L 24 10 L 34 5 L 46 2"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M 2 3 L 14 5 L 24 4 L 34 9 L 46 12"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function RevealItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.05 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
        transitionProperty: 'opacity, transform',
        transitionDuration: '600ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      {children}
    </div>
  )
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<'markets' | 'detail' | 'record'>('markets')
  const [marketTab, setMarketTab] = useState<'all' | 'sports'>('all')
  const [markets, setMarkets] = useState<Market[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [selectedSide, setSelectedSide] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false)
  const [marketsError, setMarketsError] = useState<string | null>(null)

  const [isLoadingPositions, setIsLoadingPositions] = useState(false)
  const [positionFormError, setPositionFormError] = useState<string | null>(null)
  const [positionSuccessMsg, setPositionSuccessMsg] = useState<string | null>(null)
  const [isSubmittingPosition, setIsSubmittingPosition] = useState(false)

  const fetchMarkets = async (tab: 'all' | 'sports') => {
    setIsLoadingMarkets(true)
    setMarketsError(null)
    try {
      const res = await fetch(`/api/markets?tab=${tab}`)
      if (!res.ok) {
        throw new Error('Could not load markets. The market data service did not respond.')
      }
      const data = await res.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setMarkets(data.markets || [])
    } catch {
      setMarketsError('Could not load markets. The market data service did not respond.')
    } finally {
      setIsLoadingMarkets(false)
    }
  }

  const fetchPositions = async () => {
    setIsLoadingPositions(true)
    try {
      const res = await fetch('/api/positions')
      if (res.ok) {
        const data = await res.json()
        setPositions(data.positions || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingPositions(false)
    }
  }

  useEffect(() => {
    fetchMarkets(marketTab)
  }, [marketTab])

  useEffect(() => {
    fetchPositions()
  }, [])

  const handleOpenMarket = (m: Market) => {
    setSelectedMarket(m)
    setSelectedSide(m.outcomes[0] || 'Yes')
    setPositionFormError(null)
    setPositionSuccessMsg(null)
    setActiveScreen('detail')
  }

  const handleCommitPosition = async () => {
    if (!selectedMarket) return
    setPositionFormError(null)
    setPositionSuccessMsg(null)

    const sideIdx = selectedMarket.outcomes.indexOf(selectedSide)
    const currentOutcomePrice = selectedMarket.outcomePrices[sideIdx]

    if (currentOutcomePrice === null || currentOutcomePrice === undefined) {
      setPositionFormError('That position could not be saved. The price for this outcome is currently unavailable. Try another outcome.')
      return
    }

    setIsSubmittingPosition(true)
    try {
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: selectedMarket.conditionId,
          question: selectedMarket.question,
          side: selectedSide,
          entryPrice: currentOutcomePrice,
          source: 'LIVE'
        })
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'That position could not be saved. The record file is not writable. Try again.')
      }

      setPositionSuccessMsg(`Position logged on ${selectedSide} at ${(currentOutcomePrice * 100).toFixed(1)}¢ on the public record.`)
      fetchPositions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'That position could not be saved. The record file is not writable. Try again.'
      setPositionFormError(message)
    } finally {
      setIsSubmittingPosition(false)
    }
  }

  // Filtered markets
  const filteredMarkets = markets.filter((m) =>
    m.question.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Graded positions & aggregates
  const validPositions = positions.filter((p) => p.currentPrice !== null && p.changePct !== null)
  const upPositionsCount = validPositions.filter((p) => (p.changePct ?? 0) > 0).length
  const downPositionsCount = validPositions.filter((p) => (p.changePct ?? 0) < 0).length
  const totalCount = positions.length

  return (
    <div className="min-h-screen bg-primary text-primary flex flex-col font-sans selection:bg-[#FF7A1A]/20">
      {/* Top Header */}
      <header className="border-b border-primary bg-primary sticky top-0 z-30">
        <div className="max-w-[1040px] mx-auto px-xl py-lg flex items-center justify-between">
          <div className="flex items-center gap-3xl">
            <button
              onClick={() => setActiveScreen('markets')}
              className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded-md transition-opacity duration-300 hover:opacity-90"
            >
              <Logo size={32} />
            </button>
            <span className="hidden sm:inline-block caption-2 text-secondary border-l border-primary pl-xl">
              Every call, on the record.
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-xs bg-tertiary p-xxs rounded-lg border border-primary">
            <button
              onClick={() => setActiveScreen('markets')}
              className={`button-sm px-lg py-sm rounded-md transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                activeScreen === 'markets' || activeScreen === 'detail'
                  ? 'bg-primary text-primary border border-primary shadow-xs'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Markets
            </button>
            <button
              onClick={() => setActiveScreen('record')}
              className={`button-sm px-lg py-sm rounded-md transition-all duration-300 active:scale-[0.98] flex items-center gap-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                activeScreen === 'record'
                  ? 'bg-primary text-primary border border-primary shadow-xs'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <span>Record</span>
              <span className="caption-3 inline-flex items-center rounded-full border border-utility-brand-200 bg-utility-brand-50 px-sm py-none text-utility-brand-700">
                {totalCount}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1040px] w-full mx-auto px-xl py-3xl sm:py-5xl">
        {/* SCREEN 1: MARKETS */}
        {activeScreen === 'markets' && (
          <div className="space-y-3xl">
            {/* Hero */}
            <div className="max-w-[680px] space-y-md">
              <h1 className="heading-4 text-primary">
                Real prediction markets on the public record
              </h1>
              <p className="body-3 text-secondary">
                Track live contracts, inspect pricing across verified outcomes, and commit accountability calls without resolution bias.
              </p>
            </div>

            {/* Filter and Search Bar: Tabs recipe + Input recipe */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-xl pt-xs">
              <div className="flex items-center gap-lg border-b border-secondary">
                <button
                  onClick={() => setMarketTab('all')}
                  className={`border-b-2 px-md py-sm text-sm font-semibold transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                    marketTab === 'all'
                      ? 'border-brand text-brand-primary'
                      : 'border-transparent text-tertiary hover:text-secondary'
                  }`}
                >
                  All markets
                </button>
                <button
                  onClick={() => setMarketTab('sports')}
                  className={`border-b-2 px-md py-sm text-sm font-semibold transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                    marketTab === 'sports'
                      ? 'border-brand text-brand-primary'
                      : 'border-transparent text-tertiary hover:text-secondary'
                  }`}
                >
                  Sports markets
                </button>
              </div>

              {/* Input Recipe */}
              <div className="relative min-w-[260px]">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-lg top-1/2 -translate-y-1/2 text-fg-quaternary"
                />
                <input
                  type="text"
                  placeholder="Filter markets by question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md bg-primary px-lg py-sm pl-3xl text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                />
              </div>
            </div>

            {/* Alert Recipe for Fetch Error */}
            {marketsError && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-lg rounded-xl bg-utility-error-50 p-xl border border-utility-error-200">
                <div className="flex items-start gap-md">
                  <WarningCircle size={20} className="mt-xxs shrink-0 text-utility-error-600" />
                  <div>
                    <p className="text-sm font-semibold text-utility-error-600">Could not load markets</p>
                    <p className="mt-xxs text-xs text-tertiary">The market data service did not respond.</p>
                  </div>
                </div>
                <button
                  onClick={() => fetchMarkets(marketTab)}
                  className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm text-sm font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring active:scale-[0.98] self-start sm:self-auto"
                >
                  <ArrowClockwise size={16} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Market List: Card Recipe Container with Divided Rows */}
            <section className="rounded-xl border border-secondary bg-primary overflow-hidden shadow-xs divide-y divide-secondary">
              {isLoadingMarkets ? (
                // Skeleton Recipe: quiet, rounded-xs, bg-tertiary, animate-pulse
                <div className="p-xl space-y-lg">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className="h-20 w-full animate-pulse rounded-xs bg-tertiary"
                    />
                  ))}
                </div>
              ) : filteredMarkets.length === 0 ? (
                <div className="p-6xl text-center space-y-md">
                  <p className="body-2 text-secondary">No markets match the current criteria.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setMarketTab('all')
                    }}
                    className="caption-1 text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredMarkets.map((market) => {
                  const outcomes = market.outcomes || []
                  const prices = market.outcomePrices || []
                  const hasFirstPrice = prices[0] !== null && prices[0] !== undefined
                  const firstPricePct = hasFirstPrice ? Math.round((prices[0] as number) * 100) : null

                  return (
                    <RevealItem key={market.conditionId}>
                      <div
                        onClick={() => handleOpenMarket(market)}
                        className="p-xl hover:bg-secondary-hover transition-colors duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-xl group"
                      >
                        <div className="space-y-xs flex-1 min-w-0 pr-md">
                          <div className="flex items-center gap-xs caption-5 text-quaternary">
                            <span>24h vol: ${Math.round(market.volume24hr || 0).toLocaleString()}</span>
                            <span>•</span>
                            <span>
                              {market.endDate
                                ? `Closes: ${new Date(market.endDate).toLocaleDateString()}`
                                : 'Open market'}
                            </span>
                          </div>
                          <h3 className="title-3 text-primary group-hover:text-brand-primary transition-colors duration-300 line-clamp-2">
                            {market.question}
                          </h3>
                        </div>

                        {/* Outcomes & Probabilities */}
                        <div className="flex items-center gap-lg shrink-0">
                          {outcomes.length >= 2 ? (
                            <div className="flex items-center gap-sm">
                              <div className="px-lg py-sm rounded-md bg-secondary border border-primary text-center min-w-[76px]">
                                <span className="block caption-4 text-secondary">{outcomes[0]}</span>
                                <span className="body-4 text-primary font-semibold">
                                  {firstPricePct !== null ? `${firstPricePct}¢` : 'unavailable'}
                                </span>
                              </div>
                              <div className="px-lg py-sm rounded-md bg-secondary border border-primary text-center min-w-[76px]">
                                <span className="block caption-4 text-secondary">{outcomes[1]}</span>
                                <span className="body-4 text-primary font-semibold">
                                  {firstPricePct !== null ? `${100 - firstPricePct}¢` : 'unavailable'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="px-lg py-sm rounded-md bg-secondary border border-primary">
                              <span className="caption-4 text-secondary">Single outcome</span>
                            </div>
                          )}

                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary group-hover:bg-brand-solid group-hover:text-primary-on-brand text-secondary transition-colors duration-300">
                            <CaretRight size={16} />
                          </div>
                        </div>
                      </div>
                    </RevealItem>
                  )
                })
              )}
            </section>
          </div>
        )}

        {/* SCREEN 2: MARKET DETAIL */}
        {activeScreen === 'detail' && selectedMarket && (
          <div className="max-w-[680px] mx-auto space-y-3xl">
            {/* Back Tertiary Button */}
            <button
              onClick={() => setActiveScreen('markets')}
              className="inline-flex items-center gap-xs text-sm font-semibold text-tertiary hover:text-secondary transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded-md p-xs"
            >
              <ArrowLeft size={16} />
              <span>Back to markets</span>
            </button>

            {/* Card Recipe */}
            <section className="rounded-xl border border-secondary bg-primary p-2xl shadow-xs space-y-3xl">
              <div className="space-y-sm">
                <div className="flex flex-wrap items-center gap-sm caption-4 text-quaternary">
                  <span className="inline-flex items-center rounded border border-utility-gray-200 bg-utility-gray-50 px-sm py-xxs font-mono text-[11px] text-utility-gray-700">
                    ID: {selectedMarket.conditionId.slice(0, 10)}...
                  </span>
                  <span>•</span>
                  <span>24h volume: ${Math.round(selectedMarket.volume24hr || 0).toLocaleString()}</span>
                  {selectedMarket.endDate && (
                    <>
                      <span>•</span>
                      <span>Closes: {new Date(selectedMarket.endDate).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
                <h1 className="heading-5 text-primary">{selectedMarket.question}</h1>
              </div>

              {/* Radio Group Recipe Selection */}
              <div className="space-y-md">
                <span className="caption-3 text-secondary uppercase tracking-wider block">
                  Select outcome side
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  {selectedMarket.outcomes.map((outcome, idx) => {
                    const price = selectedMarket.outcomePrices[idx]
                    const isSelected = selectedSide === outcome
                    const priceStr = price !== null && price !== undefined ? `${(price * 100).toFixed(1)}¢` : 'unavailable'

                    return (
                      <label
                        key={outcome}
                        onClick={() => setSelectedSide(outcome)}
                        className={`p-xl rounded-lg border text-left cursor-pointer transition-all duration-300 active:scale-[0.98] focus-within:ring-2 focus-within:ring-focus-ring ${
                          isSelected
                            ? 'border-brand bg-utility-brand-50'
                            : 'border-primary bg-secondary hover:border-secondary'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="title-4 text-primary">{outcome}</span>
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-primary bg-primary">
                            {isSelected && (
                              <span className="size-2 rounded-full bg-brand-solid" aria-hidden="true" />
                            )}
                          </span>
                        </div>
                        <div className="mt-md flex items-baseline gap-xs">
                          <span className="heading-6 text-primary">{priceStr}</span>
                          <span className="caption-5 text-tertiary">implied probability</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Commitment Action Section */}
              <div className="border-t border-secondary pt-2xl space-y-lg">
                <div className="space-y-xxs">
                  <h3 className="body-1 text-primary">Open a verified position</h3>
                  <p className="caption-2 text-secondary">
                    Commit an analytical stance to the public ledger. Grading is calculated mark to market against live odds until contract close.
                  </p>
                </div>

                {positionSuccessMsg && (
                  <div className="flex items-start gap-md rounded-xl bg-utility-success-50 border border-utility-success-200 p-lg">
                    <CheckCircle size={18} className="mt-xxs shrink-0 text-utility-success-600" />
                    <p className="text-sm font-medium text-utility-success-700">{positionSuccessMsg}</p>
                  </div>
                )}

                {positionFormError && (
                  <div className="flex items-start gap-md rounded-xl bg-utility-error-50 border border-utility-error-200 p-lg">
                    <WarningCircle size={18} className="mt-xxs shrink-0 text-utility-error-600" />
                    <p className="text-sm font-medium text-utility-error-700">{positionFormError}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-lg pt-xs">
                  <div className="caption-1 text-secondary bg-secondary p-lg rounded-md border border-primary flex-1">
                    Side selected: <strong className="text-primary">{selectedSide}</strong> at{' '}
                    <strong className="text-primary">
                      {(() => {
                        const idx = selectedMarket.outcomes.indexOf(selectedSide)
                        const p = selectedMarket.outcomePrices[idx]
                        return p !== null && p !== undefined ? `${(p * 100).toFixed(1)}¢` : 'unavailable'
                      })()}
                    </strong>
                  </div>

                  {/* Primary Button Recipe */}
                  <button
                    onClick={handleCommitPosition}
                    disabled={isSubmittingPosition}
                    className="inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-xl py-md text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50 active:scale-[0.98] transition-all duration-300 shrink-0"
                  >
                    {isSubmittingPosition ? 'Recording call...' : 'Take position'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* SCREEN 3: RECORD */}
        {activeScreen === 'record' && (
          <div className="space-y-3xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2xl">
              <div className="max-w-[680px] space-y-md">
                <h1 className="heading-4 text-primary">Public analyst record</h1>
                <p className="body-3 text-secondary">
                  Every position ever committed, tracked mark to market. No positions are deleted, hidden, or retrospectively adjusted.
                </p>
              </div>

              {/* Aggregates Card Recipe */}
              <section className="rounded-xl border border-secondary bg-primary p-md shadow-xs flex items-center divide-x divide-secondary shrink-0">
                <div className="px-xl py-xs text-center">
                  <span className="caption-5 text-secondary block">Positions</span>
                  <span className="title-2 text-primary">{totalCount}</span>
                </div>
                <div className="px-xl py-xs text-center">
                  <span className="caption-5 text-secondary block">Moving up</span>
                  <span className="title-2 text-success-primary">{upPositionsCount}</span>
                </div>
                <div className="px-xl py-xs text-center">
                  <span className="caption-5 text-secondary block">Moving down</span>
                  <span className="title-2 text-error-primary">{downPositionsCount}</span>
                </div>
              </section>
            </div>

            {/* Positions List: Table Recipe Structure */}
            <section className="overflow-hidden rounded-xl border border-secondary bg-primary shadow-xs divide-y divide-secondary">
              {isLoadingPositions ? (
                <div className="p-xl space-y-lg">
                  {[1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="h-20 w-full animate-pulse rounded-xs bg-tertiary"
                    />
                  ))}
                </div>
              ) : positions.length === 0 ? (
                <div className="p-6xl text-center space-y-md">
                  <p className="body-2 text-secondary">No positions currently on the record.</p>
                  <button
                    onClick={() => setActiveScreen('markets')}
                    className="caption-1 text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Open live markets to commit the first position
                  </button>
                </div>
              ) : (
                positions.map((pos) => {
                  const hasPrice = pos.currentPrice !== null && pos.changePct !== null
                  const isUp = hasPrice && (pos.changePct as number) > 0
                  const isDown = hasPrice && (pos.changePct as number) < 0

                  return (
                    <RevealItem key={pos.id}>
                      <div className="p-xl flex flex-col md:flex-row md:items-center justify-between gap-xl hover:bg-secondary-hover transition-colors duration-300">
                        {/* Left Info */}
                        <div className="space-y-xs flex-1 min-w-0 pr-md">
                          <div className="flex items-center gap-sm caption-5 text-quaternary">
                            <span className="inline-flex items-center rounded border border-utility-gray-200 bg-utility-gray-50 px-sm py-xxs font-mono text-[11px] text-utility-gray-700">
                              {pos.source}
                            </span>
                            <span>•</span>
                            <span>Opened: {new Date(pos.openedAt).toLocaleDateString()}</span>
                          </div>
                          <h3 className="title-4 text-primary line-clamp-2">{pos.question}</h3>
                          <div className="caption-2 text-secondary">
                            Side committed:{' '}
                            <span className="caption-1 text-primary">
                              {pos.side} @ {(pos.entryPrice * 100).toFixed(1)}¢
                            </span>
                          </div>
                        </div>

                        {/* Right: Charts recipe (Sparkline) & Graded Mark-to-Market */}
                        <div className="flex items-center gap-2xl shrink-0">
                          <div className="hidden sm:block">
                            <Sparkline isUp={hasPrice ? isUp : null} />
                          </div>

                          <div className="text-right min-w-[70px]">
                            <span className="caption-5 text-quaternary block">Current</span>
                            <span className="caption-1 text-primary">
                              {pos.currentPrice !== null
                                ? `${(pos.currentPrice * 100).toFixed(1)}¢`
                                : 'price unavailable'}
                            </span>
                          </div>

                          <div className="text-right min-w-[84px]">
                            <span className="caption-5 text-quaternary block">Mark to market</span>
                            {hasPrice ? (
                              <div
                                className={`inline-flex items-center gap-xxs caption-3 font-semibold ${
                                  isUp
                                    ? 'text-success-primary'
                                    : isDown
                                    ? 'text-error-primary'
                                    : 'text-tertiary'
                                }`}
                              >
                                {isUp && <ArrowUp size={12} />}
                                {isDown && <ArrowDown size={12} />}
                                <span>
                                  {(pos.changePct as number) > 0 ? '+' : ''}
                                  {(pos.changePct as number).toFixed(1)}%
                                </span>
                              </div>
                            ) : (
                              <span className="caption-5 text-quaternary">price unavailable</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </RevealItem>
                  )
                })
              )}
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-primary bg-primary py-2xl px-xl mt-auto">
        <div className="max-w-[1040px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-md caption-2 text-quaternary">
          <div className="flex items-center gap-sm">
            <span className="caption-1 text-primary">Reckon</span>
            <span>•</span>
            <span>Every call, on the record.</span>
          </div>
          <div>All positions graded mark to market. Real live odds from Polymarket.</div>
        </div>
      </footer>
    </div>
  )
}
