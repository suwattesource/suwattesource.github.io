import {NetworkRequest} from "@suwatte/daisuke";
import {AUTH_COOKIE} from "./constants";
import {GlobalStore} from "./store";

export async function AuthInterceptor(request: NetworkRequest) {
    const authCookie = await SecureStore.string("auth_cookie") || "";
    request.cookies = [
        {
            name: AUTH_COOKIE,
            value: authCookie
        }
    ]
    return request;
}

export async function getAPIUrl(apiName: string): Promise<string> {
    const domain = await GlobalStore.getDomain()
    return `https://f.${domain.slice(8)}/Comic/Services/ComicService.asmx/${apiName}`
}

export async function isLoggedIn(): Promise<boolean> {
    const token = await SecureStore.string("token");
    return token != null
}

