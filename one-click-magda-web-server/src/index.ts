import * as cors from "cors";
import * as helmet from "helmet";
import * as _ from "lodash";
import * as compression from "compression";
import * as express from "express";
import * as path from "path";
import * as URI from "urijs";
import * as yargs from "yargs";
import * as morgan from "morgan";
import createApiRouter from "./createApiRouter";
import createGoogleApiRouter from "./createGoogleApiRouter";
import defaultConfig from "./defaultConfig";

import getIndexFileContent from "./getIndexFileContent";

const coerceJson = (path?: string) => path && require(path);

const argv = yargs
    .config()
    .help()
    .option("listenPort", {
        describe: "The TCP/IP port on which the web server should listen.",
        type: "number",
        default: 6107
    })
    .option("baseExternalUrl", {
        describe: "The base external URL of the application.",
        type: "string",
        default: "http://localhost:6100"
    })
    .option("baseUrl", {
        describe:
            "The base URL of the MAGDA Gateway, for building the base URLs of the APIs when not manually specified. Can be relative.",
        type: "string",
        default: "/"
    })
    .option("googleOauthClientId", {
        describe: "Google Oauth Client Id",
        type: "string",
        demand: true,
        default: process.env.GOOGLE_OAUTH_CLIENT_ID
    })
    .option("googleOauthClientSecret", {
        describe: "Google Oauth Client Secret",
        type: "string",
        demand: true,
        default: process.env.GOOGLE_OAUTH_CLIENT_SECRET
    })
    .option("gapiIds", {
        describe: "Google Analytics ID(s)",
        type: "array",
        default: []
    })
    .option("helmetJson", {
        describe:
            "Path of the json that defines node-helmet options, as per " +
            "https://helmetjs.github.io/docs/. Node that this _doesn't_ " +
            "include csp options as these are a separate module. These will " +
            "be merged with the defaults specified in defaultConfig.ts.",

        type: "string",
        coerce: coerceJson
    })
    .option("cspJson", {
        describe:
            "Path of the json that defines node-helmet options, as per " +
            "https://helmetjs.github.io/docs/. These will " +
            "be merged with the defaults specified in defaultConfig.ts.",
        type: "string",
        coerce: coerceJson
    })
    .option("corsJson", {
        describe:
            "Path of the json that defines CORS options, as per " +
            "https://www.npmjs.com/package/cors. These will " +
            "be merged with the defaults specified in defaultConfig.ts.",
        type: "string",
        coerce: coerceJson
    }).argv;

var app = express();

app.use(morgan("combined"));

// GZIP responses where appropriate
app.use(compression());

// Set sensible secure headers
app.disable("x-powered-by");

app.use(helmet(_.merge({}, defaultConfig.helmet, argv.helmetJson as {})));
app.use(
    helmet.contentSecurityPolicy(_.merge({}, defaultConfig.csp, argv.cspJson))
);

// Set up CORS headers for all requests
const configuredCors = cors(
    _.merge({}, defaultConfig.cors, argv.corsJson as {})
);
app.options("*", configuredCors);
app.use(configuredCors);

const clientRoot = path.resolve(
    require.resolve("@magda/web-client/package.json"),
    ".."
);

const clientBuild = path.join(clientRoot, "build");
console.log("Client: " + clientBuild);

const webServerConfig = {
    baseUrl: addTrailingSlash(argv.baseUrl),
    baseExternalUrl: addTrailingSlash(argv.baseExternalUrl),
    gapiIds: argv.gapiIds
};

app.get("/server-config.js", function(req, res) {
    res.type("application/javascript");
    res.send(
        "window.magda_server_config = " + JSON.stringify(webServerConfig) + ";"
    );
});

app.use("/api", createApiRouter({}));

app.use(
    "/api/google",
    createGoogleApiRouter({
        clientId: argv.googleOauthClientId,
        clientSecret: argv.googleOauthClientSecret,
        baseExternalUrl: addTrailingSlash(argv.baseExternalUrl)
    })
);

function getIndexFileContentZeroArgs() {
    return getIndexFileContent(clientRoot);
}

app.get(["/", "/index.html*"], async function(req, res) {
    res.send(await getIndexFileContentZeroArgs());
});

// app.use("/admin", express.static(adminBuild));
app.use(express.static(clientBuild));

// URLs in this list will load index.html and be handled by React routing.
const topLevelRoutes = ["error"];

topLevelRoutes.forEach(topLevelRoute => {
    app.get("/" + topLevelRoute, async function(req, res) {
        res.send(await getIndexFileContentZeroArgs());
    });
    app.get("/" + topLevelRoute + "/*", async function(req, res) {
        res.send(await getIndexFileContentZeroArgs());
    });
});

// Proxy any other URL to 404 error page
const maxErrorDataUrlLength = 1500;
app.use("/", function(req, res) {
    let redirectUri: any = new URI("/error");
    const url =
        req.originalUrl.length > maxErrorDataUrlLength
            ? req.originalUrl.substring(0, maxErrorDataUrlLength)
            : req.originalUrl;
    const errorData = {
        errorCode: 404,
        url: url
    };
    redirectUri = redirectUri.escapeQuerySpace(false).search(errorData);
    res.redirect(303, redirectUri.toString());
});

app.listen(argv.listenPort);
console.log("Listening on port " + argv.listenPort);

process.on("unhandledRejection", (reason: string, promise: any) => {
    console.error(reason);
});

function addTrailingSlash(url: string) {
    if (!url) {
        return url;
    }

    if (url.lastIndexOf("/") !== url.length - 1) {
        return url + "/";
    } else {
        return url;
    }
}
