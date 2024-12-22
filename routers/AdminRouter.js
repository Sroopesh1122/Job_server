import { Router } from "express";
import { blockUser, getActiveUserCount, getAllAccountAndApplicationsCount, getAllFreelancers, getAllProviders, getAllSeekers, getAllUsersCount, getRegistrationCount, unBlockkUser, verifyProvider } from "../controllers/AdminController.js";


export const AdminRouter = Router();

AdminRouter.post("/user/block",blockUser);
AdminRouter.post("/user/unblock",unBlockkUser);
AdminRouter.get("/all-data-counts",getAllAccountAndApplicationsCount);
AdminRouter.get("/seekers",getAllSeekers); //to get seekers based on filter (blocked or not)
AdminRouter.get("/providers",getAllProviders); //to get provider based on filter (blocked or not)
AdminRouter.get("/freelancers",getAllFreelancers); //to get freelancer based on filter (blocked or not)
AdminRouter.get("/satistics/all-users",getAllUsersCount);
AdminRouter.get("/satistics/registration",getRegistrationCount);
AdminRouter.get("/satistics/active-user",getActiveUserCount);
AdminRouter.post("/provider/verify" ,verifyProvider);
