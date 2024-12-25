import { Router } from "express";
import { blockUser, getActiveUserCount, getAllAccountAndApplicationsCount, getAllFreelancers, getAllProviders, getAllSeekers, getAllUsersCount, getRegistrationCount, unBlockkUser, verifyProvider, adminSignUp, adminSignIn, sendUserOtp, verifyUserOtp, AdminForgotPasswordHandler, AdminPasswordResetHandler, getAdminDetails } from "../controllers/AdminController.js";
import { authAdminMiddleware, isAdmin } from "../middlewares/AuthHandler.js";


export const AdminRouter = Router();

AdminRouter.post("/signup", adminSignUp);
AdminRouter.post("/signin", adminSignIn);

AdminRouter.post("/send-otp", sendUserOtp);
AdminRouter.post("/verify-otp", verifyUserOtp);

AdminRouter.post("/forgot-password", AdminForgotPasswordHandler);
AdminRouter.post("/reset-password/:token", AdminPasswordResetHandler);

// AdminRouter.use(authAdminMiddleware);
// AdminRouter.use(isAdmin);

AdminRouter.get("/get-admin",authAdminMiddleware,getAdminDetails);

AdminRouter.post("/user/block",authAdminMiddleware,blockUser);
AdminRouter.post("/user/unblock",authAdminMiddleware,unBlockkUser);
AdminRouter.get("/all-data-counts",authAdminMiddleware,getAllAccountAndApplicationsCount);
AdminRouter.get("/seekers",authAdminMiddleware,getAllSeekers); //to get seekers based on filter (blocked or not)
AdminRouter.get("/providers",authAdminMiddleware,getAllProviders); //to get provider based on filter (blocked or not)
AdminRouter.get("/freelancers",authAdminMiddleware,getAllFreelancers); //to get freelancer based on filter (blocked or not)
AdminRouter.get("/satistics/all-users",authAdminMiddleware,getAllUsersCount);
AdminRouter.get("/satistics/registration",authAdminMiddleware,getRegistrationCount);
AdminRouter.get("/satistics/active-user",authAdminMiddleware,getActiveUserCount);
AdminRouter.post("/provider/verify",authAdminMiddleware,verifyProvider);
