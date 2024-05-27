import {NetworkRequest} from "@suwatte/daisuke";
import {SESSION_COOKIE} from "./constants";
import {GlobalStore} from "./store";

export async function AuthInterceptor(request: NetworkRequest) {
    const session = await SecureStore.string("session") || "";
    request.cookies = [
        {
            name: SESSION_COOKIE,
            value: session
        }
    ]
    return request;
}

export function generateCookie(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

export async function getAPIUrl(apiName: string): Promise<string> {
    const domain = await GlobalStore.getDomain()
    return `https://f.${domain.slice(8)}/Comic/Services/ComicService.asmx/${apiName}`
}


export async function isLoggedIn(): Promise<boolean> {
    const token = await SecureStore.string("token");
    return token != null
}

