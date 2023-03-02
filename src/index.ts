import { getMtaPath } from "./mta-installation";

(async function (): Promise<void> {
    try {
        await getMtaPath();
    } catch (err) {
        console.log(err);
    }
})();
