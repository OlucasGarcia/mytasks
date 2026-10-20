
import TaskCard from './TaskCard'

function TaskColumn({
    title,
    tasks,
    color,
    onEdit,
    onDelete,
    onStatusChange,
}) {
    return (
        <section className="min-w-0 rounded-xl border border-border bg-background p-4">
            <div className="mb-5 flex items-center gap-2">
                <span
                    className={`h-2.5 w-2.5 rounded-full ${color}`}
                />

                <h2 className="text-sm font-semibold text-text-primary">
                    {title}
                </h2>

                <span className="ml-auto rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary">
                    {tasks.length}
                </span>
            </div>

            <div className="flex flex-col gap-3">
                {tasks.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 px-3 py-8 text-center text-xs text-text-secondary">
                        Nenhuma tarefa nesta etapa.
                    </p>
                ) : (
                    tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onStatusChange={onStatusChange}
                        />
                    ))
                )}
            </div>
        </section>
    )
}

export default TaskColumn
