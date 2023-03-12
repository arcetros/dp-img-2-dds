import { getMtaPath } from "./mta-installation";
import { Image } from "image-js";
import { execa } from "execa";
import { readdirSync, mkdirSync, existsSync, ensureDirSync } from "fs-extra";
import * as path from "path";

const FOLDER_PATH = path.join(process.cwd(), "images");
const FOLDER_PATH_OUTPUT = path.join(process.cwd(), "images_output");
const TEXCONV_PATH = path.join(process.cwd(), "texconv.exe");
const SUPPORTED_FORMATS = [".jpg", ".jpeg", ".png", ".gif"];

try {
    ensureDirSync(FOLDER_PATH_OUTPUT);
} catch (err) {
    console.error(`Failed to create directory ${FOLDER_PATH_OUTPUT}: ${err}`);
}

(async function (): Promise<void> {
    const files = readdirSync(FOLDER_PATH);

    try {
        await getMtaPath();

        for (const file of files) {
            const extension = path.extname(file);

            if (SUPPORTED_FORMATS.includes(extension)) {
                const inputFilePath = path.join(FOLDER_PATH, file);
                const outputFilePath = path.join(FOLDER_PATH_OUTPUT, `${path.parse(file).name}.dds`);
                console.log(`Converting ${inputFilePath} to ${outputFilePath}`);
                const inputImage = await Image.load(inputFilePath);
                const tempFilePath = path.join(FOLDER_PATH_OUTPUT, `${path.parse(file).name}.tmp.png`);
                await inputImage.save(tempFilePath);

                const outputDirPath = path.dirname(outputFilePath);
                if (!existsSync(outputDirPath)) {
                    try {
                        mkdirSync(outputDirPath, { recursive: true }); // create the output directory if it does not exist
                    } catch (err) {
                        console.error(`Failed to create directory ${outputDirPath}: ${err}`);
                        continue; // skip to the next file if creating the directory failed
                    }
                }
                // https://github.com/Microsoft/DirectXTex/wiki/Texconv
                const args = [
                    "-y", // overwrite output files without asking
                    "-f", // specify output format
                    "DXT5", // output format: DXT5
                    "-nologo", // don't print texconv logo
                    "-m", // specify mip levels
                    "1", // generate mip levels: 1 (no mip levels)
                    "-o", // specify output directory
                    outputDirPath, // output directory
                    tempFilePath // input file path
                ];
                if (existsSync(TEXCONV_PATH)) {
                    try {
                        await execa(TEXCONV_PATH, args);
                    } catch (err) {
                        console.error(`Failed to convert ${inputFilePath}: ${err}`);
                    }
                } else {
                    console.error(`Error: texconv.exe not found at ${TEXCONV_PATH}`);
                }
            }
        }
    } catch (err) {
        console.error(err);
    }
})();
