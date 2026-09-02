import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cue, initializeUiSound, updateUiSound } from '../uiSound'

const actionLabel = (target) => target?.type === 'book' ? 'Open volume' : target?.type === 'ladder' ? 'Climb ladder' : 'Open collection'
const SETTINGS_KEY = 'the-library:explore-settings'
const loadSettings = () => {
  const sound = initializeUiSound()
  try { return { sound: sound.enabled, volume: sound.volume, hints: true, lantern: true, reducedMotion: false, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } }
  catch { return { sound: sound.enabled, volume: sound.volume, hints: true, lantern: true, reducedMotion: false } }
}

function Toggle({ label, checked, onChange }) {
  return <label className="settings-toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true"><b /></i></label>
}

export default function ExploreInterface({ showOnboarding, needsShelfTutorial, exploreLocked, target, shelfName, menuShelf, climbing, uploadState, onCloseMenu, onRename, onOpenBook, onSummonLadder, onFile, onRemoveBook, onMoveBookRow, onDismount, setVirtualMove }) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [catalogueOpen, setCatalogueOpen] = useState(false)
  const [arranging, setArranging] = useState(false)
  const [query, setQuery] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(loadSettings)
  const [pendingRemoval, setPendingRemoval] = useState('')
  const fileInput = useRef()
  const nameInput = useRef()

  useEffect(() => { setEditing(false); setCatalogueOpen(false); setArranging(false); setQuery(''); setPendingRemoval(''); setDraftName(menuShelf?.name || '') }, [menuShelf?.shelfId])
  useEffect(() => { if (editing) { nameInput.current?.focus(); nameInput.current?.select() } }, [editing])
  useEffect(() => {
    updateUiSound({ enabled: settings.sound, volume: settings.volume })
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* session-only fallback */ }
    document.documentElement.classList.toggle('reduce-library-motion', settings.reducedMotion)
    window.dispatchEvent(new CustomEvent('library-lantern', { detail: { enabled: settings.lantern } }))
  }, [settings])

  const orderedBooks = useMemo(() => [...(menuShelf?.books || [])].sort((a, b) => (a.slot ?? a.addedAt) - (b.slot ?? b.addedAt)), [menuShelf?.books])
  const filteredBooks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return normalized ? orderedBooks.filter((book) => `${book.title} ${book.fileName || ''}`.toLowerCase().includes(normalized)) : orderedBooks
  }, [orderedBooks, query])

  const updateSetting = (name, value) => { setSettings((current) => ({ ...current, [name]: value })); cue(name === 'sound' && !value ? 'release' : 'toggle', .38) }
  const submitName = (event) => { event.preventDefault(); const value = draftName.trim(); if (!value) return; onRename(value); setEditing(false); cue('success', .42) }
  const moveBook = (bookId, direction) => { onMoveBookRow(bookId, direction); cue('page', .32) }
  const openCatalogue = (arrange = false) => { setCatalogueOpen(true); setArranging(arrange); cue('bloom', .34) }
  const closeCatalogue = () => { setCatalogueOpen(false); setArranging(false); cue('close', .34) }
  const closeShelf = () => { setEditing(false); onCloseMenu(); cue('close', .34) }
  const shelfCount = menuShelf?.bookCount || 0

  useEffect(() => {
    const closeTopLayer = (event) => {
      if (event.key !== 'Escape' || event.repeat) return
      if (catalogueOpen) {
        event.preventDefault()
        event.stopImmediatePropagation()
        closeCatalogue()
      } else if (editing) {
        event.preventDefault()
        event.stopImmediatePropagation()
        setEditing(false)
        setDraftName(menuShelf?.name || '')
        cue('close', .34)
      } else if (menuShelf) {
        event.preventDefault()
        event.stopImmediatePropagation()
        closeShelf()
      } else if (settingsOpen) {
        event.preventDefault()
        event.stopImmediatePropagation()
        setSettingsOpen(false)
        cue('close', .34)
      } else if (climbing) {
        event.preventDefault()
        event.stopImmediatePropagation()
        onDismount()
        cue('close', .34)
      }
    }
    window.addEventListener('keydown', closeTopLayer, true)
    return () => window.removeEventListener('keydown', closeTopLayer, true)
  }, [catalogueOpen, climbing, editing, menuShelf, onDismount, settingsOpen])

  return <>
    {settings.hints && showOnboarding && !climbing && !menuShelf && <div className="explore-onboarding" aria-live="polite">
      <div className="explore-onboarding__title"><i />Free exploration</div>
      <p className="explore-onboarding__note">{exploreLocked ? 'Aim toward a bookcase. The reticle opens when a collection is within reach.' : 'Click inside the library to take control, then look toward any bookcase.'}</p>
      <div className="explore-onboarding__controls">
        <div className="explore-control explore-control--move"><span className="explore-control__keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span className="explore-control__label">Move</span></div>
        <div className="explore-control"><span className="explore-control__mouse"><i /></span><span className="explore-control__label">Look</span></div>
        <div className="explore-control"><kbd>E</kbd><span className="explore-control__label">Interact</span></div>
      </div>
    </div>}

    {settings.hints && needsShelfTutorial && !showOnboarding && !target && !climbing && !menuShelf && <aside className="shelf-discovery-hint" aria-live="polite"><i aria-hidden="true" /><div><small>Discover a collection</small><span>Aim at any bookcase. Its name appears when it can be opened.</span></div></aside>}

    {!menuShelf && !climbing && <div className="explore-settings-anchor">
      {settingsOpen && <section className="explore-settings" aria-label="Exploration settings">
        <header><div><span>Field settings</span><small>Local preferences</small></div><button type="button" className="explore-settings__close" onClick={() => { setSettingsOpen(false); cue('close', .34) }}><kbd>Esc</kbd><span>Close</span></button></header>
        <div className="explore-settings__controls" aria-label="Exploration controls">
          <span>Controls</span>
          <dl><div><dt><kbd>W A S D</kbd></dt><dd>Move</dd></div><div><dt><kbd>Mouse</kbd></dt><dd>Look</dd></div><div><dt><kbd>E</kbd></dt><dd>Interact</dd></div><div><dt><kbd>Shift</kbd></dt><dd>Move faster</dd></div><div><dt><kbd>Esc</kbd></dt><dd>Release cursor</dd></div></dl>
        </div>
        <Toggle label="Interaction sound" checked={settings.sound} onChange={(value) => updateSetting('sound', value)} />
        <Toggle label="Control hints" checked={settings.hints} onChange={(value) => updateSetting('hints', value)} />
        <Toggle label="Hand lantern" checked={settings.lantern} onChange={(value) => updateSetting('lantern', value)} />
        <Toggle label="Reduced motion" checked={settings.reducedMotion} onChange={(value) => updateSetting('reducedMotion', value)} />
        <label className="settings-volume"><span>Interface volume</span><input type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={(event) => setSettings((current) => ({ ...current, volume: Number(event.target.value) }))} /></label>
      </section>}
      <button className={`explore-settings-button ${settingsOpen ? 'is-open' : ''}`} aria-label="Exploration settings" aria-expanded={settingsOpen} onClick={() => { setSettingsOpen((value) => !value); cue('bloom', .32) }}><svg viewBox="0 0 24 24"><path d="M12 8.1a3.9 3.9 0 1 0 0 7.8 3.9 3.9 0 0 0 0-7.8Zm8.2 5.3v-2.8l-2.1-.7a7 7 0 0 0-.7-1.7l1-2-2-2-2 1a7 7 0 0 0-1.7-.7L12 2.3H9.2l-.7 2.2a7 7 0 0 0-1.7.7l-2-1-2 2 1 2a7 7 0 0 0-.7 1.7l-2.1.7v2.8l2.1.7a7 7 0 0 0 .7 1.7l-1 2 2 2 2-1a7 7 0 0 0 1.7.7l.7 2.2H12l.7-2.2a7 7 0 0 0 1.7-.7l2 1 2-2-1-2a7 7 0 0 0 .7-1.7l2.1-.7Z" /></svg></button>
    </div>}

    <div className={`explore-target ${target ? 'is-visible' : ''} ${target?.type ? `is-${target.type}` : ''}`} aria-live="polite">{target && <><strong>{target.type === 'book' ? target.title : target.type === 'ladder' ? 'Rolling ladder' : shelfName}</strong><span><kbd>E</kbd> {actionLabel(target)}</span></>}</div>
    <i className={`explore-reticle ${target ? 'is-targeting' : ''} ${climbing ? 'is-climbing' : ''}`} />
    {settings.lantern && <div className={`lantern-status ${menuShelf ? 'is-hidden' : ''}`}><i /><span>Lantern lit</span></div>}

    {climbing && <div className="ladder-hud"><span>Searching the upper shelves</span><p><kbd>W</kbd>/<kbd>S</kbd> climb · <kbd>A</kbd>/<kbd>D</kbd> move with ladder · <kbd>E</kbd> descend</p><button type="button" onClick={() => { cue('close', .34); onDismount() }}><kbd>Esc</kbd> Descend</button></div>}

    {menuShelf && !catalogueOpen && <div className="shelf-actions" role="dialog" aria-label={`Organize ${menuShelf.name}`}>
      <div className="shelf-actions__body">
        <div className="shelf-actions__eyebrow"><span>Selected collection</span><i /><span>{String(shelfCount).padStart(2, '0')} volumes</span></div>
        {editing ? <form onSubmit={submitName} className="shelf-actions__rename"><label htmlFor="shelf-name">Shelf title</label><div><input ref={nameInput} id="shelf-name" value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={42} autoComplete="off" /><button type="submit" data-cuelume-press><kbd>↵</kbd> Confirm</button></div></form> : <div className="shelf-actions__heading"><small>Private collection</small><h2>{menuShelf.name}</h2><p>{shelfCount ? `${shelfCount} personal ${shelfCount === 1 ? 'volume' : 'volumes'} catalogued here` : 'An empty shelf awaiting its first volume'}</p></div>}
        <div className="shelf-actions__row">
          <button data-cuelume-press="scan" onClick={() => openCatalogue(false)}><span>01</span><strong>Browse catalogue</strong><em>Search every title</em></button>
          <button data-cuelume-press="press" onClick={() => fileInput.current?.click()}><span>02</span><strong>Add volume</strong><em>PDF or EPUB</em></button>
          <button data-cuelume-press="page" disabled={shelfCount < 1} onClick={() => openCatalogue(true)}><span>03</span><strong>Place volumes</strong><em>Move between rows</em></button>
          <button data-cuelume-press="tick" onClick={() => setEditing(true)}><span>04</span><strong>Rename shelf</strong><em>Edit collection title</em></button>
          {!menuShelf.hasLadder && <button data-cuelume-press="arrival" onClick={onSummonLadder}><span>05</span><strong>Summon ladder</strong><em>Reach upper shelves</em></button>}
        </div>
        {uploadState && <p className="shelf-actions__status">{uploadState}</p>}
      </div>
      <button type="button" className="shelf-actions__close" onClick={closeShelf}><kbd>Esc</kbd><span>Close</span></button>
      <input ref={fileInput} className="visually-hidden" type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" onChange={(event) => { const file = event.target.files?.[0]; if (file) onFile(file); event.target.value = '' }} />
    </div>}

    {catalogueOpen && menuShelf && <section className="shelf-catalogue" role="dialog" aria-modal="true" aria-label={`${menuShelf.name} catalogue`}>
      <header><div><small>{arranging ? 'Shelf placement' : 'Shelf catalogue'}</small><h2>{menuShelf.name}</h2></div><button type="button" aria-label="Close catalogue" onClick={closeCatalogue}><kbd>Esc</kbd><span>Close</span></button></header>
      <label className="shelf-catalogue__search"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a volume" autoFocus /></label>
      <div className="shelf-catalogue__list">{filteredBooks.length ? filteredBooks.map((book) => {
        const row = book.row ?? (2 + (Math.floor((book.slot || 0) / 10) % 9))
        return <article key={book.id} className="catalogue-volume"><span className="catalogue-volume__number">{String(row + 1).padStart(2, '0')}</span><button className="catalogue-volume__title" data-cuelume-hover="tick" onClick={() => onOpenBook(book.id)}><strong>{book.title}</strong><small>{book.format?.toUpperCase()} · shelf row {row + 1}</small></button>{arranging ? <div className="catalogue-volume__move"><button data-cuelume-press="page" aria-label={`Move ${book.title} one row higher`} disabled={row >= 13} onClick={() => moveBook(book.id, 1)}>↑</button><button data-cuelume-press="page" aria-label={`Move ${book.title} one row lower`} disabled={row <= 0} onClick={() => moveBook(book.id, -1)}>↓</button></div> : <button className="catalogue-volume__remove" onClick={() => { if (pendingRemoval === book.id) { onRemoveBook(book.id); setPendingRemoval('') } else setPendingRemoval(book.id) }}>{pendingRemoval === book.id ? 'Confirm' : 'Remove'}</button>}</article>
      }) : <div className="shelf-catalogue__empty"><span>{query ? 'No title answers that search.' : 'No personal volumes on this shelf yet.'}</span></div>}</div>
      <footer><span>{arranging ? 'Arrows move the physical volume' : `${filteredBooks.length} shown`}</span><button data-cuelume-toggle onClick={() => setArranging((value) => !value)}>{arranging ? 'Finish placement' : 'Place on shelf'}</button></footer>
    </section>}

    <div className="explore-pad" aria-label="Movement controls">{[['KeyW','↑','explore-pad__forward'],['KeyA','←','explore-pad__left'],['KeyS','↓','explore-pad__back'],['KeyD','→','explore-pad__right']].map(([code,label,className]) => <button key={code} className={className} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setVirtualMove(code, true) }} onPointerUp={() => setVirtualMove(code, false)} onPointerCancel={() => setVirtualMove(code, false)} onLostPointerCapture={() => setVirtualMove(code, false)}>{label}</button>)}</div>
  </>
}
