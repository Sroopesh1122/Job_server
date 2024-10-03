import crypto from "crypto";

export const getRandomIds = ({prefix=''})=>{
    return prefix+crypto.randomBytes(4).toString('hex').slice(0, 8)
}