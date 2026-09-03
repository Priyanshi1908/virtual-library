import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { manuscriptPages } from '../data/library'
import { openEpub, openPdf } from '../bookReaders'
import { cue } from '../uiSound'

const splitParagraphs = (text) => text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)

function readerPageSize() {
  const narrow = window.matchMedia('(max-width: 900px)').matches
  const availableHeight = Math.max(420, window.innerHeight - (narrow ? 150 : 136))
  const shellWidth = narrow
    ? Math.min(window.innerWidth * .91, availableHeight * 1.58)
    : Math.min(1080, window.innerWidth * .82, availableHeight * 1.58)
  const pageWidth = (shellWidth - 56) / 2
  return {
    width: pageWidth,
    // react-pageflip preserves the physical 540×683 leaf ratio inside the
    // leather shell. Paginate against that real leaf, not the larger cover.
    height: pageWidth * (683 / 540),
  }
}

function createPaginationProbe({ width, height }) {
  const page = document.createElement('article')
  page.className = 'page page--uploaded epub-pagination-probe'
  page.style.width = `${width}px`
  page.style.height = `${height}px`
  const frame = document.createElement('div')
  frame.className = 'page__frame'
  const eyebrow = document.createElement('span')
  eyebrow.className = 'page__eyebrow'
  const body = document.createElement('div')
  body.className = 'page__body'
  frame.append(eyebrow, body)
  page.append(frame)
  document.body.append(page)
  return { page, frame, eyebrow, body }
}

function renderProbe(probe, paragraphs, eyebrow) {
  probe.eyebrow.textContent = eyebrow || ''
  probe.eyebrow.hidden = !eyebrow
  probe.body.replaceChildren(...paragraphs.map((text) => {
    const paragraph = document.createElement('p')
    paragraph.textContent = text
    return paragraph
  }))
  const frameBounds = probe.frame.getBoundingClientRect()
  const bodyBounds = probe.body.getBoundingClientRect()
  const eyebrowBounds = probe.eyebrow.hidden ? null : probe.eyebrow.getBoundingClientRect()
  const contentBottom = Math.max(bodyBounds.bottom, eyebrowBounds?.bottom || 0)
  // The frame itself is deliberately page-height, so its scrollHeight cannot
  // tell us whether prose fits. Measure the rendered content instead and keep
  // a protected strip for the folio and the paper's lower optical margin.
  return contentBottom <= frameBounds.bottom - 30
}

export function paginateEpubText(text, firstEyebrow) {
  const probe = createPaginationProbe(readerPageSize())
  const source = splitParagraphs(text)
  const pages = []
  let current = []

  const fits = (paragraphs) => renderProbe(probe, paragraphs, pages.length === 0 ? firstEyebrow : '')
  const commit = () => {
    if (!current.length) return
    pages.push(current.join('\n\n'))
    current = []
  }

  try {
    source.forEach((paragraph) => {
      let words = paragraph.split(/\s+/).filter(Boolean)
      while (words.length) {
        if (fits([...current, words.join(' ')])) {
          current.push(words.join(' '))
          words = []
          continue
        }

        let low = 0
        let high = words.length
        while (low < high) {
          const middle = Math.ceil((low + high) / 2)
          if (fits([...current, words.slice(0, middle).join(' ')])) low = middle
          else high = middle - 1
        }

        if (low > 0) {
          current.push(words.slice(0, low).join(' '))
          words = words.slice(low)
          commit()
        } else if (current.length) {
          commit()
        } else {
          // A single unbroken token may be wider than the page. Preserve it so
          // content is never dropped, and let overflow-wrap handle the token.
          current.push(words.shift())
          commit()
        }
      }
    })
    commit()
    return pages
  } finally {
    probe.page.remove()
  }
}

