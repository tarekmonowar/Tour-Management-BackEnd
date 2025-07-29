import express, { Request, Response } from "express";
import cors from "cors";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { notFound } from "./app/middlewares/notFound";
import { router } from "./app/routes";
import cookieParser from "cookie-parser";
import passport from "passport";
import session from "express-session";
import "./app/config/passport";
import { envVars } from "./app/config/env";

const app = express();

// Middleware for parsing JSON and URL-encoded data  body-parser lage na
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("trust proxy", 1);
app.use(
  cors({
    origin: envVars.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(
  session({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// Setting up routes
app.use("/api/v1", router);

// Home route
app.get("/", (req: Request, res: Response) => {
  res.send("API Working with /api/v1");
});

// Catch-all route for undefined routes
app.use(notFound);

// Middleware for error handling and static file
app.use(globalErrorHandler);
export default app;
