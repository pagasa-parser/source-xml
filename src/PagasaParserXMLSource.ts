import * as cheerio from "cheerio";
import * as xsd from "libxmljs2-xsd";
import {
    Area,
    AreaExtractor,
    Bulletin,
    BulletinInfo,
    Cyclone,
    ParsingError,
    TCWSLevel,
    PagasaParserSource
} from "pagasa-parser";
import * as path from "path";
import {Landmass} from "pagasa-parser/build/typedefs/Area";

export default class PagasaParserXMLSource extends PagasaParserSource {

    static readonly schema =
        xsd.parseFile(path.join(__dirname, "..", "schema", "bulletin.xsd"));

    private readonly $ : cheerio.Root;

    /**
     * Loads in the source. This will validate the given XML and check if it's
     * a valid PAGASA Bulletin XML file.
     *
     * @param data The data to read
     * @param options Additional options for Cheerio.
     */
    constructor(data : string | Buffer, options?: cheerio.CheerioParserOptions) {
        super();
        const validationErrors = PagasaParserXMLSource.schema.validate(data.toString());
        if (validationErrors != null) {
            throw validationErrors[0];
        }

        this.$ = cheerio.load(
            data,
            Object.assign({
                xmlMode: true
            }, options ?? {})
        );
    }

    parse() : Bulletin {
        return {
            info: this.parseBulletinInfo(),
            cyclone: this.parseCycloneInfo(),
            signals: {
                1: this.parseSignal(1),
                2: this.parseSignal(2),
                3: this.parseSignal(3),
                4: this.parseSignal(4),
                5: this.parseSignal(5)
            }
        };
    }

    protected parseCycloneInfo() : Cyclone {
        const $ = this.$;

        const cyclone = $("bulletin > cyclone");
        if (cyclone == null)
            throw new ParsingError("Missing <bulletin> child: cyclone");

        const cycloneName = cyclone.find("name");
        const cycloneIntl = cyclone.find("intl-name");
        const cyclonePrevailing = cyclone.find("prevailing");
        const cycloneCenter = cyclone.find("center");
        const cycloneMovement = cyclone.find("movement");

        const centerLatitude = cycloneCenter.find("latitude");
        const centerLongitude = cycloneCenter.find("longitude");

        let movementDirection = "";
        let movementDirectionCardinals = cycloneMovement.find("cardinal");
        if (movementDirectionCardinals.length > 0) {
            movementDirectionCardinals.each((i, e) => {
                const direction = $(e).text();
                movementDirection += direction[0].toUpperCase();
            });
        }
        let movementSpeed = cycloneMovement.find("speed").text();

        return <Cyclone>{
            name: cycloneName.text(),
            internationalName: cycloneIntl?.text() ?? undefined,
            prevailing: cyclonePrevailing?.text() ? cyclonePrevailing.text() === "true" : undefined,
            center: {
                lat: +centerLatitude.text(),
                lon: +centerLongitude.text()
            },
            movement: {
                direction: movementDirection,
                speed: isNaN(+movementSpeed) ? movementSpeed : +movementSpeed
            }
        };
    }

    protected parseBulletinInfo() : BulletinInfo {
        const $ = this.$;

        const infoTitle = $("bulletin > title");
        const infoCount = $("bulletin > count");
        const infoURL = $("bulletin > url");
        const infoIssued = $("bulletin > issued");
        const infoExpires = $("bulletin > expires");
        const infoSummary = $("bulletin > summary");

        return <BulletinInfo>{
            title: infoTitle.text(),
            count: +infoCount.text(),
            url: infoURL.text(),
            issued: new Date(infoIssued.text()),
            expires: new Date(infoExpires.text()),
            summary: infoSummary.text()
        };
    }

    protected parseSignal(signal : 1 | 2 | 3 | 4 | 5) : TCWSLevel {
        if (this.$(`signals > tcws${signal}`).length === 0)
            return null;

        const areas = {
            [Landmass.Luzon]: this.parseSignalAreas(signal, Landmass.Luzon),
            [Landmass.Visayas]: this.parseSignalAreas(signal, Landmass.Visayas),
            [Landmass.Mindanao]: this.parseSignalAreas(signal, Landmass.Mindanao)
        };

        return {
            areas: areas
        };
    }

    protected parseSignalAreas(signal : 1 | 2 | 3 | 4 | 5, landmass : Landmass) : Area[] {
        const $ = this.$;

        const signalAreas = $(`signals > tcws${signal}`);

        if (signalAreas.length === 0)
            return [];

        const landmassElement = signalAreas.find(Landmass[landmass].toLowerCase());
        if (landmassElement.length === 0)
            return [];

        const areas = [];
        const signalLocations = landmassElement.find("location");
        if (signalLocations.length > 0) {
            signalLocations.each((i, e) => {
                const location = $(e);

                const locationData : Record<string, any> = {};

                locationData["name"] = location.find("name").text();
                locationData["part"] = location.find("part").text() === "true";
                if (locationData["part"]) {
                    locationData["includes"] = (() => {
                        const includes : Record<string, any> = {};

                        includes["type"] = location.find("includes > type").text();
                        includes["term"] = location.find("includes > term").text();
                        includes["part"] = location.find("includes > part").text();
                        if (location.find("objects").length > 0) {
                            includes["objects"] = [];
                            location.find("includes > objects > object").each((i2, e2) => {
                                includes["objects"].push($(e2).text());
                            });
                        }

                        return includes;
                    })();
                }
                const locationIslands = location.find("islands");
                if (locationIslands.length > 0) {
                    locationData["islands"] = [];
                    locationIslands.find("island").each((i, e) => {
                        locationData["islands"].push({
                            name: $(e).find("name").text(),
                            part: false
                        });
                    });
                }

                areas.push(locationData as Area);
            });
        } else {
            // String type. Should extract.
            const extractor = new AreaExtractor(
                landmassElement.text()
                    .replace(/\s{2,}/g, " ")
            );

            areas.push(
                ...extractor.extractAreas()
            );
        }

        return areas;
    }

}
