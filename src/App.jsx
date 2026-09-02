import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import LibraryWorld from './components/LibraryWorld'
import Manuscript from './components/Manuscript'
import ExploreInterface from './components/ExploreInterface'
import { chapters } from './data/library'
import { listLibraryBooks, loadShelfNames, removeLibraryBook, saveLibraryBook, saveShelfNames, titleFromFile } from './libraryStorage'
import { requestWorldRender } from './worldRender'

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))
const initialUiInspection = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('inspectUi') : null
const EXPERIENCE_MODE_KEY = 'the-library:experience-mode'
const SHELF_TUTORIAL_KEY = 'the-library:shelf-discovery-complete'
const loadExperienceMode = () => {
  if (initialUiInspection) return 'explore'
  try {
    return window.localStorage.getItem(EXPERIENCE_MODE_KEY) === 'explore' ? 'explore' : 'tour'
  } catch {
    return 'tour'
  }
}
const rememberExperienceMode = (mode) => {
  try { window.localStorage.setItem(EXPERIENCE_MODE_KEY, mode) } catch { /* Browsing still works when storage is unavailable. */ }
}
const inspectionShelfTarget = { type: 'shelf', id: 'shelf-4-1', shelfId: 'shelf-4-1', shelfPosition: [-7.2, 0, -28], rotationY: Math.PI / 2, face: -1 }
const inspectionBook = { id: 'inspection-volume', shelfId: 'shelf-0-1', title: 'The Cartographer of Forgotten Stars', fileName: 'the-cartographer.pdf', format: 'pdf', face: 1, size: 1200, addedAt: 1 }

function LoadingScreen({ ready }) {
  return (
    <div className={`loading ${ready ? 'is-ready' : ''}`}>
      <div className="loading__image" />
      <div className="loading__veil" />
      <div className="loading__content">
        <h1>Virtual Library</h1>
        <p>Lighting the candles…</p>
        <span className="loading__line"><i /></span>
      </div>
    </div>
  )
}

function SoundToggle() {
  const [on, setOn] = useState(false)
  return (
    <button className={`sound ${on ? 'is-on' : ''}`} onClick={() => setOn(!on)} aria-pressed={on} aria-label={on ? 'Turn sound off' : 'Turn sound on'}>
      <svg aria-hidden="true" viewBox="0 0 32 32" fill="none">
        <path className="sound__speaker" d="M7.5 13h4.2l5.3-4.4v14.8L11.7 19H7.5z" />
        <path className="sound__wave sound__wave--one" d="M20.4 12.1c1.9 2.1 1.9 5.7 0 7.8" />
        <path className="sound__wave sound__wave--two" d="M23.5 9.1c3.5 3.8 3.5 10 0 13.8" />
        <path className="sound__slash" d="M7.5 7.5l17 17" />
      </svg>
    </button>
  )
}

const LibraryCanvas = React.memo(function LibraryCanvas({ progress, pointer, perfInteraction, benchmarkMode, exploreEnabled, explorePaused, onExploreLockChange, onExploreTargetChange, onExploreInteract, focusedTarget, libraryBooks, ladderPlacement, climbing, onDismount, onPrepared }) {
  return (
    <Canvas frameloop="demand" shadows={false} dpr={0.85} camera={{ fov: 46, near: 0.1, far: 100, position: [0.3, 1.05, 24.2] }} gl={{ antialias: true, alpha: false, stencil: false, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMappingExposure = 1.62 }}>
      <Suspense fallback={null}>
        <LibraryWorld progress={progress} pointer={pointer} perfInteraction={perfInteraction} benchmarkMode={benchmarkMode} exploreEnabled={exploreEnabled} explorePaused={explorePaused} onExploreLockChange={onExploreLockChange} onExploreTargetChange={onExploreTargetChange} onExploreInteract={onExploreInteract} focusedTarget={focusedTarget} libraryBooks={libraryBooks} ladderPlacement={ladderPlacement} climbing={climbing} onDismount={onDismount} onPrepared={onPrepared} />
        <Preload all />
      </Suspense>
    </Canvas>
  )
})

