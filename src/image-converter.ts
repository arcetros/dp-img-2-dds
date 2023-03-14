import { Image } from "image-js";
import { execa } from "execa";
import { mkdirSync, existsSync, unlinkSync } from "fs-extra";
import * as path from "path";

const SUPPORTED_FORMATS = [".jpg", ".jpeg", ".png"];

const convertImage = async (inputFilePath: string, outputFilePath: string, texconvPath: string): Promise<void> => {
    const tempFilePath = path.join(path.dirname(outputFilePath), `${path.parse(inputFilePath).name}.tmp.png`);
    const inputImage = await Image.load(inputFilePath);
    await inputImage.save(tempFilePath);
    const outputDirPath = path.dirname(outputFilePath);
    if (!existsSync(outputDirPath)) {
        mkdirSync(outputDirPath, { recursive: true });
    }
    const args = ["-y", "-f", "DXT5", "-nologo", "-m", "1", "-o", outputDirPath, tempFilePath];
    await execa(texconvPath, args);
    // Delete temporary file
    unlinkSync(tempFilePath);
};

const convertImageFile = async (
    inputFile: string,
    inputFolderPath: string,
    outputFolderPath: string,
    texconvPath: string
): Promise<void> => {
    const extension = path.extname(inputFile);

    if (!SUPPORTED_FORMATS.includes(extension)) {
        console.error(`Unsupported file format: ${inputFile}`);
        return;
    }

    const inputFilePath = path.join(inputFolderPath, inputFile);
    const outputFilePath = path.join(outputFolderPath, `${path.parse(inputFile).name}.dds`);
    console.log(`Converting ${inputFilePath} to ${outputFilePath}`);

    try {
        await convertImage(inputFilePath, outputFilePath, texconvPath);
    } catch (err) {
        console.error(`Failed to convert ${inputFilePath}: ${err}`);
    }
};

const convertImageFiles = async (
    files: string[],
    inputFolderPath: string,
    outputFolderPath: string,
    texconvPath: string
): Promise<void> => {
    await Promise.all(files.map(file => convertImageFile(file, inputFolderPath, outputFolderPath, texconvPath)));
};

export { convertImageFile, convertImageFiles };
