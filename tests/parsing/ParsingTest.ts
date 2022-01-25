import PagasaParserXMLSource from "../../src/PagasaParserXMLSource";
import * as fs from "fs";
import * as path from "path";

describe("parsing tests", () => {

    const outDir = path.join(__dirname, "..", "out");
    if (!fs.existsSync(outDir))
        fs.mkdirSync(outDir);

    test("near-original bulletin", () => {
        const source = new PagasaParserXMLSource(
            fs.readFileSync(path.join(__dirname, "..", "xml", "LowLevel.xml"))
        );

        fs.writeFileSync(
            path.join(outDir, "LowLevel.json"),
            JSON.stringify(source.parse())
        );
    });

    test("formatted bulletin", () => {
        const source = new PagasaParserXMLSource(
            fs.readFileSync(path.join(__dirname, "..", "xml", "HighLevel.xml"))
        );

        fs.writeFileSync(
            path.join(outDir, "HighLevel.json"),
            JSON.stringify(source.parse())
        );
    });

});
