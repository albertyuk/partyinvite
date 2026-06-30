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

  return (
    <ContentContext.Provider value={resolved}>{children}</ContentContext.Provider>
  )
}
