import { Router } from "express";
import { multerUploader } from "../middlewares/Multer.js";
import { deleteUploadImg, uploadImage } from "../controllers/UploadController.js";


export const UploaderRouter = Router();

UploaderRouter.post("/image",multerUploader.single("image"),uploadImage)
UploaderRouter.delete("/image",deleteUploadImg)