export default function App() {
  const progress = useRef(initialUiInspection ? 0.2 : 0)
  const pointer = useRef({ x: 0, y: 0 })
  const [displayProgress, setDisplayProgress] = useState(initialUiInspection ? 0.2 : 0)
  const [ready, setReady] = useState(false)
  const [showLoader, setShowLoader] = useState(true)
  const [scenePrepared, setScenePrepared] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchResult, setSearchResult] = useState('')
  const [bookOpen, setBookOpen] = useState(initialUiInspection === 'reader' || initialUiInspection === 'storedReader')
  const [activeBook, setActiveBook] = useState(null)
  const [experienceMode, setExperienceMode] = useState(loadExperienceMode)
  const [showExploreOnboarding, setShowExploreOnboarding] = useState(() => loadExperienceMode() === 'explore' && !String(initialUiInspection || '').toLowerCase().includes('reader'))
  const [shelfTutorialComplete, setShelfTutorialComplete] = useState(() => {
    try { return window.localStorage.getItem(SHELF_TUTORIAL_KEY) === 'yes' }
    catch { return false }
  })
  const [exploreLocked, setExploreLocked] = useState(false)
  const [exploreTarget, setExploreTarget] = useState(initialUiInspection === 'shelf' ? inspectionShelfTarget : initialUiInspection === 'book' ? { type: 'book', id: inspectionBook.id, shelfId: inspectionBook.shelfId, title: inspectionBook.title } : null)
  const [menuTarget, setMenuTarget] = useState(initialUiInspection === 'shelf' ? inspectionShelfTarget : null)
  const [shelfNames, setShelfNames] = useState(() => loadShelfNames())
  const [libraryBooks, setLibraryBooks] = useState(initialUiInspection === 'book' ? [inspectionBook] : [])
  const [uploadState, setUploadState] = useState('')
  const [ladderPlacement, setLadderPlacement] = useState(initialUiInspection === 'ladder' ? { shelfId: inspectionShelfTarget.shelfId, position: inspectionShelfTarget.shelfPosition, rotationY: inspectionShelfTarget.rotationY, face: inspectionShelfTarget.face } : null)
  const [climbing, setClimbing] = useState(initialUiInspection === 'ladder')
  const exploring = experienceMode === 'explore'
  const exploringRef = useRef(false)
  const scrollTick = useRef(false)
  const pointerTick = useRef(false)
  const lastUiUpdate = useRef(0)
  const perfInteraction = useRef({ scrollTimestamp: 0, scrollSequence: 0 })
  const benchmarkMode = useMemo(() => new URLSearchParams(window.location.search).get('perf') === '1', [])
  const autoBenchmark = useMemo(() => new URLSearchParams(window.location.search).get('autorun') === '1', [])
  const onExploreLockChange = useCallback((locked) => setExploreLocked(locked), [])

  useEffect(() => {
    if (initialUiInspection === 'book') return undefined
    let active = true
    listLibraryBooks().then((books) => {
      if (!active) return
      setLibraryBooks(books)
      if (initialUiInspection === 'storedReader' && books[0]) {
        setActiveBook(books[0])
        setBookOpen(true)
      }
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const defaultShelfName = useCallback((id) => {
    const names = ['Ancient Histories', 'Natural Philosophy', 'Classic Literature', 'Arcane Studies', 'Astronomy', 'Poetry & Drama', 'Mythic Creatures', 'Forgotten Languages']
    let hash = 0
    for (let index = 0; index < id.length; index += 1) hash = ((hash << 5) - hash + id.charCodeAt(index)) | 0
    return names[Math.abs(hash) % names.length]
  }, [])
  const shelfNameFor = useCallback((id) => shelfNames[id] || defaultShelfName(id || ''), [defaultShelfName, shelfNames])

  const closeExploreMenu = useCallback(() => {
    setMenuTarget(null)
    setUploadState('')
  }, [])

  const completeShelfTutorial = useCallback(() => {
    setShelfTutorialComplete(true)
    try { window.localStorage.setItem(SHELF_TUTORIAL_KEY, 'yes') } catch { /* The hint can return next session if storage is unavailable. */ }
  }, [])

  const handleExploreInteract = useCallback((target) => {
    if (!target) return
    if (target.type === 'shelf' || target.type === 'book') completeShelfTutorial()
    if (target.type === 'book') {
      const book = libraryBooks.find((item) => item.id === target.id)
      if (!book) return
      if (document.pointerLockElement) document.exitPointerLock()
      setActiveBook(book)
      setBookOpen(true)
      return
    }
    if (target.type === 'ladder') {
      setClimbing(true)
      return
    }
    if (target.type === 'shelf') {
      if (document.pointerLockElement) document.exitPointerLock()
      setMenuTarget(target)
      setUploadState('')
    }
  }, [completeShelfTutorial, libraryBooks])

  const renameShelf = useCallback((name) => {
    if (!menuTarget?.shelfId) return
    setShelfNames((current) => {
      const next = { ...current, [menuTarget.shelfId]: name }
      saveShelfNames(next)
      return next
    })
  }, [menuTarget])

  const uploadBook = useCallback(async (file) => {
    if (!menuTarget?.shelfId) return
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'epub'].includes(extension)) {
      setUploadState('Choose a PDF or EPUB volume.')
      return
    }
    if (file.size > 80 * 1024 * 1024) {
      setUploadState('This volume is over the 80 MB local-library limit.')
      return
    }
    setUploadState('')
    const existing = libraryBooks.filter((book) => book.shelfId === menuTarget.shelfId)
    const record = {
      id: crypto.randomUUID(),
      shelfId: menuTarget.shelfId,
      title: titleFromFile(file.name),
      fileName: file.name,
      format: extension,
      mimeType: file.type,
      size: file.size,
      face: menuTarget.face || 1,
      addedAt: Date.now(),
      file,
      slot: existing.length,
      row: 2 + (Math.floor(existing.length / 10) % 9),
    }
    try {
      await saveLibraryBook(record)
      setLibraryBooks((current) => [...current, record])
      setUploadState('')
      requestWorldRender()
    } catch {
      setUploadState('The browser could not store this volume locally.')
    }
  }, [libraryBooks, menuTarget])

  const summonLadder = useCallback(() => {
    if (!menuTarget?.shelfId) return
    setLadderPlacement({ shelfId: menuTarget.shelfId, position: menuTarget.shelfPosition, rotationY: menuTarget.rotationY, face: menuTarget.face || 1 })
    setClimbing(false)
    closeExploreMenu()
    requestWorldRender()
  }, [closeExploreMenu, menuTarget])

  const removeBook = useCallback(async (id) => {
    try {
      await removeLibraryBook(id)
      setLibraryBooks((current) => current.filter((book) => book.id !== id))
      setUploadState('')
      requestWorldRender()
    } catch {
      setUploadState('The volume could not be removed from local storage.')
    }
  }, [])

  const moveBookToRow = useCallback(async (id, direction) => {
    const selected = libraryBooks.find((book) => book.id === id)
    if (!selected) return
    const currentRow = selected.row ?? (2 + (Math.floor((selected.slot || 0) / 10) % 9))
    const nextRow = clamp(currentRow + direction, 0, 13)
    if (nextRow === currentRow) return
    const nextBooks = libraryBooks.map((book) => book.id === id ? { ...book, row: nextRow } : book)
    setLibraryBooks(nextBooks)
    try {
      await saveLibraryBook(nextBooks.find((book) => book.id === id))
      setUploadState('')
      requestWorldRender()
    } catch {
      setUploadState('The volume could not be moved to that row.')
    }
  }, [libraryBooks])

  const openBookFromCatalogue = useCallback((id) => {
    const book = libraryBooks.find((item) => item.id === id)
    if (!book) return
    setMenuTarget(null)
    setActiveBook(book)
    setBookOpen(true)
  }, [libraryBooks])

  useEffect(() => { exploringRef.current = exploring }, [exploring])

  useEffect(() => {
    if (!showExploreOnboarding) return undefined
    const timer = window.setTimeout(() => setShowExploreOnboarding(false), 5000)
    return () => window.clearTimeout(timer)
  }, [showExploreOnboarding])

  useEffect(() => {
    if (!exploring) return undefined
    const htmlOverflow = document.documentElement.style.overflow
    const bodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = htmlOverflow
      document.body.style.overflow = bodyOverflow
    }
  }, [exploring])

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 650)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready || !scenePrepared) return undefined
    const removeTimer = window.setTimeout(() => setShowLoader(false), 450)
    return () => window.clearTimeout(removeTimer)
  }, [ready, scenePrepared])

  const onScenePrepared = useCallback(() => {
    performance.mark('library-scene-prepared')
    setScenePrepared(true)
  }, [])

  useEffect(() => {
    const update = () => {
      scrollTick.current = false
      if (exploringRef.current) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      const value = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0
      progress.current = value
      requestWorldRender()
      const now = performance.now()
      if (now - lastUiUpdate.current >= 90 || value === 0 || value === 1) {
        lastUiUpdate.current = now
        setDisplayProgress(value)
      }
    }
    const onScroll = () => {
      perfInteraction.current.scrollTimestamp = performance.now()
      perfInteraction.current.scrollSequence += 1
      if (!scrollTick.current) { scrollTick.current = true; requestAnimationFrame(update) }
    }
    const onPointer = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.current.y = -(event.clientY / window.innerHeight - 0.5) * 2
      if (!pointerTick.current) {
        pointerTick.current = true
        requestAnimationFrame(() => {
          pointerTick.current = false
          requestWorldRender()
        })
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    if (!benchmarkMode || !autoBenchmark || !scenePrepared) return undefined
    document.documentElement.dataset.performancePhase = 'load'
    let animationFrame = 0
    let startTime = 0
    const duration = 14000
    const beginTimer = window.setTimeout(() => {
      document.documentElement.dataset.performancePhase = 'running'
      window.scrollTo(0, 0)
      const run = (now) => {
        if (!startTime) startTime = now
        const elapsed = now - startTime
        const ratio = clamp(elapsed / duration, 0, 1)
        const max = document.documentElement.scrollHeight - window.innerHeight
        window.scrollTo(0, max * ratio)
        if (ratio < 1) animationFrame = requestAnimationFrame(run)
        else {
          document.documentElement.dataset.performancePhase = 'complete'
          document.documentElement.dataset.performanceRun = 'complete'
        }
      }
      animationFrame = requestAnimationFrame(run)
    }, 2200)
    return () => {
      window.clearTimeout(beginTimer)
      cancelAnimationFrame(animationFrame)
    }
  }, [benchmarkMode, autoBenchmark, scenePrepared])

  const activeChapter = useMemo(() => {
    let active = chapters[0]
    chapters.forEach((chapter) => { if (displayProgress >= chapter.stop - 0.06) active = chapter })
    return active.id
  }, [displayProgress])

  const travelTo = (stop) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: max * stop, behavior: 'smooth' })
  }

  const enterExplore = () => {
    setBookOpen(false)
    setSearchOpen(false)
    const stop = 0.2
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, max * stop)
    progress.current = stop
    setDisplayProgress(stop)
    rememberExperienceMode('explore')
    setExperienceMode('explore')
    setActiveBook(null)
    setExploreTarget(null)
    setMenuTarget(null)
    setClimbing(false)
    setShowExploreOnboarding(true)
    requestWorldRender()
  }

  const returnToTour = () => {
    if (document.pointerLockElement) document.exitPointerLock()
    setExploreLocked(false)
    setExploreTarget(null)
    setMenuTarget(null)
    setClimbing(false)
    rememberExperienceMode('tour')
    setExperienceMode('tour')
    requestAnimationFrame(() => travelTo(0.2))
  }

  const setVirtualMove = (code, active) => {
    window.dispatchEvent(new CustomEvent('explore-move', { detail: { code, active } }))
  }

  const menuShelf = menuTarget ? {
    ...menuTarget,
    name: shelfNameFor(menuTarget.shelfId),
    bookCount: libraryBooks.filter((book) => book.shelfId === menuTarget.shelfId).length,
    hasLadder: ladderPlacement?.shelfId === menuTarget.shelfId,
    books: libraryBooks.filter((book) => book.shelfId === menuTarget.shelfId).map(({ file, ...book }) => book),
  } : null

  const sceneBooks = useMemo(() => libraryBooks.map(({ file, ...book }) => book), [libraryBooks])

  const search = (event) => {
    event.preventDefault()
    if (!searchValue.trim()) return
    const query = searchValue.toLowerCase()
    if (query.includes('dragon') || query.includes('creature')) {
      setSearchResult('Creatures of the Old World · east gallery')
      travelTo(0.72)
    } else if (query.includes('star') || query.includes('sky') || query.includes('astr')) {
      setSearchResult('The Night Sky · upper astronomy shelf')
      travelTo(0.88)
    } else {
      setSearchResult('The catalogue whispers of no exact match.')
    }
  }

  return (
    <main className={`experience ${exploring ? 'is-exploring' : ''}`}>
      {showLoader && <LoadingScreen ready={ready} />}
      <div className="world" aria-label="Interactive three-dimensional library">
        <LibraryCanvas progress={progress} pointer={pointer} perfInteraction={perfInteraction} benchmarkMode={benchmarkMode} exploreEnabled={exploring} explorePaused={Boolean(menuTarget || bookOpen)} onExploreLockChange={onExploreLockChange} onExploreTargetChange={setExploreTarget} onExploreInteract={handleExploreInteract} focusedTarget={exploreTarget} libraryBooks={sceneBooks} ladderPlacement={ladderPlacement} climbing={climbing} onDismount={() => setClimbing(false)} onPrepared={onScenePrepared} />
      </div>
      <div className="grain" />

      {!bookOpen && <header className="topbar">
        {exploring && <button className="tour-return" onClick={returnToTour}><span aria-hidden="true">←</span> Guided tour</button>}
        {!exploring && <SoundToggle />}
      </header>}

      <section className={`hero ${displayProgress > 0.13 || exploring ? 'is-past' : ''}`}>
        <h1><span>The</span> Library</h1>
        <div className="hero__actions">
          <button className="brass-button" onClick={() => travelTo(0.2)}>Guided tour</button>
          <button className="explore-button" onClick={enterExplore}>Explore freely <span aria-hidden="true">→</span></button>
        </div>
      </section>

      <aside className={`index ${displayProgress > 0.11 && !bookOpen && !exploring ? 'is-visible' : ''}`}>
        <p className="index__title">The Library</p>
        <nav aria-label="Library locations">
          {chapters.map((chapter) => (
            <button key={chapter.id} className={activeChapter === chapter.id ? 'is-active' : ''} onClick={() => travelTo(chapter.stop)}>
              <span>{chapter.number}</span>{chapter.title}
            </button>
          ))}
        </nav>
      </aside>

      <div className={`chapter-copy chapter-copy--hall ${!exploring && displayProgress > 0.2 && displayProgress < 0.27 ? 'is-visible' : ''}`}>
        <span>Beyond the threshold</span><h2>The Great Nave</h2><p>Every aisle remembers a different century.</p>
      </div>
      <div className={`chapter-copy chapter-copy--astronomy ${!exploring && displayProgress > 0.54 && displayProgress < 0.6 ? 'is-visible' : ''}`}>
        <span>The western galleries</span><h2>Natural Philosophy</h2><p>Specimens, old theories, and the quiet machinery of nature.</p>
      </div>
      <div className={`discovery ${!exploring && displayProgress > 0.93 && displayProgress < 0.995 && !bookOpen ? 'is-visible' : ''}`}>
        <span>Upper shelf · Volume III</span>
        <h2>The Night Sky</h2>
        <p>A treatise on celestial magic</p>
        <button className="brass-button" onClick={() => setBookOpen(true)}>Open the Manuscript</button>
      </div>

      <button className={`search-toggle ${!exploring && displayProgress > 0.18 && !bookOpen ? 'is-visible' : ''}`} onClick={() => setSearchOpen(!searchOpen)} aria-expanded={searchOpen}>
        <i /> Search the catalogue
      </button>
      <form className={`search-panel ${searchOpen && !exploring ? 'is-open' : ''}`} onSubmit={search}>
        <label htmlFor="catalogue-search">What are you looking for?</label>
        <div><input id="catalogue-search" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Try “dragons”" autoComplete="off" /><button>Find</button></div>
        {searchResult && <p>{searchResult}</p>}
      </form>

      {!exploring && <div className="journey-progress"><i style={{ transform: `scaleX(${displayProgress})` }} /></div>}
      {!exploring && <p className={`location ${displayProgress > 0.13 ? 'is-visible' : ''}`}>{chapters.find((chapter) => chapter.id === activeChapter)?.title}</p>}

      {exploring && !bookOpen && <ExploreInterface showOnboarding={showExploreOnboarding} needsShelfTutorial={!shelfTutorialComplete} exploreLocked={exploreLocked} target={exploreTarget} shelfName={exploreTarget?.shelfId ? shelfNameFor(exploreTarget.shelfId) : ''} menuShelf={menuShelf} climbing={climbing} uploadState={uploadState} onCloseMenu={closeExploreMenu} onRename={renameShelf} onOpenBook={openBookFromCatalogue} onSummonLadder={summonLadder} onFile={uploadBook} onRemoveBook={removeBook} onMoveBookRow={moveBookToRow} onDismount={() => setClimbing(false)} setVirtualMove={setVirtualMove} />}

      <Manuscript open={bookOpen} book={activeBook} onClose={() => { setBookOpen(false); setActiveBook(null) }} />
      <div className="scroll-space" aria-hidden="true" />
    </main>
  )
}
