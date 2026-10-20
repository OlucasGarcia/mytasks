
import AppearanceSettings from '../../components/settings/AppearanceSettings'
import NotificationSettings from '../../components/settings/NotificationSettings'
import SecuritySettings from '../../components/settings/SecuritySettings'

function Settings() {
    return (
        <section>
            <div className="mb-6">
                <h1 className="text-3xl font-semibold text-text-primary">
                    Configurações
                </h1>

                <p className="mt-1 text-sm text-text-secondary">
                    Personalize sua experiência no MyTasks.
                </p>
            </div>

            <AppearanceSettings />
            <div className="mt-6">
                <NotificationSettings />
            </div>
            <div className="mt-6">
                <SecuritySettings />
            </div>
        </section>
    )
}

export default Settings
