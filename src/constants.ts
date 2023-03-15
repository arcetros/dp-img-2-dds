import { QuestionCollection } from "inquirer";

export const CONVERT_OPTIONS: QuestionCollection = [
    {
        name: "convert_options",
        message: "Select image conversion options (use arrows key)",
        type: "list",
        choices: [
            { type: "choice", value: 0, name: "Single image convert" },
            { type: "choice", value: 1, name: "Convert all images" }
        ]
    }
];
