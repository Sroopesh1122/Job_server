import { Router } from "express";
import { getAllReports, getReportById, getReportCount, reportProviderPost, reportUser } from "../controllers/ReportController";


export const ReportRouter = Router()

ReportRouter.post("/user",reportUser);
ReportRouter.post("/provider",reportProviderPost);
ReportRouter.get('/report-count/:accountId',getReportCount)
ReportRouter.get("/:reportId",getReportById);
ReportRouter.get("/",getAllReports); // based on reportFor value ('user','provider')


