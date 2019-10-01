declare global {
  interface Window {
    magda_client_homepage_config: any;
    magda_server_config: any;
  }
}

// Local minikube/docker k8s cluster
// const fallbackApiHost = "http://localhost:30100/";
// Dev server
const fallbackApiHost = "http://localhost:6108/";

const serverConfig: {
  baseUrl?: string;
  baseExternalUrl?: string;
  gapiIds?: Array<string>;
} = window.magda_server_config || {};

const baseUrl = serverConfig.baseUrl || fallbackApiHost;
const baseExternalUrl =
  baseUrl === "/"
    ? window.location.protocol + "//" + window.location.host + "/"
    : baseUrl;

const fetchOptions: RequestInit =
  `${window.location.protocol}//${window.location.host}/` !== baseUrl
    ? {
        credentials: "include"
      }
    : {
        credentials: "same-origin"
      };

export const config = {
  baseUrl,
  baseExternalUrl,
  fetchOptions,
  gapiIds: serverConfig.gapiIds || []
};
