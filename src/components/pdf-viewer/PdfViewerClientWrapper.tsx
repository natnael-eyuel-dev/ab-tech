"use client"

import { useEffect, useState } from 'react'

type Props = { url: string }

export default function PdfViewerClientWrapper({ url }: Props) {
  const [Comp, setComp] = useState<React.ComponentType<{ url: string }> | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    // Double check we're in browser environment
    if (typeof window === 'undefined') return

    let mounted = true
    
    const loadPdfViewer = async () => {
      try {
        // Use a more defensive import approach
        const mod = await import('./PdfViewerClient')
        if (!mounted) return
        
        if (mod.default) {
          setComp(() => mod.default)
        } else {
          throw new Error('PDF viewer component not found')
        }
      } catch (e: any) {
        console.error('Failed to load PDF viewer client:', e)
        if (!mounted) return
        
        // Provide more specific error message
        if (e?.message?.includes('Object.defineProperty')) {
          setErr('PDF library compatibility issue - please refresh the page')
        } else {
          setErr(String(e?.message ?? 'Failed to load PDF viewer'))
        }
      }
    }

    loadPdfViewer()

    return () => { mounted = false }
  }, [])

  if (err) {
    return (
      <div className="p-4 text-sm text-red-600 border border-red-200 rounded bg-red-50">
        <div className="font-medium">Failed to load PDF viewer</div>
        <div className="text-xs mt-1">{err}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reload Page
        </button>
      </div>
    )
  }

  if (!Comp) {
    return (
      <div className="p-6 text-sm text-muted-foreground animate-pulse border rounded bg-muted/50">
        Loading PDF viewer...
      </div>
    )
  }

  return <Comp url={url} />
}