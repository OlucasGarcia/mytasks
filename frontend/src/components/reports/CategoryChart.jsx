function CategoryChart({ tasks }) {
    const counts = tasks.reduce((categories, task) => {
        const category = task.category?.trim() || 'Sem categoria'
        categories.set(category, (categories.get(category) ?? 0) + 1)
        return categories
    }, new Map())

    const data = [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((first, second) =>
            second.count - first.count || first.name.localeCompare(second.name, 'pt-BR')
        )

    return (
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-text-primary">
                    Tarefas por categoria
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                    Distribuição das tarefas nas suas categorias.
                </p>
            </div>

            {data.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                    <p className="text-sm text-text-secondary">
                        Nenhuma tarefa disponível.
                    </p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {data.map(({ name, count }) => {
                        const percentage = (count / tasks.length) * 100

                        return (
                            <li key={name}>
                                <div className="mb-2 flex items-center justify-between gap-4">
                                    <span className="truncate text-sm font-medium text-text-primary">
                                        {name}
                                    </span>
                                    <span className="shrink-0 text-sm text-text-secondary">
                                        {count} ({Math.round(percentage)}%)
                                    </span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-500/50">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}

export default CategoryChart
