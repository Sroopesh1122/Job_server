import { Router } from "express";
import { multerUploader ,multerUploader_resume } from "../middlewares/Multer.js";
import { deleteResume, deleteUploadImg, uploadImage, uploadResume } from "../controllers/UploadController.js";


export const UploaderRouter = Router();

UploaderRouter.post("/image",multerUploader.single("image"),uploadImage)
UploaderRouter.delete("/image",deleteUploadImg)

UploaderRouter.post("/resume",multerUploader_resume.single("resume"), uploadResume)
UploaderRouter.post("/delete-resume",deleteResume)