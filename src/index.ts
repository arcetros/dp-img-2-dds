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
    const dirents = fs.readdirSync(FOLDER_PATH, { withFileTypes: true });
    // ignores .gitignore
    const inputFiles = dirents
        .filter(dirent => dirent.isFile() && dirent.name !== ".gitignore")
        .map(dirent => dirent.name);
    try {
        // Search for mta installation path, required to continue the program.
        await getMtaPath();
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
                default:
                    throw new Error(`Invalid option selected: ${convert_options}. Please select a valid option`);
            }
        });
    } catch (err) {
        console.error(err);
    }
}
