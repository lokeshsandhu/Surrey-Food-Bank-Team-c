import { JwtPayload } from "../crypto/jwt";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
