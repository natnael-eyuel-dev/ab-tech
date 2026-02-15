"use client"

import { useCallback, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    pdfjsLib?: any
  }
}

type Props = {
  url: string
}

let pdfjsInitialized = false

const PDFJS_VERSION = '3.11.174'

const ensurePdfJs = async () => {
  if (pdfjsInitialized) return true
  if (typeof window === 'undefined') return false

  // If already loaded globally
  if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
    pdfjsInitialized = true
    return true
  }

  // Inject core script (add crossorigin for better caching behavior)
  await injectScript(`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`)
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`
    pdfjsInitialized = true
    return true
  }
  return false
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src='${src}']`)) {
      resolve(); return
    }
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.crossOrigin = 'anonymous'
    el.onload = () => resolve()
    el.onerror = (e) => reject(new Error(`Failed to load script ${src}`))
    document.head.appendChild(el)
  })
}
export default function PdfViewerClient({ url }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [pdf, setPdf] = useState<any>(null)
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [autoFit, setAutoFit] = useState(true)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<number[]>([])
  const [activeMatchIdx, setActiveMatchIdx] = useState(0)
  const [initializationError, setInitializationError] = useState<string | null>(null)
  const [pdfReady, setPdfReady] = useState(false)
  const textCache = useRef<Map<number, string>>(new Map())

  // Initialize PDF.js on component mount (and set reactive ready flag)
  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const ok = await ensurePdfJs()
        if (mounted && ok) {
          setInitializationError(null)
          setPdfReady(true)
        }
      } catch (error: any) {
        console.error('PDF.js initialization failed:', error)
        if (mounted) {
          setInitializationError(error?.message || 'Failed to initialize PDF library')
        }
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  // Hint the browser to establish early connections to CDNs/Cloudinary
  useEffect(() => {
    const links: HTMLLinkElement[] = []
    const add = (href: string) => {
      if (document.querySelector(`link[rel='preconnect'][href='${href}']`)) return
      const l = document.createElement('link')
      l.rel = 'preconnect'
      l.href = href
      l.crossOrigin = ''
      document.head.appendChild(l)
      links.push(l)
    }
    add('https://cdnjs.cloudflare.com')
    add('https://res.cloudinary.com')
    return () => { links.forEach(l => l.remove()) }
  }, [])

  // Load PDF document
  useEffect(() => {
    if (!url || initializationError || !pdfReady) return
    let cancelled = false
    const loadPdfDocument = async () => {
      if (!window.pdfjsLib) return
      setLoading(true)
      try {
        const loadingTask = window.pdfjsLib.getDocument({
          url,
          withCredentials: false,
          // Encourage chunked range loading when server supports it
          rangeChunkSize: 64 * 1024,
          disableAutoFetch: false,
          disableStream: false,
        })
        const doc = await loadingTask.promise
        if (!cancelled) {
          setPdf(doc)
          setNumPages(doc.numPages)
          setPageNum(1)
          setLoading(false)
        }
      } catch (e: any) {
        console.error('PDF document load error', e)
        if (!cancelled) {
          setPdf(null)
          setNumPages(0)
          setPageNum(1)
          setLoading(false)
          setInitializationError(`Failed to load PDF: ${e.message}`)
        }
      }
    }
    loadPdfDocument()
    return () => { cancelled = true }
  }, [url, initializationError, pdfReady])

  // Render PDF page (with auto-fit logic)
  useEffect(() => {
  if (!pdf || !canvasRef.current || loading) return

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNum)
        let targetScale = scale
        // Auto-fit width to container if enabled
        if (autoFit && containerRef.current) {
          const baseViewport = page.getViewport({ scale: 1 })
          const available = containerRef.current.clientWidth - 32 // padding allowance
          if (available > 0) {
            targetScale = Math.min(3, available / baseViewport.width)
          }
        }
        const viewport = page.getViewport({ scale: targetScale })
        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        // Set canvas dimensions
  canvas.height = viewport.height
  canvas.width = viewport.width
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Render PDF page
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        }
        
        await page.render(renderContext).promise
      } catch (error) {
        console.error('Error rendering PDF page:', error)
      }
    }

    renderPage()
  }, [pdf, pageNum, scale, loading, autoFit])

  // Resize observer to trigger re-render when container width changes (auto-fit only)
  useEffect(() => {
    if (!autoFit) return
    const el = containerRef.current
    if (!el) return
    let raf: number | null = null
    const ro = new ResizeObserver(() => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // Force re-render by nudging scale state (without disabling autoFit)
        setScale(s => s) // triggers effect dependencies indirectly via autoFit retained
      })
    })
    ro.observe(el)
    return () => { ro.disconnect(); if (raf) cancelAnimationFrame(raf) }
  }, [autoFit])

  // Fetch page text for search
  const getPageText = useCallback(async (p: number) => {
  if (!pdf) return ''
    if (textCache.current.has(p)) return textCache.current.get(p)!
    
    try {
  const page = await pdf.getPage(p)
      const textContent = await page.getTextContent()
      const text = textContent.items.map((it: any) => it.str).join(' ')
      textCache.current.set(p, text)
      return text
    } catch (error) {
      console.error(`Error getting text for page ${p}:`, error)
      return ''
    }
  }, [pdf])

  // Search functionality
  useEffect(() => {
    let cancelled = false
    
    const performSearch = async () => {
      if (!query.trim() || !pdf) { 
        setMatches([])
        setActiveMatchIdx(0)
        return 
      }
      
      const found: number[] = []
      for (let p = 1; p <= pdf.numPages; p++) {
        const text = await getPageText(p)
        if (cancelled) return
        if (text.toLowerCase().includes(query.toLowerCase())) {
          found.push(p)
        }
      }
      
      if (!cancelled) {
        setMatches(found)
        setActiveMatchIdx(0)
        if (found.length) setPageNum(found[0])
      }
    }

    performSearch()
    
    return () => { cancelled = true }
  }, [query, pdf, getPageText])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return
      
      switch (e.key) {
        case 'ArrowRight':
          setPageNum(p => Math.min(numPages, p + 1))
          break
        case 'ArrowLeft':
          setPageNum(p => Math.max(1, p - 1))
          break
        case '+':
          setScale(s => Math.min(3, s + 0.25))
          break
        case '-':
          setScale(s => Math.max(0.5, s - 0.25))
          break
        case 'f':
          const inp = document.getElementById('pdf-search-input') as HTMLInputElement | null
          inp?.focus()
          break
        case 'Enter':
          if (matches.length) {
            setActiveMatchIdx(i => {
              const next = (i + 1) % matches.length
              setPageNum(matches[next])
              return next
            })
          }
          break
      }
    }
    
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [matches, numPages])

  const activeMatchPage = matches[activeMatchIdx]

  // Show initialization error
  if (initializationError) {
    return (
      <div className="p-4 text-sm text-red-600 border border-red-200 rounded bg-red-50">
        <div className="font-medium">PDF Viewer Error</div>
        <div className="text-xs mt-1">{initializationError}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reload Page
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs sm:text-sm">
        <button 
          className="px-2 py-1 border rounded disabled:opacity-50" 
          onClick={() => { setAutoFit(false); setScale(s => Math.max(0.5, s - 0.25)) }}
          disabled={loading}
        >
          -
        </button>
        <span>{Math.round(scale * 100)}%</span>
        <button 
          className="px-2 py-1 border rounded disabled:opacity-50" 
          onClick={() => { setAutoFit(false); setScale(s => Math.min(3, s + 0.25)) }}
          disabled={loading}
        >
          +
        </button>
        <button
          className="ml-2 px-2 py-1 border rounded disabled:opacity-50 text-[11px]"
          onClick={() => { setAutoFit(true); setScale(1) }}
          disabled={loading || autoFit}
        >Auto-Fit
        </button>
        
        <input
          className="ml-3 w-24 px-2 py-1 border rounded disabled:opacity-50"
          value={pageNum}
          onChange={e => {
            const v = Number(e.target.value)
            if (!Number.isNaN(v)) setPageNum(Math.min(Math.max(1, v), numPages || 1))
          }}
          disabled={loading}
        />
        
        <div className="flex items-center gap-1 ml-2">
          <input
            id="pdf-search-input"
            placeholder="Search (f)"
            className="w-32 px-2 py-1 border rounded disabled:opacity-50"
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={loading}
          />
          {query && (
            <span className="text-muted-foreground text-[11px]">
              {matches.length ? `${activeMatchIdx+1}/${matches.length} p${activeMatchPage}` : '0 matches'}
            </span>
          )}
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <button 
            className="px-2 py-1 border rounded disabled:opacity-50" 
            onClick={() => setPageNum(p => Math.max(1, p - 1))}
            disabled={loading || pageNum <= 1}
          >
            Prev
          </button>
          <span>{pageNum} / {numPages}</span>
          <button 
            className="px-2 py-1 border rounded disabled:opacity-50" 
            onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
            disabled={loading || pageNum >= numPages}
          >
            Next
          </button>
        </div>
      </div>
      
      <div ref={containerRef} className="overflow-auto border rounded bg-background dark:bg-neutral-900 min-h-[500px]">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground animate-pulse flex items-center justify-center h-64">
            {pdf ? `Loading page ${pageNum}...` : 'Loading PDF document...'}
          </div>
        ) : (
          <canvas ref={canvasRef} className="block mx-auto max-w-full h-auto" />
        )}
      </div>
      
      <div className="mt-2 text-[10px] text-muted-foreground">
        <strong>Shortcuts:</strong> ←/→ pages • +/- zoom • f focus search • Enter next match • Auto-Fit to re-enable responsive width
      </div>
    </div>
  )
}