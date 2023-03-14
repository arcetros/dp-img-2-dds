import { getMtaPath } from "./mta-installation";
import fs from "fs-extra";
import * as path from "path";
import ImageConverter from "./image-converter";

const FOLDER_PATH = path.join(process.cwd(), "images");
const FOLDER_PATH_OUTPUT = path.join(process.cwd(), "images_output");
const TEXCONV_PATH = path.join(process.cwd(), "texconv.exe");
const converter = new ImageConverter(FOLDER_PATH, FOLDER_PATH_OUTPUT, TEXCONV_PATH);

(async function (): Promise<void> {
    const inputFiles = fs.readdirSync(FOLDER_PATH);
    try {
        await getMtaPath();
        fs.ensureDirSync(FOLDER_PATH_OUTPUT);
        converter.convertImageFiles(inputFiles);
    } catch (err) {
        console.error(err);
    }
})();
