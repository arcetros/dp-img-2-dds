import fs from "fs-extra";
import * as path from "path";
import inquirer, { QuestionCollection } from "inquirer";
import { clear } from "console";
import chalk from "chalk";
import figlet from "figlet";
import { getDocumentsFolder } from "platform-folders";
import { getMtaPath } from "./mta-installation.js";
import ImageConverter from "./image-converter.js";
import ora from "ora";
import { toSecond } from "./string-utils.js";

const MAIN_FOLDER_PATH = path.join(`${getDocumentsFolder()}/dp-img-2-dds`);
const FOLDER_PATH = path.join(MAIN_FOLDER_PATH, "/images");
const FOLDER_PATH_OUTPUT = path.join(MAIN_FOLDER_PATH, "/images_output");
const TEXCONV_PATH = path.join(process.cwd(), "texconv.exe");
const DP_STICKER_PATH = "mods/deathmatch/resources/stickers/original/dds/256/patterns";

const converter = new ImageConverter(FOLDER_PATH, FOLDER_PATH_OUTPUT, TEXCONV_PATH);

main();

const CONVERT_OPTIONS: QuestionCollection = [
    {
        name: "convert_options",
        message: "Select image tools (use arrows key)",
        type: "list",
        choices: [
            { type: "choice", value: 0, name: "Select images to convert to .dds format" },
            { type: "choice", value: 1, name: "Convert all images at once inside image_output folder" },
            { type: "choice", value: 2, name: "Replace original sticker with new ones" }
        ]
    }
];

async function exit() {
    const { moreQuery } = await inquirer.prompt([
        {
            name: "moreQuery",
            type: "confirm",
            message: "Want to do anything else?"
        }
    ]);
    if (moreQuery) {
        await main();
    }
}

async function main(): Promise<void> {
    // Make sure to check if the folder is exist or not, if not create them.
    fs.ensureDirSync(MAIN_FOLDER_PATH);
    fs.ensureDirSync(FOLDER_PATH);
    fs.ensureDirSync(FOLDER_PATH_OUTPUT);

    const mtaPath = await getMtaPath();
    const originalStickerPath = path.join(mtaPath, DP_STICKER_PATH);
    const dirents = fs.readdirSync(FOLDER_PATH, { withFileTypes: true });
    const stickerDirents = fs.readdirSync(originalStickerPath, { withFileTypes: true }).map(dirent => dirent.name);
    const outputDirents = fs.readdirSync(FOLDER_PATH_OUTPUT, { withFileTypes: true });
    // ignores .gitignore
    const inputFiles = dirents
        .filter(dirent => dirent.isFile() && dirent.name !== ".gitignore")
        .map(dirent => dirent.name);
    try {
        clear();
        console.log(getDocumentsFolder());
        console.log(`${chalk.greenBright(figlet.textSync("dp-img-2-dds", { horizontalLayout: "full" }))}\n`);
        console.log(chalk.gray("https://github.com/arcetros/dp-img-2-dds"));
        console.log(`You are now using v${process.env.npm_package_version}\n`);

        const { convert_options } = await inquirer.prompt(CONVERT_OPTIONS);
        switch (convert_options) {
            case 0:
                const { options } = await inquirer.prompt([
                    {
                        type: "checkbox",
                        message: `Select up to ${inputFiles.length} files`,
                        name: "options",
                        choices: inputFiles
                    }
                ]);
                await converter.convertImageFiles(options).then(() => exit());
                break;
            case 1:
                converter.convertImageFiles(inputFiles).then(() => exit());
                break;
            case 2:
                const targetDDSChoices = outputDirents
                    .filter(dirent => path.extname(dirent.name).toLowerCase() === ".dds")
                    .map(file => file.name);

                const { select_options } = await inquirer.prompt([
                    {
                        type: "checkbox",
                        name: "select_options",
                        message: "Select your converted image (.dds) format only!",
                        choices: targetDDSChoices,
                        validate: targetDDS => {
                            if (targetDDS.length < 1) {
                                return "You have to select at least one sticker";
                            }
                            return true;
                        }
                    }
                ]);

                const { replace_options } = await inquirer.prompt([
                    {
                        type: "checkbox",
                        name: "replace_options",
                        message: `Select which original stickers you want to replace`,
                        choices: stickerDirents,
                        validate: selectedStickers => {
                            if (selectedStickers.length !== select_options.length) {
                                return `You must select exactly ${select_options.length} sticker${
                                    select_options.length === 1 ? "" : "s"
                                }`;
                            }
                            return true;
                        }
                    }
                ]);

                const filesToCopy = select_options.map((option: string, i: number) => ({
                    sourcePath: `${FOLDER_PATH_OUTPUT}/${option}`,
                    targetPath: `${originalStickerPath}/${replace_options[i]}`
                }));

                for (const file of filesToCopy) {
                    const start = process.hrtime();
                    const spinner = ora(`${chalk.yellowBright(`${file.sourcePath}`)}`).start();
                    try {
                        await fs.promises.unlink(file.targetPath);
                    } catch (error) {
                        // ignore error if the file does not exist
                    }

                    try {
                        await fs.promises.copyFile(file.sourcePath, file.targetPath).then(() => {
                            const end = `${toSecond(process.hrtime(start))} seconds`;
                            spinner.succeed(
                                `${chalk.bgGreenBright(chalk.black(" SUCCEEDED "))} ${chalk.white(
                                    `${path.basename(file.sourcePath)} to ${path.basename(file.targetPath)}`
                                )} ${chalk.gray(`(${end})`)}`
                            );
                        });
                    } catch (error) {
                        console.log(
                            chalk.red(`Error copying file from ${file.sourcePath} to ${file.targetPath}: ${error}`)
                        );
                    }
                }
                await exit();
                break;
            default:
                throw new Error(`Invalid option selected: ${convert_options}. Please select a valid option`);
        }
    } catch (err) {
        console.error(err);
    }
}
