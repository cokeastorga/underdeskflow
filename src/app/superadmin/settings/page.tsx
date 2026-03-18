import SettingsClient from "./SettingsClient";
import { getSystemConfig } from "./actions";

export default async function HQSettingsPage() {
    const config = await getSystemConfig();

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <SettingsClient initialConfig={config} />
        </div>
    );
}
