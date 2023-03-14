import * as path from "path";
import fs from "fs-extra";
import { execa, ExecaReturnValue } from "execa";
import * as R from "ramda";

const REG_PATH = "HKLM:\\SOFTWARE\\Classes\\mtasa\\shell\\open\\command";
const REG_NAME = "(Default)";
const MTA_APP_NAME = "Multi Theft Auto.exe";

const determineMTAPath = R.once(async (): Promise<string> => {
    let response: ExecaReturnValue<string>;
    try {
        response = await execa("powershell.exe", [`(Get-ItemProperty -Path ${REG_PATH}).'${REG_NAME}'`]);
        if (!response.stdout) throw Error();
    } catch {
        throw Error("Could not find MTA installation path (1)");
    }
    const trimmed_path: string = response.stdout.substring(1, response.stdout.length - 2);
    const win_32_path: string = path.win32.dirname(trimmed_path);
    try {
        await fs.access(path.win32.join(win_32_path, MTA_APP_NAME));
    } catch {
        throw Error("Could not find MTA installation path (2)");
    }
    return win_32_path;
});

export const getMtaPath: () => Promise<string> = determineMTAPath;
