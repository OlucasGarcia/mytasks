
import {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'mytasks-theme'

function getInitialTheme() {
    const storedTheme = localStorage.getItem(STORAGE_KEY)

    if (['light', 'dark', 'system'].includes(storedTheme)) {
        return storedTheme
    }

    return 'light'
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme)

    useEffect(() => {
        const mediaQuery = window.matchMedia(
            '(prefers-color-scheme: dark)'
        )

        function applyTheme() {
            const isDark =
                theme === 'dark' ||
                (theme === 'system' && mediaQuery.matches)

            document.documentElement.classList.toggle(
                'dark',
                isDark
            )
        }

        applyTheme()

        localStorage.setItem(STORAGE_KEY, theme)

        mediaQuery.addEventListener('change', applyTheme)

        return () => {
            mediaQuery.removeEventListener('change', applyTheme)
        }
    }, [theme])

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)

    if (context === null) {
        throw new Error(
            'useTheme deve ser utilizado dentro de ThemeProvider'
        )
    }

    return context
}