function createIncrementalEpubPaginator(text, firstEyebrow) {
  const probe = createPaginationProbe(readerPageSize())
  const source = splitParagraphs(text)
  const pages = []
  let paragraphIndex = 0
  let remainingWords = []
  let disposed = false
  let pending = Promise.resolve()

  const fits = (paragraphs) => renderProbe(probe, paragraphs, pages.length === 0 ? firstEyebrow : '')
  const nextPage = () => {
    const current = []
    while (paragraphIndex < source.length || remainingWords.length) {
      if (!remainingWords.length) remainingWords = source[paragraphIndex++].split(/\s+/).filter(Boolean)
      const wholeParagraph = remainingWords.join(' ')
      if (fits([...current, wholeParagraph])) {
        current.push(wholeParagraph)
        remainingWords = []
        continue
      }

      let low = 0
      let high = remainingWords.length
      while (low < high) {
        const middle = Math.ceil((low + high) / 2)
        if (fits([...current, remainingWords.slice(0, middle).join(' ')])) low = middle
        else high = middle - 1
      }
      if (low > 0) {
        current.push(remainingWords.slice(0, low).join(' '))
        remainingWords = remainingWords.slice(low)
      } else if (!current.length) {
        current.push(remainingWords.shift())
      }
      break
    }
    return current.join('\n\n')
  }

  const hasMore = () => paragraphIndex < source.length || remainingWords.length > 0
  const ensure = (targetCount) => {
    pending = pending.then(async () => {
      while (!disposed && pages.length < targetCount && hasMore()) {
        const body = nextPage()
        if (body) pages.push({ kind: 'uploaded', eyebrow: pages.length === 0 ? firstEyebrow : '', body })
        if (pages.length % 3 === 0) await new Promise((resolve) => window.setTimeout(resolve, 0))
      }
      if (!hasMore() && !disposed) probe.page.remove()
      return [...pages]
    })
    return pending
  }

  return {
    ensure,
    hasMore,
    get count() { return pages.length },
    dispose() { disposed = true; probe.page.remove() },
  }
}

