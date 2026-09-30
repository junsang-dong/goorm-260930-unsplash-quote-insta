import { createContext, useContext, useReducer } from 'react'
import { DEFAULT_RATIO, DEFAULT_STYLE } from '../utils/constants'

const EditorContext = createContext(null)

const initialState = {
  photo: null,
  quote: null,
  ratio: DEFAULT_RATIO,
  style: DEFAULT_STYLE,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PHOTO':
      return { ...state, photo: action.photo }
    case 'SET_QUOTE':
      return { ...state, quote: action.quote }
    case 'SET_RATIO':
      return { ...state, ratio: action.ratio }
    case 'SET_STYLE':
      return { ...state, style: { ...state.style, ...action.style } }
    case 'APPLY_PRESET':
      return { ...state, style: { ...action.style } }
    case 'RESTORE_CARD':
      return {
        ...state,
        photo: action.card.photo,
        quote: action.card.quote,
        ratio: action.card.ratio,
        style: action.card.style,
      }
    default:
      return state
  }
}

export function EditorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <EditorContext.Provider value={{ state, dispatch }}>{children}</EditorContext.Provider>
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}
