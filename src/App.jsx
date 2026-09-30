import { useCallback, useRef, useState } from 'react'
import { SettingsProvider, useSettings } from './context/SettingsContext'
import { EditorProvider, useEditor } from './context/EditorContext'
import { useUnsplashSearch } from './hooks/useUnsplashSearch'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useRateLimit } from './hooks/useRateLimit'
import { getAccessKey } from './services/apiKey'
import { orientationForRatio } from './utils/constants'
import { DEFAULT_PRESETS } from './data/presets'
import BUILTIN_QUOTES from './data/quotes.json'

import Header from './components/Header'
import MoodChips from './components/MoodChips'
import SearchBar from './components/SearchBar'
import PhotoGrid from './components/PhotoGrid'
import CardCanvas from './components/CardCanvas'
import RatioSelector from './components/RatioSelector'
import QuotePicker from './components/QuotePicker'
import Attribution from './components/Attribution'
import ExportButtons from './components/ExportButtons'
import EditorPanel from './components/EditorPanel'
import PresetManager from './components/PresetManager'
import RecentCards from './components/RecentCards'
import SettingsModal from './components/SettingsModal'

const MAX_RECENT = 20
const MAX_CUSTOM_QUOTES = 100
const MAX_PRESETS = 10

function AppShell() {
  const { settings, updateSettings } = useSettings()
  const { state, dispatch } = useEditor()
  const accessKey = getAccessKey(settings)
  const rateLimit = useRateLimit()

  const [mobileTab, setMobileTab] = useState('photo')
  const [settingsOpen, setSettingsOpen] = useState(!accessKey)
  const [activeMood, setActiveMood] = useState(null)

  const [favorites, setFavorites] = useLocalStorage('favorites', [])
  const [customQuotes, setCustomQuotes] = useLocalStorage('customQuotes', [])
  const [recentCards, setRecentCards] = useLocalStorage('recentCards', [])
  const [presets, setPresets] = useLocalStorage('presets', DEFAULT_PRESETS)

  const { results, loading, error, hasMore, searchId, search, loadMore } = useUnsplashSearch({
    accessKey,
    contentFilter: settings.contentFilter,
  })

  const canvasRef = useRef(null)

  const runSearch = useCallback(
    (query, mood) => {
      setActiveMood(mood)
      search(query, { orientation: orientationForRatio(state.ratio) })
    },
    [search, state.ratio]
  )

  function handleSelectPhoto(photo) {
    dispatch({ type: 'SET_PHOTO', photo })
    if (window.innerWidth < 768) setMobileTab('edit')
  }

  function handleSelectQuote(quote) {
    dispatch({ type: 'SET_QUOTE', quote: { text: quote.text, author: quote.author, id: quote.id } })
  }

  function handleRatioChange(ratio) {
    dispatch({ type: 'SET_RATIO', ratio })
    updateSettings({ lastRatio: ratio })
  }

  function handleStyleChange(patch) {
    dispatch({ type: 'SET_STYLE', style: patch })
  }

  function toggleFavorite(id) {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  function addCustomQuote({ text, author }) {
    const quote = { id: `custom-${Date.now()}`, text, author, lang: /[a-zA-Z]/.test(text) && !/[가-힣]/.test(text) ? 'en' : 'ko', tags: [] }
    setCustomQuotes((prev) => [quote, ...prev].slice(0, MAX_CUSTOM_QUOTES))
    handleSelectQuote(quote)
  }

  function applyPreset(style) {
    dispatch({ type: 'APPLY_PRESET', style })
  }

  function savePreset(name, style) {
    const preset = { id: `preset-user-${Date.now()}`, name, style }
    setPresets((prev) => [...prev, preset].slice(0, MAX_PRESETS))
  }

  function deletePreset(id) {
    setPresets((prev) => prev.filter((p) => p.id !== id))
  }

  function handleExported() {
    if (!state.photo || !state.quote) return
    const card = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ratio: state.ratio,
      photo: state.photo,
      quote: { text: state.quote.text, author: state.quote.author },
      style: state.style,
    }
    setRecentCards((prev) => [card, ...prev].slice(0, MAX_RECENT))
  }

  function restoreCard(card) {
    dispatch({ type: 'RESTORE_CARD', card })
    setMobileTab('edit')
  }

  return (
    <div className="app">
      <Header rateLimit={rateLimit} onOpenSettings={() => setSettingsOpen(true)} />

      <div className="mood-bar">
        <MoodChips activeKey={activeMood?.key} onSelect={(mood) => runSearch(mood.query, mood)} />
        <SearchBar onSearch={runSearch} />
      </div>

      <div className="layout" data-tab={mobileTab}>
        <div className="panel panel--grid">
          <PhotoGrid
            results={results}
            loading={loading}
            error={error}
            hasMore={hasMore}
            onLoadMore={loadMore}
            searchId={searchId}
            selectedId={state.photo?.id}
            onSelect={handleSelectPhoto}
          />
        </div>

        <div className="panel panel--center">
          <CardCanvas ref={canvasRef} photo={state.photo} quote={state.quote} style={state.style} ratio={state.ratio} />
          <Attribution photo={state.photo} />
          <ExportButtons
            canvasRef={canvasRef}
            photo={state.photo}
            quote={state.quote}
            style={state.style}
            ratio={state.ratio}
            accessKey={accessKey}
            onExported={handleExported}
          />
        </div>

        <div className="panel panel--editor">
          <RatioSelector value={state.ratio} onChange={handleRatioChange} />
          <QuotePicker
            quotes={BUILTIN_QUOTES}
            customQuotes={customQuotes}
            favorites={favorites}
            moodTag={activeMood?.tag}
            selectedId={state.quote?.id}
            onSelect={handleSelectQuote}
            onToggleFavorite={toggleFavorite}
            onAddCustom={addCustomQuote}
          />
          <EditorPanel style={state.style} onChange={handleStyleChange} />
          <PresetManager
            presets={presets}
            currentStyle={state.style}
            onApply={applyPreset}
            onSave={savePreset}
            onDelete={deletePreset}
          />
        </div>
      </div>

      <RecentCards cards={recentCards} onRestore={restoreCard} />

      <div className="mobile-tabbar">
        <button className={mobileTab === 'photo' ? 'active' : ''} onClick={() => setMobileTab('photo')}>
          사진
        </button>
        <button className={mobileTab === 'edit' ? 'active' : ''} onClick={() => setMobileTab('edit')}>
          편집
        </button>
        <button className={mobileTab === 'export' ? 'active' : ''} onClick={() => setMobileTab('export')}>
          내보내기
        </button>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <EditorProvider>
        <AppShell />
      </EditorProvider>
    </SettingsProvider>
  )
}
