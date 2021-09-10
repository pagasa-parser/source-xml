import PagasaParserXMLSource from "../../src/PagasaParserXMLSource";
import * as fs from "fs";
import * as path from "path";

describe("parsing tests", () => {

    test("near-original bulletin", () => {
        const source = new PagasaParserXMLSource(
            fs.readFileSync(path.join(__dirname, "..", "xml", "LowLevel.xml"))
        );

        fs.writeFileSync(
            path.join(__dirname, "..", "out", "LowLevel.json"),
            JSON.stringify(source.parse())
        );
    });

    test("formatted bulletin", () => {
        const source = new PagasaParserXMLSource(
            fs.readFileSync(path.join(__dirname, "..", "xml", "HighLevel.xml"))
        );

        fs.writeFileSync(
            path.join(__dirname, "..", "out", "HighLevel.json"),
            JSON.stringify(source.parse())
        );
    });

});
