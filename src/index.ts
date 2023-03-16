import fs from "fs-extra";
import * as path from "path";
import inquirer from "inquirer";
import { clear } from "console";
import chalk from "chalk";
import figlet from "figlet";
import { getMtaPath } from "./mta-installation";
import ImageConverter from "./image-converter";
import { CONVERT_OPTIONS } from "./constants";

const FOLDER_PATH = path.join(process.cwd(), "images");
const FOLDER_PATH_OUTPUT = path.join(process.cwd(), "images_output");
const TEXCONV_PATH = path.join(process.cwd(), "texconv.exe");
const converter = new ImageConverter(FOLDER_PATH, FOLDER_PATH_OUTPUT, TEXCONV_PATH);

main();

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
    const mtaPath = await getMtaPath();
    const originalStickerPath = path.join(mtaPath, "mods/deathmatch/resources/stickers/original/dds/256/patterns");
    const dirents = fs.readdirSync(FOLDER_PATH, { withFileTypes: true });
    const stickerDirents = fs.readdirSync(originalStickerPath, { withFileTypes: true }).map(dirent => dirent.name);
    const outputDirents = fs.readdirSync(FOLDER_PATH_OUTPUT, { withFileTypes: true });
    // ignores .gitignore
    const inputFiles = dirents
        .filter(dirent => dirent.isFile() && dirent.name !== ".gitignore")
        .map(dirent => dirent.name);
    try {
        // Search for mta installation path, required to continue the program.
        fs.ensureDirSync(FOLDER_PATH_OUTPUT);
        clear();
        console.log(chalk.greenBright(figlet.textSync("dp-img-2-dds", { horizontalLayout: "full" })));
        console.log("");
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
                        message: "Select your converted image",
                        choices: targetDDSChoices,
                        validate: targetDDS => {
                            if (targetDDS.length < 1) {
                                return "You have to select at least one sticker";
                            }
                            return true;
                        }
                    }
                ]);

                console.log("You have selected: ", select_options);

                const { replace_options } = await inquirer.prompt([
                    {
                        type: "checkbox",
                        name: "replace_options",
                        message: `Select which original sticker you want to replace`,
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
                const filesToCopy = select_options.map((option, i) => ({
                    sourcePath: `${FOLDER_PATH_OUTPUT}/${option}`,
                    targetPath: `${originalStickerPath}/${replace_options[i]}`
                }));

                for (const file of filesToCopy) {
                    try {
                        await fs.promises.unlink(file.targetPath);
                    } catch (error) {
                        // ignore error if the file does not exist
                    }

                    try {
                        await fs.promises.copyFile(file.sourcePath, file.targetPath);
                        console.log(`File ${file.sourcePath} successfully copied and renamed to ${file.targetPath}.`);
                    } catch (error) {
                        console.log(`Error copying file from ${file.sourcePath} to ${file.targetPath}: ${error}`);
                    }
                }
                break;
            default:
                throw new Error(`Invalid option selected: ${convert_options}. Please select a valid option`);
        }
    } catch (err) {
        console.error(err);
    }
}
