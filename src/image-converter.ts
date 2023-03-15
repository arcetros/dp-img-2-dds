import { Image } from "image-js";
import { execa } from "execa";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import * as path from "path";
import { toSecond } from "./string-utils";

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
        const tempFilePath = path.join(path.dirname(outputFilePath), `${path.parse(inputFilePath).name}.png`);
        const inputImage = await Image.load(inputFilePath);
        await inputImage.save(tempFilePath);
        const outputDirPath = path.dirname(outputFilePath);
        if (!fs.existsSync(outputDirPath)) {
            fs.mkdirSync(outputDirPath, { recursive: true });
        }
        const args = ["-y", "-f", "DXT5", "-nologo", "-m", "1", "-o", outputDirPath, tempFilePath];
        await execa(this.texconvPath, args);
        // Delete temporary file
        fs.unlinkSync(tempFilePath);
    }

    public async convertImageFile(inputFile: string): Promise<void> {
        const extension = path.extname(inputFile);
        const start = process.hrtime();
        const spinner = ora(`${chalk.yellowBright(`${inputFile}`)}`).start();

        if (!SUPPORTED_FORMATS.includes(extension)) {
            spinner.fail(`Error: ${inputFile} has an unsupported format (${extension}).`);
            return;
        }

        const inputFilePath = path.join(this.inputFolderPath, inputFile);
        const outputFilePath = path.join(this.outputFolderPath, `${path.parse(inputFile).name}.dds`);

        try {
            await this.convertImage(inputFilePath, outputFilePath).then(() => {
                const end = `${toSecond(process.hrtime(start))} seconds`;
                spinner.succeed(`Converting ${inputFile} done in ${chalk.greenBright(end)}`);
            });
        } catch (err) {
            chalk.red(err);
        }
    }

    public async convertImageFiles(files: string[]): Promise<void> {
        await Promise.all(files.map(file => this.convertImageFile(file)));
    }
}

export default ImageConverter;
