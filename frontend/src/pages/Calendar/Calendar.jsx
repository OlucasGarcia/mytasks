
import CalendarGrid from '../../components/calendar/CalendarGrid'
import UpcomingEvents from '../../components/calendar/UpcomingEvents'

function Calendar() {
    return (
        <section>
            <div className="mb-6">
                <h1 className="text-3xl font-semibold text-text-primary">
                    Calendário
                </h1>

                <p className="mt-1 text-sm text-text-secondary">
                    Visualize suas tarefas e compromissos por data.
                </p>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 [&>section]:h-full">
                    <CalendarGrid />
                </div>

                <div className="min-w-0 [&>aside]:h-full">
                    <UpcomingEvents />
                </div>
            </div>
        </section>
    )
}

export default Calendar
