import { useState } from 'react'
import { useSettings } from '../context/SettingsContext'
import { randomPhotos, clearCache } from '../services/unsplash'
import { exportAll, importAll, clearAll } from '../services/storage'

const ALL_KEYS = ['settings', 'favorites', 'customQuotes', 'recentCards', 'presets']

export default function SettingsModal({ onClose }) {
  const { settings, updateSettings } = useSettings()
  const [accessKey, setAccessKey] = useState(settings.accessKey)
  const [appName, setAppName] = useState(settings.appName)
  const [contentFilter, setContentFilter] = useState(settings.contentFilter)
  const [testStatus, setTestStatus] = useState(null) // { ok: bool, message }
  const [testing, setTesting] = useState(false)

  function save() {
    updateSettings({ accessKey: accessKey.trim(), appName: appName.trim() || 'quote_card_studio', contentFilter })
    clearCache()
  }

  async function testConnection() {
    setTesting(true)
    setTestStatus(null)
    try {
      await randomPhotos(accessKey.trim(), { count: 1, contentFilter })
      setTestStatus({ ok: true, message: '연결 성공! 키가 정상적으로 동작합니다.' })
    } catch (e) {
      if (e.status === 401) {
        setTestStatus({ ok: false, message: 'API 키를 확인해 주세요. (401 Unauthorized)' })
      } else if (e.status === 403) {
        setTestStatus({ ok: false, message: '권한이 없거나 시간당 호출 한도를 초과했습니다.' })
      } else {
        setTestStatus({ ok: false, message: `연결 실패: ${e.message}` })
      }
    } finally {
      setTesting(false)
    }
  }

  function handleExport() {
    const data = exportAll(ALL_KEYS)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quote-card-studio-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        importAll(data)
        window.location.reload()
      } catch {
        alert('올바른 데이터 파일이 아닙니다.')
      }
    }
    reader.readAsText(file)
  }

  function handleReset() {
    if (!confirm('모든 로컬 데이터를 초기화합니다. 계속할까요?')) return
    clearAll(ALL_KEYS)
    window.location.reload()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>설정</h2>
          <button type="button" className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="field">
          <span className="field__label">Unsplash Access Key</span>
          <input
            type="text"
            className="field__control"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="Access Key 입력"
          />
          <div className="modal-actions">
            <button type="button" className="btn" onClick={testConnection} disabled={testing || !accessKey.trim()}>
              {testing ? '테스트 중…' : '연결 테스트'}
            </button>
          </div>
          {testStatus && (
            <div className={`status-line ${testStatus.ok ? 'status-line--ok' : 'status-line--error'}`}>
              {testStatus.message}
            </div>
          )}
        </div>

        <div className="field">
          <span className="field__label">앱 이름 (UTM utm_source)</span>
          <input
            type="text"
            className="field__control"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
        </div>

        <div className="field">
          <span className="field__label">콘텐츠 필터</span>
          <select className="field__control" value={contentFilter} onChange={(e) => setContentFilter(e.target.value)}>
            <option value="high">high (엄격)</option>
            <option value="low">low</option>
          </select>
        </div>

        <button type="button" className="btn btn--primary" onClick={save} style={{ width: '100%' }}>
          저장
        </button>

        <div className="field" style={{ marginTop: 20 }}>
          <span className="field__label">데이터 관리</span>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={handleExport}>
              내보내기
            </button>
            <label className="btn" style={{ display: 'inline-block' }}>
              가져오기
              <input type="file" accept="application/json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
            <button type="button" className="btn" onClick={handleReset} style={{ color: 'var(--danger)' }}>
              초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