const Page = forwardRef(function Page({ page, number, side }, ref) {
  return (
    <article className={`page page--${page.kind || 'text'}${side ? ` --${side} --simple` : ''}`} ref={ref}>
      <div className="page__foxing" />
      <div className="page__frame">
        {page.eyebrow && <span className="page__eyebrow">{page.eyebrow}</span>}
        {page.title && <h3>{page.title}</h3>}
        {page.subtitle && <p className="page__subtitle">{page.subtitle}</p>}
        {page.body && <div className="page__body">{page.body.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>}
        {(page.kind === 'constellation' || page.kind === 'map') && <StarChart variant={page.kind} />}
        {page.detail && <p className="page__detail">{page.detail}</p>}
        {page.note && <p className="page__note">{page.note}</p>}
        <span className="page__number">{number + 1}</span>
      </div>
    </article>
  )
})

const EmptyPage = forwardRef(function EmptyPage({ side }, ref) {
  return <article className={`page page--empty page--${side}`} aria-hidden="true" ref={ref} />
})

function BookSpread({ pages, flipBookRef, onFlip, onStateChange }) {
  const renderedPages = pages.map((page, index) => <Page page={page} number={index} key={`${index}-${page.kind || 'text'}`} />)
  if (renderedPages.length % 2) renderedPages.push(<EmptyPage side="right" key="reader-final-empty" />)

  return (
    <HTMLFlipBook
      ref={flipBookRef}
      className="book-spread"
      width={540}
      height={683}
      size="stretch"
      minWidth={280}
      maxWidth={540}
      minHeight={354}
      maxHeight={683}
      usePortrait={false}
      startPage={0}
      drawShadow
      maxShadowOpacity={0.58}
      flippingTime={760}
      showCover={false}
      showPageCorners={false}
      renderOnlyPageLengthChange
      mobileScrollSupport
      clickEventForward
      useMouseEvents={false}
      swipeDistance={28}
      onFlip={onFlip}
      onChangeState={onStateChange}
    >
      {renderedPages}
    </HTMLFlipBook>
  )
}

function StarChart({ variant }) {
  return (
    <svg className="star-chart" viewBox="0 0 260 190" aria-label={`${variant} illustration`}>
      <circle cx="130" cy="95" r="78" /><circle cx="130" cy="95" r="54" />
      <path d="M52 104 L82 55 L118 83 L151 39 L187 70 L204 126 L164 150 L104 142 L52 104" />
      {[[52,104],[82,55],[118,83],[151,39],[187,70],[204,126],[164,150],[104,142],[130,95]].map(([x,y], index) => <circle key={index} cx={x} cy={y} r={index === 8 ? 4 : 2.3} className="star-chart__star" />)}
      {variant === 'map' && <><path d="M130 17 V173 M52 95 H208" /><circle cx="130" cy="95" r="24" /></>}
    </svg>
  )
}

function ReaderState({ status, message }) {
  return (
    <div className={`reader-state reader-state--${status}`} role={status === 'error' ? 'alert' : 'status'}>
      <i aria-hidden="true" />
      <span>{status === 'loading' ? 'Opening the volume' : 'The volume remains closed'}</span>
      <p>{message}</p>
    </div>
  )
}

function PdfSpread({ reader }) {
  const [spread, setSpread] = useState(1)
  const [images, setImages] = useState([null, null])
  const [turning, setTurning] = useState('')
  const pageCount = reader.pageCount

  useEffect(() => {
    let active = true
    setImages([null, null])
    Promise.all([reader.renderPage(spread), reader.renderPage(spread + 1)]).then((result) => { if (active) setImages(result) })
    return () => { active = false }
  }, [reader, spread])

  const move = (direction) => {
    const lastSpread = pageCount % 2 ? pageCount : Math.max(1, pageCount - 1)
    const next = Math.max(1, Math.min(lastSpread, spread + direction * 2))
    if (next === spread) return
    cue('page', .38)
    setTurning(direction > 0 ? 'is-turning-forward' : 'is-turning-back')
    // Swap the spread in the same render that starts the turn. Keeping the old
    // images around for an artificial delay caused a one-frame text ghost.
    setImages([null, null])
    setSpread(next)
    window.setTimeout(() => setTurning(''), 260)
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') move(1)
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') move(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <>
      <div className={`pdf-spread ${turning}`} onClick={(event) => move(event.clientX < event.currentTarget.getBoundingClientRect().left + event.currentTarget.clientWidth / 2 ? -1 : 1)}>
        {[0, 1].map((offset) => (
          <article className="pdf-page" key={`${spread}-${offset}`}>
            <div className="page__foxing" />
            {images[offset] ? <img src={images[offset]} alt={`Page ${spread + offset}`} /> : spread + offset <= pageCount && <span className="pdf-page__loading">Dusting page {spread + offset}…</span>}
          </article>
        ))}
      </div>
      <div className="manuscript__controls">
        <button onClick={() => move(-1)} disabled={spread === 1} aria-label="Previous pages"><kbd>A</kbd><span>Previous</span></button>
        <span>Pages {spread}–{Math.min(pageCount, spread + 1)} of {pageCount}</span>
        <button onClick={() => move(1)} disabled={spread + 1 >= pageCount} aria-label="Next pages"><span>Next</span><kbd>D</kbd></button>
      </div>
    </>
  )
}

export default function Manuscript({ open, book, onClose }) {
  const pdfReader = useRef(null)
  const epubPaginator = useRef(null)
  const epubExtension = useRef(null)
  const flipBookRef = useRef(null)
  const bookFlipping = useRef(false)
  const backwardTimer = useRef(null)
  const [reader, setReader] = useState({ status: 'idle', kind: 'static', pages: manuscriptPages })
  const [currentPage, setCurrentPage] = useState(0)
  const [turning, setTurning] = useState(null)
  const [backwardTurn, setBackwardTurn] = useState(null)
  const closeReader = useCallback(() => { cue('close', .38); onClose() }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const lockedScroll = { x: window.scrollX, y: window.scrollY }
    const blockScrollInput = (event) => event.preventDefault()
    const holdScrollPosition = () => {
      if (window.scrollX !== lockedScroll.x || window.scrollY !== lockedScroll.y) window.scrollTo(lockedScroll.x, lockedScroll.y)
    }
    const previousOverflow = document.body.style.overflow
    const previousOverscroll = document.body.style.overscrollBehavior
    const previousRootOverflow = document.documentElement.style.overflow
    const previousRootOverscroll = document.documentElement.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    window.addEventListener('wheel', blockScrollInput, { capture: true, passive: false })
    window.addEventListener('touchmove', blockScrollInput, { capture: true, passive: false })
    window.addEventListener('scroll', holdScrollPosition, { passive: true })
    return () => {
      window.removeEventListener('wheel', blockScrollInput, true)
      window.removeEventListener('touchmove', blockScrollInput, true)
      window.removeEventListener('scroll', holdScrollPosition)
      document.body.style.overflow = previousOverflow
      document.body.style.overscrollBehavior = previousOverscroll
      document.documentElement.style.overflow = previousRootOverflow
      document.documentElement.style.overscrollBehavior = previousRootOverscroll
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    let active = true
    if (!book) {
      setReader({ status: 'ready', kind: 'static', pages: manuscriptPages })
      return undefined
    }
    if (!book.file) {
      setReader({ status: 'error', kind: book.format, message: 'The locally stored file could not be recovered. Remove it and add the volume again.' })
      return undefined
    }
    setReader({ status: 'loading', kind: book.format, message: `Preparing ${book.title} without sending it anywhere.` })
    const load = async () => {
      try {
        if (book.format === 'pdf') {
          const result = await openPdf(book.file)
          if (!active) { result.destroy(); return }
          pdfReader.current = result
          setReader({ status: 'ready', ...result })
        } else if (book.format === 'epub') {
          const result = await openEpub(book.file, {
            onProgress: (message) => {
              if (active) setReader((current) => current.status === 'loading' ? { ...current, message } : current)
            },
          })
          if (!active) return
          // A blocked webfont request must never hold the entire reader hostage.
          await Promise.race([
            document.fonts?.ready || Promise.resolve(),
            new Promise((resolve) => window.setTimeout(resolve, 700)),
          ])
          const paginator = createIncrementalEpubPaginator(result.text, book.title)
          epubPaginator.current = paginator
          // Mount one small, complete batch so the physical book can appear
          // immediately. Later batches are prepared just before they are read.
          const contentPages = await paginator.ensure(7)
          if (!active) { paginator.dispose(); return }
          const pages = [
            { kind: 'cover', eyebrow: 'From the private collection', title: result.title || book.title, subtitle: 'A volume kept in The Library' },
            ...contentPages,
            ...(!paginator.hasMore() ? [{ kind: 'cover', eyebrow: 'Finis', title: book.title, subtitle: 'Return this volume to its shelf' }] : []),
          ]
          setReader({ status: 'ready', kind: 'epub', pages, hasMore: paginator.hasMore(), title: book.title })
        } else throw new Error('Only PDF and EPUB volumes can be opened here.')
      } catch (error) {
        if (active) setReader({ status: 'error', kind: book.format, message: error?.message || 'This volume could not be read.' })
      }
    }
    load()
    return () => {
      active = false
      pdfReader.current?.destroy?.()
      pdfReader.current = null
      epubPaginator.current?.dispose?.()
      epubPaginator.current = null
      epubExtension.current = null
    }
  }, [book, open])

  useEffect(() => {
    window.clearTimeout(backwardTimer.current)
    bookFlipping.current = false
    setTurning(null)
    setBackwardTurn(null)
    if (open) setCurrentPage(0)
  }, [book, open])

  useEffect(() => () => window.clearTimeout(backwardTimer.current), [])

  const pages = useMemo(() => reader.pages || [], [reader.pages])

  const extendEpub = useCallback((pageIndex) => {
    const paginator = epubPaginator.current
    if (!paginator?.hasMore() || epubExtension.current || pageIndex < paginator.count - 5) return
    epubExtension.current = paginator.ensure(paginator.count + 12)
      .then((contentPages) => {
        setReader((current) => {
          if (current.kind !== 'epub') return current
          const nextPages = [
            current.pages[0],
            ...contentPages,
            ...(!paginator.hasMore() ? [{ kind: 'cover', eyebrow: 'Finis', title: current.title, subtitle: 'Return this volume to its shelf' }] : []),
          ]
          return { ...current, pages: nextPages, hasMore: paginator.hasMore() }
        })
      })
      .finally(() => { epubExtension.current = null })
  }, [])

  const moveBook = useCallback((direction) => {
    if (reader.kind === 'pdf') return
    if (bookFlipping.current) return
    const lastSpread = Math.max(0, Math.floor((pages.length - 1) / 2) * 2)
    const next = Math.max(0, Math.min(lastSpread, currentPage + direction * 2))
    if (next === currentPage) return
    cue('page', .38)
    setTurning(direction > 0 ? 'is-turning-forward' : 'is-turning-back')
    const pageFlip = flipBookRef.current?.pageFlip()
    if (direction > 0) pageFlip?.flipNext('top')
    else {
      if (!pageFlip) return
      bookFlipping.current = true
      let completed = false
      const complete = () => {
        if (completed) return
        completed = true
        window.clearTimeout(backwardTimer.current)
        pageFlip.turnToPrevPage()
        setBackwardTurn(null)
        setTurning(null)
        bookFlipping.current = false
      }
      setBackwardTurn({
        front: pages[currentPage],
        back: pages[next + 1],
        under: pages[next],
        frontNumber: currentPage,
        backNumber: next + 1,
        underNumber: next,
        complete,
      })
      window.clearTimeout(backwardTimer.current)
      // The animation event performs the page swap after the landing frame is
      // painted. This timeout is only a guard for browsers that suppress it.
      backwardTimer.current = window.setTimeout(complete, 900)
    }
  }, [currentPage, pages, reader.kind])

  const turnFromPageClick = useCallback((event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    moveBook(event.clientX < bounds.left + bounds.width / 2 ? -1 : 1)
  }, [moveBook])

  const onBookFlip = useCallback((event) => {
    const pageIndex = Math.max(0, Number(event.data) || 0)
    setCurrentPage(pageIndex - (pageIndex % 2))
    extendEpub(pageIndex)
  }, [extendEpub])

  const onBookStateChange = useCallback((event) => {
    bookFlipping.current = event.data === 'flipping'
    if (event.data === 'read') setTurning(null)
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (!open) return
      if (event.key === 'Escape' && !event.repeat) closeReader()
      if (reader.kind !== 'pdf' && (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd')) moveBook(1)
      if (reader.kind !== 'pdf' && (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a')) moveBook(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeReader, moveBook, open, reader.kind])

  return (
    <div className={`manuscript ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="reader-environment" aria-hidden="true" />
      <button type="button" className="manuscript__close" onClick={closeReader} aria-label="Close manuscript"><kbd>Esc</kbd> Put down</button>
      <div className="manuscript__light" />
      {reader.status === 'loading' && <ReaderState status="loading" message={reader.message} />}
      {reader.status === 'error' && <ReaderState status="error" message={reader.message} />}
      {reader.status === 'ready' && reader.kind === 'pdf' && <PdfSpread reader={reader} />}
      {reader.status === 'ready' && reader.kind !== 'pdf' && (
        <>
          <div className={`book-shell ${turning || ''}`} onClick={turnFromPageClick}>
            <i className="book-page-block book-page-block--left" aria-hidden="true" />
            <i className="book-page-block book-page-block--right" aria-hidden="true" />
            <BookSpread pages={pages} flipBookRef={flipBookRef} onFlip={onBookFlip} onStateChange={onBookStateChange} />
            {backwardTurn && (
              <div className="backward-turn" aria-hidden="true">
                <div className="backward-turn__under">
                  <Page page={backwardTurn.under} number={backwardTurn.underNumber} side="left" />
                </div>
                <div
                  className="backward-turn__leaf"
                  onAnimationEnd={(event) => {
                    if (event.target === event.currentTarget) backwardTurn.complete()
                  }}
                >
                  <div className="backward-turn__face backward-turn__face--front">
                    <Page page={backwardTurn.front} number={backwardTurn.frontNumber} side="left" />
                  </div>
                  <div className="backward-turn__face backward-turn__face--back">
                    <Page page={backwardTurn.back} number={backwardTurn.backNumber} side="right" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="manuscript__controls">
            <button onClick={() => moveBook(-1)} disabled={currentPage <= 0} aria-label="Previous pages"><kbd>A</kbd><span>Previous</span></button>
            <span>{reader.kind === 'epub' && reader.hasMore ? `Page ${currentPage + 1}` : `${Math.min(Math.floor(currentPage / 2) + 1, Math.ceil(pages.length / 2))} / ${Math.ceil(pages.length / 2)}`}</span>
            <button onClick={() => moveBook(1)} disabled={currentPage >= pages.length - 2} aria-label="Next pages"><span>Next</span><kbd>D</kbd></button>
          </div>
        </>
      )}
    </div>
  )
}
