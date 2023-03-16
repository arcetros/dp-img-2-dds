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

const exit = async () => {
    inquirer
        .prompt([
            {
                name: "moreQuery",
                type: "confirm",
                message: "Want to do anything else?"
            }
        ])
        .then(answer => {
            if (answer.moreQuery) return main();
            return null;
        });
};

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
        inquirer.prompt(CONVERT_OPTIONS).then(({ convert_options }) => {
            switch (convert_options) {
                case 0:
                    inquirer
                        .prompt([
                            {
                                type: "checkbox",
                                message: `Select up to ${inputFiles.length} files`,
                                name: "options",
                                choices: inputFiles
                            }
                        ])
                        .then(({ options }) => converter.convertImageFiles(options).then(() => exit()));
                    break;
                case 1:
                    converter.convertImageFiles(inputFiles).then(() => exit());
                    break;
                case 2:
                    inquirer
                        .prompt([
                            {
                                type: "checkbox",
                                name: "options",
                                message: `Select your converted image`,
                                choices: outputDirents
                                    .filter(dirent => {
                                        return path.extname(dirent.name).toLowerCase() === ".dds";
                                    })
                                    .map(file => file.name),
                                validate(target_dds) {
                                    if (target_dds.length < 1) {
                                        return "You have to select atleast one sticker";
                                    }
                                    return true;
                                }
                            }
                        ])
                        .then(({ options }: { options: string[] }) => {
                            console.log("You have selected: ", options);
                            inquirer
                                .prompt([
                                    {
                                        type: "checkbox",
                                        name: "replace_options",
                                        message: `Select which original sticker you want to replace`,
                                        choices: stickerDirents,
                                        validate(target_dds) {
                                            if (target_dds.length !== options.length) {
                                                return `You must select exactly ${options.length} sticker${
                                                    options.length === 1 ? "" : "s"
                                                }`;
                                            }
                                            return true;
                                        }
                                    }
                                ])
                                .then(({ replace_options }: { replace_options: string[] }) => {
                                    const filesToCopy = [];
                                    for (let i = 0; i < options.length; i++) {
                                        const obj = {
                                            sourcePath: `${FOLDER_PATH_OUTPUT}/${options[i]}`,
                                            targetPath:
                                                i < replace_options.length
                                                    ? `${originalStickerPath}/${replace_options[i]}`
                                                    : null
                                        };
                                        filesToCopy.push(obj);
                                    }
                                    for (const file of filesToCopy) {
                                        fs.unlink(file.targetPath);

                                        fs.copyFile(file.sourcePath, file.targetPath, 1, err => {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log(
                                                    `File ${file.sourcePath} successfully copied and renamed to ${file.targetPath}.`
                                                );
                                            }
                                        });
                                    }
                                });
                        });
                    break;
                default:
                    throw new Error(`Invalid option selected: ${convert_options}. Please select a valid option`);
            }
        });
    } catch (err) {
        console.error(err);
    }
}
