/* eslint-disable */
declare module "libxmljs2-xsd" {

    import {Document, ParserOptions} from "libxmljs2";

    export class Schema {
        constructor(schemaDoc: Document, schemaObj: Document);
        schemaDoc: Document;
        schemaObj: Document;
        validate(source: string | Document): Error[] | null;
        validateFile(source: string): Error[] | null;
    }
    export function parse(source: string, options?: ParserOptions): Schema;
    export function parseFile(sourceFile: string, options?: ParserOptions): Schema;

}
