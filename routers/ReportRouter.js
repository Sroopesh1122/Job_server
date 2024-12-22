import { Router } from "express";
import { getAllReports, getReportById, getReportCount, getTopReportedAccounts, reportProviderPost, reportUser } from "../controllers/ReportController.js";


export const ReportRouter = Router()

ReportRouter.post("/user",reportUser);
ReportRouter.post("/provider",reportProviderPost);
ReportRouter.get('/report-count/:accountId',getReportCount)
ReportRouter.get("/top-reported",getTopReportedAccounts);
ReportRouter.get("/:reportId",getReportById);// based on reportFor value ('user','provider')
ReportRouter.get("/",getAllReports); // based on reportFor value ('user','provider')


