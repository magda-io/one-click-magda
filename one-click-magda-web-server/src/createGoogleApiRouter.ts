import * as express from "express";
import { Router } from "express";
import { google } from "googleapis";
import * as ResponseUtils from "./ResponseUtils";
import { GaxiosError } from "gaxios";

export interface optionsType {
    clientId: string;
    clientSecret: string;
    baseExternalUrl: string;
}

/**
 * We need the following scope for the whole deployment process:
 *
 */
const scopes = [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/cloud-identity.groups",
    "https://www.googleapis.com/auth/service.management"
];

export default function createGoogleApiRouter(options: optionsType): Router {
    const router: Router = express.Router();
    router.use(express.json());

    const redirectUrl = `${options.baseExternalUrl}redirect`;

    function getClient() {
        return new google.auth.OAuth2(
            options.clientId,
            options.clientSecret,
            redirectUrl
        );
    }

    /**
     * Generates an authentication URL
     */
    router.get("/auth/authUrl", function(req, res) {
        try {
            const oauth2Client = getClient();

            const url = oauth2Client.generateAuthUrl({
                access_type: "offline",
                scope: scopes
            });

            ResponseUtils.result(res, {
                url
            });
        } catch (e) {
            ResponseUtils.error(res, e);
        }
    });

    /**
     * Retrieve access token / refresh token via auth code
     */
    router.get("/auth/tokens/:code", async function(req, res) {
        try {
            const code = req.params.code;
            if (!code) {
                throw new Error(
                    "Authorization code is required to access this API!"
                );
            }

            const oauth2Client = getClient();

            const { tokens } = await oauth2Client.getToken(code);

            ResponseUtils.result(res, {
                tokens
            });
        } catch (e) {
            ResponseUtils.error(res, e);
        }
    });

    /**
     * Enable a service API.
     * Expect JSON:
     * {
     *   tokens: access tokens
     *   serviceName: api server name
     *   projectId (optional): the project id
     * }
     *
     * Some APIs we will want to enable:
     * Please note: billing needs to be enabled before the APIs can be enabled
     * - containerregistry.googleapis.com
     * - dns.googleapis.com
     * - compute.googleapis.com
     * - iam.googleapis.com
     * - iamcredentials.googleapis.com
     * - container.googleapis.com
     */
    router.post("/service/enable", async function(req, res) {
        try {
            const requestData = req.body;
            if (!requestData.tokens) {
                throw new Error(
                    "Authorization `tokens` parameter is required to access this API!"
                );
            }
            if (!requestData.serviceName) {
                throw new Error(
                    "`serviceName` parameter is required to access this API!"
                );
            }
            const oauth2Client = getClient();
            oauth2Client.setCredentials(requestData.tokens);

            const params: any = {
                auth: oauth2Client,
                serviceName: requestData.serviceName
            };

            if (requestData.projectId) {
                params.requestBody = {
                    consumerId: `project:${requestData.projectId}`
                };
            }

            const servicemanagement = google.servicemanagement("v1");

            const responseData = await servicemanagement.services.enable(
                params
            );

            ResponseUtils.result(res, responseData.data);
        } catch (e) {
            ResponseUtils.error(res, e);
        }
    });

    /**
     * Get info of the project
     * Expect JSON:
     * {
     *   tokens: access tokens
     *   projectId: the project id
     * }
     *
     */
    router.post("/project/get", async function(req, res) {
        try {
            const requestData = req.body;
            if (!requestData.tokens) {
                throw new Error(
                    "Authorization `tokens` parameter is required to access this API!"
                );
            }
            if (!requestData.projectId) {
                throw new Error(
                    "`projectId` parameter is required to access this API!"
                );
            }
            const oauth2Client = getClient();
            oauth2Client.setCredentials(requestData.tokens);

            const cloudresourcemanager = google.cloudresourcemanager("v1");

            const responseData = await cloudresourcemanager.projects.get({
                projectId: requestData.projectId
            });

            ResponseUtils.result(res, responseData.data);
        } catch (e) {
            ResponseUtils.error(res, e);
        }
    });

    /**
     * Create a project
     * Expect JSON:
     * {
     *   tokens: access tokens
     *   projectId: a project id (Note: must be unique globally)
     *   name (Optional): project name
     *   labels (Optional): type: object
     *   // --- other support fields see google REST API documents
     * }
     *
     */
    router.post("/project/create", async function(req, res) {
        try {
            const requestData = req.body;
            if (!requestData.tokens) {
                throw new Error(
                    "Authorization `tokens` parameter is required to access this API!"
                );
            }
            if (!requestData.projectId) {
                throw new Error(
                    "`projectId` parameter is required to access this API!"
                );
            }
            const oauth2Client = getClient();
            oauth2Client.setCredentials(requestData.tokens);

            const cloudresourcemanager = google.cloudresourcemanager("v1");

            let requestBody = { ...requestData };
            delete requestBody.tokens;

            const responseData = await cloudresourcemanager.projects.create({
                requestBody
            });

            ResponseUtils.result(res, responseData.data);
        } catch (e) {
            ResponseUtils.error(res, e);
        }
    });

    /**
     * List all billing accounts
     * Expect JSON:
     * {
     *   tokens: access tokens
     *   pageSize: the size of the page items
     *   pageToken: the token for pagination
     *   other parameters see documents
     * }
     *
     */
    router.post("/billingAccount/list", async function(req, res) {
        try {
            const requestData = req.body;
            if (!requestData.tokens) {
                throw new Error(
                    "Authorization `tokens` parameter is required to access this API!"
                );
            }
            const oauth2Client = getClient();
            oauth2Client.setCredentials(requestData.tokens);

            const cloudbilling = google.cloudbilling("v1");

            let params = { ...requestData };
            delete params.tokens;

            const responseData = await cloudbilling.billingAccounts.list(
                params
            );

            ResponseUtils.result(res, responseData.data);
        } catch (e) {
            ResponseUtils.error(res, e);
        }
    });

    /**
     * Get a project's billing info
     * Expect JSON:
     * {
     *   tokens: access tokens
     *   projectId: the id of the project
     *   fields (optional): a list of fields to select
     * }
     *
     */
    router.post("/billingAccount/getProjectBillingInfo", async function(
        req,
        res
    ) {
        try {
            const requestData = req.body;
            if (!requestData.tokens) {
                throw new Error(
                    "Authorization `tokens` parameter is required to access this API!"
                );
            }
            if (!requestData.projectId) {
                throw new Error(
                    "`projectId` parameter is required to access this API!"
                );
            }
            const oauth2Client = getClient();
            oauth2Client.setCredentials(requestData.tokens);

            const cloudbilling = google.cloudbilling("v1");

            const params: any = {
                name: `projects/${requestData.projectId}`
            };
            if (requestData.fields) {
                params.fields = requestData.fields;
            }

            const responseData = await cloudbilling.projects.getBillingInfo(
                params
            );

            ResponseUtils.result(res, responseData.data);
        } catch (e) {
            ResponseUtils.error(res, e);
        }
    });

    /**
     * Update a project's billing info
     * Expect JSON:
     * {
     *   tokens: access tokens
     *   projectId: the id of the project
     *   billingAccountName: e.g. "billingAccounts/01349C-33641E-9CBCB4"
     *   billingEnabled: true //--- whether the billingAccount should be enabled or not
     * }
     *
     */
    router.post("/billingAccount/updateProjectBillingInfo", async function(
        req,
        res
    ) {
        try {
            const requestData = req.body;
            if (!requestData.tokens) {
                throw new Error(
                    "Authorization `tokens` parameter is required to access this API!"
                );
            }
            if (!requestData.projectId) {
                throw new Error(
                    "`projectId` parameter is required to access this API!"
                );
            }
            if (!requestData.billingAccountName) {
                throw new Error(
                    "`billingAccountName` parameter is required to access this API!"
                );
            }
            if (!requestData.billingEnabled) {
                throw new Error(
                    "`billingEnabled` parameter is required to access this API!"
                );
            }
            const oauth2Client = getClient();
            oauth2Client.setCredentials(requestData.tokens);

            const cloudbilling = google.cloudbilling("v1");

            const params: any = {
                name: `projects/${requestData.projectId}`
            };
            if (requestData.fields) {
                params.fields = requestData.fields;
            }

            const responseData = await cloudbilling.projects.updateBillingInfo({
                name: `projects/${requestData.projectId}`,
                requestBody: {
                    billingAccountName: requestData.billingAccountName,
                    billingEnabled: requestData.billingEnabled
                }
            });

            ResponseUtils.result(res, responseData.data);
        } catch (e) {
            ResponseUtils.error(res, e);
        }
    });

    return router;
}
