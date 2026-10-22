
import { useEffect, useId, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'

function ConfirmModal({
    isOpen,
    title = 'Confirmar ação',
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onConfirm,
    onCancel,
    isLoading = false,
    variant = 'danger',
}) {
    const titleId = useId()
    const descriptionId = useId()
    const cancelButtonRef = useRef(null)

    useEffect(() => {
        if (!isOpen) return

        const previousOverflow = document.body.style.overflow
        const previousActiveElement = document.activeElement

        document.body.style.overflow = 'hidden'
        cancelButtonRef.current?.focus()

        function handleEscape(event) {
            if (event.key === 'Escape' && !isLoading) {
                onCancel()
            }
        }

        document.addEventListener('keydown', handleEscape)

        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', handleEscape)
            previousActiveElement?.focus?.()
        }
    }, [isOpen, isLoading, onCancel])

    if (!isOpen) return null

    const isDanger = variant === 'danger'

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isLoading
                ) {
                    onCancel()
                }
            }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-text-primary shadow-2xl"
            >
                <div className="mb-5 flex items-start justify-between">
                    <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${isDanger
                                ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                                : 'bg-primary/10 text-primary'
                            }`}
                    >
                        <AlertTriangle size={24} />
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        aria-label="Fechar confirmação"
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <h2
                    id={titleId}
                    className="text-xl font-semibold text-text-primary"
                >
                    {title}
                </h2>

                <p
                    id={descriptionId}
                    className="mt-2 text-sm leading-relaxed text-text-secondary"
                >
                    {message}
                </p>

                <div className="mt-7 flex flex-wrap justify-end gap-3">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDanger
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-primary hover:bg-primary-hover'
                            }`}
                    >
                        {isLoading && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        )}

                        {isLoading ? 'Processando...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal
