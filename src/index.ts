import { getMtaPath } from "./mta-installation";
import { readdirSync, ensureDirSync } from "fs-extra";
import * as path from "path";
import { convertImageFiles } from "./image-converter";

const FOLDER_PATH = path.join(process.cwd(), "images");
const FOLDER_PATH_OUTPUT = path.join(process.cwd(), "images_output");
const TEXCONV_PATH = path.join(process.cwd(), "texconv.exe");

(async function (): Promise<void> {
    const files = readdirSync(FOLDER_PATH);
    try {
        await getMtaPath();
        ensureDirSync(FOLDER_PATH_OUTPUT);
        convertImageFiles(files, FOLDER_PATH, FOLDER_PATH_OUTPUT, TEXCONV_PATH);
    } catch (err) {
        console.error(err);
    }
})();
