import * as fs from "fs";
import * as path from "path";
import { memoize } from "lodash";

/**
 * Gets the base index html file.
 *
 * @param clientRoot The root of the client directory to get the file from.
 */
function getIndexHtml(clientRoot: string): Promise<string> {
  return new Promise((resolve, reject) =>
    fs.readFile(
      path.join(clientRoot, "build/index.html"),
      {
        encoding: "utf-8"
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    )
  );
}

/**
 * getIndexHtml, but memoized so that it's not repeatedly accessing a file.
 */
const memoizedGetIndexHtml = memoize(getIndexHtml);

/**
 * Gets the content of the index.html file, including dynamic portions.
 *
 * @param clientRoot The base of the client directory
 * @param useLocalStyleSheet Whether to use a local stylesheet instead of the content api
 * @param contentApiBaseUrlInternal The base URL of the content api
 */
async function getIndexFileContent(clientRoot: string) {
  return await memoizedGetIndexHtml(clientRoot);
}

export default getIndexFileContent;
