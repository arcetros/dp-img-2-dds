import { Image } from "image-js";
import { execa } from "execa";
import { mkdirSync, existsSync, unlinkSync } from "fs-extra";
import * as path from "path";

const SUPPORTED_FORMATS = [".jpg", ".jpeg", ".png"];

class ImageConverter {
    private inputFolderPath: string;
    private outputFolderPath: string;
    private texconvPath: string;

    constructor(inputFolderPath: string, outputFolderPath: string, texconvPath: string) {
        this.inputFolderPath = inputFolderPath;
        this.outputFolderPath = outputFolderPath;
        this.texconvPath = texconvPath;
    }

    private async convertImage(inputFilePath: string, outputFilePath: string): Promise<void> {
        const tempFilePath = path.join(path.dirname(outputFilePath), `${path.parse(inputFilePath).name}.tmp.png`);
        const inputImage = await Image.load(inputFilePath);
        await inputImage.save(tempFilePath);
        const outputDirPath = path.dirname(outputFilePath);
        if (!existsSync(outputDirPath)) {
            mkdirSync(outputDirPath, { recursive: true });
        }
        const args = ["-y", "-f", "DXT5", "-nologo", "-m", "1", "-o", outputDirPath, tempFilePath];
        await execa(this.texconvPath, args);
        // Delete temporary file
        unlinkSync(tempFilePath);
    }

    public async convertImageFile(inputFile: string): Promise<void> {
        const extension = path.extname(inputFile);

        if (!SUPPORTED_FORMATS.includes(extension)) {
            console.error(`Unsupported file format: ${inputFile}`);
            return;
        }

        const inputFilePath = path.join(this.inputFolderPath, inputFile);
        const outputFilePath = path.join(this.outputFolderPath, `${path.parse(inputFile).name}.dds`);
        console.log(`Converting ${inputFilePath} to ${outputFilePath}`);

        try {
            await this.convertImage(inputFilePath, outputFilePath);
        } catch (err) {
            console.error(`Failed to convert ${inputFilePath}: ${err}`);
        }
    }

    public async convertImageFiles(files: string[]): Promise<void> {
        await Promise.all(files.map(file => this.convertImageFile(file)));
    }
}

export default ImageConverter;
