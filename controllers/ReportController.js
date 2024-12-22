import asyncHandler from "express-async-handler";
import { ReportModal } from "../modals/Reports.js";
import UserModal from "../modals/User.js";
import { providerModal } from "../modals/JobProvider.js";
import { jobApplicationModal } from "../modals/JobApplication.js";

// Add a Report
export const reportUser = asyncHandler(async (req, res) => {
  const {
    reportedBy,
    reportedTo,
    content,
    postId = null,
    reportFor = "user",
  } = req.body;

  if (!reportedBy || !reportedTo || !content) {
    throw new Error("All fileds Required");
  }

  const findReportedByAccount = await providerModal.findOne({
    company_id: reportedBy,
  });
  if (!findReportedByAccount) {
    throw new Error("Failed to report");
  }

  const findReportedToAccount = await UserModal.findOne({
    user_id: reportedTo,
  });
  if (!findReportedToAccount) {
    throw new Error("Failed to report");
  }

  const alreadyReport = await ReportModal.findOne({
    reportedBy: reportedBy,
    reportedTo: reportedTo,
    reportFor: reportFor,
  });
  if (alreadyReport) {
    throw new Error("Your have already reported this Account");
  }

  const newReport = await ReportModal.create({
    reportedBy,
    reportedTo,
    content,
    postId,
    reportFor,
  });

  if (!newReport) {
    throw new Error("Failed to report! Please try again.");
  }

  res.json({
    success: true,
    message: "Reported Successfully",
  });
});

//report Provider
export const reportProviderPost = asyncHandler(async (req, res) => {
  const {
    reportedBy,
    reportedTo,
    content,
    postId = null,
    reportFor = "provider",
  } = req.body;

  if (!reportedBy || !reportedTo || !content || !postId) {
    throw new Error("All fileds Required");
  }

  const findReportedByAccount = await UserModal.findOne({
    user_id: reportedBy,
  });
  if (!findReportedByAccount) {
    throw new Error("Failed to report");
  }

  const findReportedToAccount = await providerModal.findOne({
    company_id: reportedTo,
  });
  if (!findReportedToAccount) {
    throw new Error("Failed to report");
  }

  const findPost = await jobApplicationModal.findOne({ job_id: postId });
  if (!findPost) {
    throw new Error("Failed to report");
  }

  const alreadyReport = await ReportModal.findOne({
    reportedBy: reportedBy,
    reportedTo: reportedTo,
    postId: postId,
    reportFor: reportFor,
  });
  if (alreadyReport) {
    throw new Error("Your have already reported this Post");
  }

  const newReport = await ReportModal.create({
    reportedBy,
    reportedTo,
    content,
    postId,
    reportFor,
  });

  if (!newReport) {
    throw new Error("Failed to report! Please try again.");
  }

  res.json({
    success: true,
    message: "Reported Successfully",
  });
});

//Get All reports based on reportedFor field value
export const getAllReports = asyncHandler(async (req, res) => {
  const { reportFor, page = 1, limit = 10, reportedTo } = req.query;

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  if (
    isNaN(parsedPage) ||
    isNaN(parsedLimit) ||
    parsedPage < 1 ||
    parsedLimit < 1
  ) {
    throw new Error("Invalid page or limit values.");
  }

  let filter = {};

  if (reportFor) {
    filter = { ...filter, reportFor };
  }

  if (reportedTo) {
    filter = { ...filter, reportedTo };
  }

  const allReports = [];

  const totalData = await ReportModal.countDocuments(filter);

  let findReports = await ReportModal.find(filter)
    .sort({ createdAt: -1 })
    .skip((parsedPage - 1) * parsedLimit)
    .limit(parsedLimit);

  for (let report of findReports) {
    let reportedByDetails = null;
    let reportedToDetails = null;
    let postDetails = null;
    if (report.reportFor === "user") {
      reportedByDetails = await providerModal.findOne(
        { company_id: report.reportedBy },
        { auth_details: 0 }
      );
      reportedToDetails = await UserModal.findOne(
        { user_id: report.reportedTo },
        { auth_details: 0 }
      );
    }
    if (report.reportFor === "provider") {
      reportedToDetails = await providerModal.findOne(
        { company_id: report.reportedTo },
        { auth_details: 0 }
      );
      reportedByDetails = await UserModal.findOne(
        { user_id: report.reportedBy },
        { auth_details: 0 }
      );
      postDetails = await jobApplicationModal.findOne({
        job_id: report.postId,
      });
    }
    allReports.push({
      report,
      reportedTo: reportedToDetails,
      reportedBy: reportedByDetails,
      postDetails,
    });
  }
  res.json({
    totalData,
    reports: allReports,
  });
});

//Get Report By reportId
export const getReportById = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  if (!reportId) {
    throw new Error("Report Id reuired");
  }

  const report = await ReportModal.findOne({ report_id: reportId });
  let reportDetails = {};

  if (report) {
    let reportedByDetails = null;
    let reportedToDetails = null;
    let postDetails = null;
    if (report.reportFor === "user") {
      reportedByDetails = await providerModal.findOne(
        { company_id: report.reportedBy },
        { auth_details: 0 }
      );
      reportedToDetails = await UserModal.findOne(
        { user_id: report.reportedTo },
        { auth_details: 0 }
      );
    }
    if (report.reportFor === "provider") {
      reportedToDetails = await providerModal.findOne(
        { company_id: report.reportedTo },
        { auth_details: 0 }
      );
      reportedByDetails = await UserModal.findOne(
        { user_id: report.reportedBy },
        { auth_details: 0 }
      );
      postDetails = await jobApplicationModal.findOne({
        job_id: report.postId,
      });
    }
    reportDetails = {
      ...report,
      reportedTo: reportedToDetails,
      reportedBy: reportedByDetails,
      postDetails,
    };
  }

  return res.json(reportDetails);
});

//Returns Report Count of speciific Account
export const getReportCount = asyncHandler(async (req, res) => {
  const { accountId } = req.params;

  if (!accountId) {
    throw new Error("AccountId Required");
  }

  const totalReports = await ReportModal.find({ reportedTo: accountId });

  return res.json(totalReports);
});

//To get top reported user accounts;
export const getTopReportedAccounts = asyncHandler(async (req, res) => {

  const {limit=10} = req.query;

  const topReportedUsers = await ReportModal.aggregate([
    {
      $group: {
        _id: "$reportedTo",
        reportCount: { $sum: 1 },
      },
    },
    { $sort: { reportCount: -1 , } },
    { $limit: limit }
  ]);
  res.json(topReportedUsers);
});
