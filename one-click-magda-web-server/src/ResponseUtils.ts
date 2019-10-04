import { Response } from "express";
import { GaxiosError } from "gaxios";

export const error = (res: Response, error: Error | string = null) => {
    if (error instanceof GaxiosError) {
        res.status(500).send({
            isError: true,
            errorCode: error.code,
            errorMessage: error.message
        });
    } else if (error instanceof Error) {
        res.status(500).send({
            isError: true,
            errorMessage: error.message
        });
    } else if (typeof error === "string") {
        res.status(500).send({
            isError: true,
            errorMessage: error
        });
    } else {
        res.status(500).send({
            isError: true,
            errorMessage: `${error}`
        });
    }
};

interface resultType {
    [k: string]: any;
}

export const result = (res: Response, result: resultType) => {
    res.send({
        ...result,
        isError: false
    });
};
