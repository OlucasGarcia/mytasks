
function SummaryCard({
    title,
    value,
    icon: Icon,
    iconColor = 'text-primary',
    iconBackground = 'bg-sky-100',
}) {
    return (
        <article className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${iconBackground}`}
            >
                <Icon size={23} className={iconColor} strokeWidth={2.2} />
            </div>

            <h2 className="text-sm font-medium text-text-primary">
                {title}
            </h2>

            <p className="mt-2 text-3xl font-bold text-text-primary">
                {value}
            </p>
        </article>
    )
}

export default SummaryCard
