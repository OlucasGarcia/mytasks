
import { useState } from 'react'
import { X } from 'lucide-react'

const initialForm = {
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    status: 'pending',
    date: '',
    time: '',
}

function TaskForm({ onClose, onSave, task = null }) {
    const [form, setForm] = useState(() =>
        task
            ? {
                title: task.title ?? '',
                description: task.description ?? '',
                category: task.category ?? '',
                priority: task.priority ?? 'medium',
                status: task.status ?? 'pending',
                date: task.date ?? '',
                time: task.time ?? '',
            }
            : { ...initialForm }
    )

    function handleChange(event) {
        const { name, value } = event.target

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }))
    }

    function handleSubmit(event) {
        event.preventDefault()

        if (!form.title.trim()) return

        onSave({
            ...form,
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category.trim(),
        })

        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="task-form-title"
                className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-surface p-6 text-text-primary shadow-xl"
            >
                <div className="mb-6 flex items-center justify-between">
                    <h2
                        id="task-form-title"
                        className="text-xl font-semibold text-text-primary"
                    >
                        {task ? 'Editar tarefa' : 'Nova tarefa'}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar formulário"
                        className="text-slate-500 hover:text-text-primary"
                    >
                        <X size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="mb-1 block text-sm font-medium">
                            Título *
                        </label>
                        <input
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            required
                            maxLength={100}
                            placeholder="Digite o título da tarefa"
                            className="w-full rounded-lg border bg-background text-text-primary border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="mb-1 block text-sm font-medium">
                            Descrição
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Descreva a atividade"
                            className="w-full resize-none rounded-lg bg-background text-text-primary border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label htmlFor="category" className="mb-1 block text-sm font-medium">
                            Categoria
                        </label>
                        <input
                            id="category"
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            placeholder="Ex.: Estoque, Compras, Atendimento"
                            className="w-full rounded-lg border border-border bg-background text-text-primary px-3 py-2.5 text-sm outline-none focus:border-primary"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="priority" className="mb-1 block text-sm font-medium">
                                Prioridade
                            </label>
                            <select
                                id="priority"
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-border bg-background text-text-primary px-3 py-2.5 text-sm outline-none focus:border-primary"
                            >
                                <option value="low">Baixa</option>
                                <option value="medium">Média</option>
                                <option value="high">Alta</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="status" className="mb-1 block text-sm font-medium">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-border bg-background text-text-primary px-3 py-2.5 text-sm outline-none focus:border-primary"
                            >
                                <option value="pending">A fazer</option>
                                <option value="in_progress">Em andamento</option>
                                <option value="completed">Finalizada</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="date" className="mb-1 block text-sm font-medium">
                                Data
                            </label>
                            <input
                                id="date"
                                name="date"
                                type="date"
                                value={form.date}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-border bg-background text-text-primary px-3 py-2.5 text-sm outline-none focus:border-primary"
                            />
                        </div>

                        <div>
                            <label htmlFor="time" className="mb-1 block text-sm font-medium">
                                Horário
                            </label>
                            <input
                                id="time"
                                name="time"
                                type="time"
                                value={form.time}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-border bg-background text-text-primary px-3 py-2.5 text-sm outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-border pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-border px-4 py-2.5 text-sm hover:bg-background"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                        >
                            {task ? 'Salvar alterações' : 'Salvar tarefa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default TaskForm
