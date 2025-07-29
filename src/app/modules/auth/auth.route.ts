import { NextFunction, Request, Response, Router } from "express";
import { AuthContoller } from "./auth.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import passport from "passport";
import { envVars } from "../../config/env";
const router = Router();

//Route api/v1/auth/login

router.post("/login", AuthContoller.credentialsLogin);
router.post("/refresh-token", AuthContoller.getNewAccessToken);
router.post("/logout", AuthContoller.logout);
router.post(
  "/change-password",
  checkAuth(...Object.values(Role)),
  AuthContoller.changePassword,
);
router.post(
  "/set-password",
  checkAuth(...Object.values(Role)),
  AuthContoller.setPassword,
);
// Frontend -> forget-password -> email -> user status check -> short expiration token (valid for 10 min) -> email -> Fronted Link http://localhost:5173/reset-password?email=saminisrar1@gmail.com&token=token -> frontend e  query theke user er email and token extract anbo -> new password user theke nibe -> backend er /reset-password api -> authorization = token -> newPassword -> token verify -> password hash -> save user password

router.post("/forgot-password", AuthContoller.forgotPassword);
router.post(
  "/reset-password",
  checkAuth(...Object.values(Role)),
  AuthContoller.resetPassword,
);

//frontend->(backend)/api/v1/auth/google -> passport ->Google OAuth consent -> gmail login -> successful -> (backend)/api/v1/auth/google/callback -> DB store ->token create
router.get("/google", (req: Request, res: Response, next: NextFunction) => {
  const redirect = req.query.redirect || "/";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: redirect as string,
  })(req, res, next);
});

//after success it automatic call this route
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${envVars.FRONTEND_URL}/login?error=There is some issues with your account. Please contact with out support team!`,
  }),
  AuthContoller.googleCallback,
);
export const AuthRoutes = router;
