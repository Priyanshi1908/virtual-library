const normalizeText = (value) => value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()

export async function openPdf(file) {
  const [pdfModule, workerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfModule.GlobalWorkerOptions.workerSrc = workerModule.default
  const data = await file.arrayBuffer()
  const pdfDocument = await pdfModule.getDocument({ data }).promise
  return {
    kind: 'pdf',
    pageCount: pdfDocument.numPages,
    async renderPage(pageNumber, width = 920) {
      if (pageNumber < 1 || pageNumber > pdfDocument.numPages) return null
      const page = await pdfDocument.getPage(pageNumber)
      const initial = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: width / initial.width })
      const canvas = window.document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const context = canvas.getContext('2d', { alpha: false })
      await page.render({ canvasContext: context, viewport, background: '#c7ae7b' }).promise
      return canvas.toDataURL('image/jpeg', 0.9)
    },
    destroy: () => pdfDocument.destroy(),
  }
}

const yieldToBrowser = () => new Promise((resolve) => window.setTimeout(resolve, 0))

export async function openEpub(file, { onProgress } = {}) {
  const { BlobReader, TextWriter, ZipReader } = await import('@zip.js/zip.js')
  const reader = new ZipReader(new BlobReader(file))
  try {
    onProgress?.('Reading the binding…')
    const entries = await reader.getEntries()
    const entryMap = new Map(entries.map((entry) => [entry.filename, entry]))
    const readText = async (path) => {
      const entry = entryMap.get(path)
      if (!entry) throw new Error(`Missing EPUB resource: ${path}`)
      return entry.getData(new TextWriter())
    }
    const container = new DOMParser().parseFromString(await readText('META-INF/container.xml'), 'application/xml')
    const packagePath = container.querySelector('rootfile')?.getAttribute('full-path')
    if (!packagePath) throw new Error('This EPUB has no package document.')
    const packageDocument = new DOMParser().parseFromString(await readText(packagePath), 'application/xml')
    const packageDirectory = packagePath.includes('/') ? packagePath.slice(0, packagePath.lastIndexOf('/') + 1) : ''
    const resolvePath = (href) => {
      const parts = `${packageDirectory}${decodeURIComponent(href.split('#')[0])}`.split('/')
      const resolved = []
      parts.forEach((part) => {
        if (!part || part === '.') return
        if (part === '..') resolved.pop()
        else resolved.push(part)
      })
      return resolved.join('/')
    }
    const manifest = new Map([...packageDocument.querySelectorAll('manifest item')].map((item) => [item.getAttribute('id'), item.getAttribute('href')]))
    const spinePaths = [...packageDocument.querySelectorAll('spine itemref')]
      .map((item) => manifest.get(item.getAttribute('idref')))
      .filter(Boolean)
      .map(resolvePath)
    const title = packageDocument.querySelector('metadata title, metadata dc\\:title')?.textContent?.trim() || ''
    const chapterTexts = []
    for (let index = 0; index < spinePaths.length; index += 1) {
      const path = spinePaths[index]
      const markup = await readText(path)
      const document = new DOMParser().parseFromString(markup, 'text/html')
      document.querySelectorAll('script,style,nav').forEach((node) => node.remove())
      document.querySelectorAll('p,h1,h2,h3,h4,blockquote,li').forEach((node) => node.append('\n\n'))
      const text = normalizeText(document.body?.textContent || '')
      if (text) chapterTexts.push(text)
      if (index % 4 === 3) {
        onProgress?.(`Preparing chapter ${index + 1} of ${spinePaths.length}…`)
        // Large EPUBs previously monopolised the main thread here and made the
        // WebGL scene appear to have crashed. Give input and paint a turn.
        await yieldToBrowser()
      }
    }
    const text = normalizeText(chapterTexts.join('\n\n'))
    if (!text) throw new Error('No readable chapters were found in this EPUB.')
    return { kind: 'epub', title, text }
  } finally {
    await reader.close()
  }
}
