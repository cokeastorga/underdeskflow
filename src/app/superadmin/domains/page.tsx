import DomainClient from "./DomainClient";
import { getPlatformDomains } from "./actions";

export default async function HQDomainsPage() {
    const domains = await getPlatformDomains();

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <DomainClient initialDomains={domains} />
        </div>
    );
}
