
import { Search, SlidersHorizontal, X } from 'lucide-react'

function TaskFilters({
    search,
    onSearchChange,
    priority,
    onPriorityChange,
    category,
    onCategoryChange,
    categories,
    onClear,
}) {
    const hasFilters = Boolean(
        search || priority !== 'all' || category !== 'all'
    )

    return (
        <div className="mb-6 rounded-xl border border-border bg-surface p-4">
            <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-primary" />

                <h2 className="text-sm font-semibold text-text-primary">
                    Filtrar tarefas
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="relative">
                    <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                    />

                    <input
                        type="search"
                        aria-label="Buscar tarefas"
                        placeholder="Buscar tarefas..."
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
                    />
                </div>

                <select
                    aria-label="Filtrar por prioridade"
                    value={priority}
                    onChange={(event) => onPriorityChange(event.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                    <option value="all">Todas as prioridades</option>
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                </select>

                <select
                    aria-label="Filtrar por categoria"
                    value={category}
                    onChange={(event) => onCategoryChange(event.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                    <option value="all">Todas as categorias</option>

                    {categories.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
            </div>

            {hasFilters && (
                <button
                    type="button"
                    onClick={onClear}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover"
                >
                    <X size={14} />
                    Limpar filtros
                </button>
            )}
        </div>
    )
}

export default TaskFilters
