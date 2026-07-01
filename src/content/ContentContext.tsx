import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_CONTENT,
  cacheContent,
  fetchRemoteContent,
  loadCachedContent,
  resolve,
  type ResolvedContent,
} from '../lib/content'

// Default value = bundled content, so components render correctly even if some
// tree happens to mount outside the provider.
export const ContentContext = createContext<ResolvedContent>(resolve(DEFAULT_CONTENT))

/** Read the live, resolved invitation content. */
export function useContent(): ResolvedContent {
  return useContext(ContentContext)
}

/**
 * Provides invitation content to the app. Renders instantly from the cached/
 * bundled copy, then quietly refreshes from the host's live edits in the
 * background. Never blocks, never throws.
 */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState(() => loadCachedContent())

  useEffect(() => {
    let alive = true
    fetchRemoteContent()
      .then((remote) => {
        if (alive && remote) {
          setContent(remote)
          cacheContent(remote)
        }
      })
      .catch(() => {
        /* keep cached/default content */
      })
    return () => {
      alive = false
    }
  }, [])

  const resolved = useMemo(() => resolve(content), [content])

  // Keep the browser tab title + meta/OG tags in sync with edited content, so a
  // changed title or date isn't stale in the tab or JS-capable share previews.
  // (Static crawlers still read index.html's defaults — an inherent SPA limit.)
  useEffect(() => {
    syncDocumentMeta(resolved)
  }, [resolved])

  return (
    <ContentContext.Provider value={resolved}>{children}</ContentContext.Provider>
  )
}

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

function syncDocumentMeta(c: ReturnType<typeof resolve>) {
  try {
    const summary = `${c.unitFull} · ${c.dateLong} · ${c.time}`
    document.title = `${c.title} · ${c.unitFull}`
    setMeta('name', 'description', summary)
    setMeta('property', 'og:title', c.title)
    setMeta('property', 'og:description', summary)
  } catch {
    /* non-browser / locked-down environment — ignore */
  }
}
