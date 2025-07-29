import bcryptjs from "bcryptjs";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { IsActive, Role } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { envVars } from "./env";

// Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email", //it provide default username and password need rename to email and password as our schema
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
      try {
        const isUserExist = await User.findOne({ email });
        if (!isUserExist) {
          return done(null, false, { message: "User not found" });
        }

        if (!isUserExist.isVerified) {
          return done(null, false, { message: "User is not Verified" });
        }

        if (
          isUserExist.isActive === IsActive.BLOCKED ||
          isUserExist.isActive === IsActive.INACTIVE
        ) {
          return done(null, false, {
            message: `User is ${isUserExist.isActive}`,
          });
        }
        if (isUserExist.isDeleted) {
          return done(null, false, { message: "User is deleted" });
        }

        const isGoogleAuthenticated = isUserExist.auths.some(
          (providerObject) => providerObject.provider == "google",
        );

        if (isGoogleAuthenticated && !isUserExist.password) {
          return done(null, false, {
            message:
              "You have authenticated through Google.For login with credentials please first login with google and then set a password for your email",
          });
        }

        const isMatch = await bcryptjs.compare(
          password as string,
          isUserExist.password as string,
        );

        if (!isMatch) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, isUserExist);
      } catch (err) {
        console.log(err);
        return done(err);
      }
    },
  ),
);

// Google Strategy---> after success login and /callback redirect
passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackURL: envVars.GOOGLE_CALLBACK_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      //this function provided us to write custom code that need after success login by google
      try {
        const email = profile.emails?.[0].value.toLowerCase();
        if (!email) {
          return done(null, false, { message: "No Email Found" });
        }

        let user = await User.findOne({ email });
        if (!user) {
          user = new User({
            name: profile.displayName,
            email: email,
            picture: profile.photos?.[0].value,
            role: Role.USER,
            isVerified: true,
            auths: [
              {
                provider: "google",
                providerId: profile.id,
              },
            ],
          });
          await user.save();
        }

        if (user) {
          if (!user.isVerified) {
            return done(null, false, { message: "User is not verified" });
          }
          if (
            user.isActive === IsActive.BLOCKED ||
            user.isActive === IsActive.INACTIVE
          ) {
            return done(null, false, { message: `User is ${user.isActive}` });
          }
          if (user.isDeleted) {
            return done(null, false, { message: "User is Deleted" });
          }
        }
        return done(null, user);
      } catch (err) {
        console.log("Google Strategy Error", err);
        return done(err, false);
      }
    },
  ),
);

// Serialize & Deserialize FOR BOTH LOCAL AND GOOGLE
// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport.serializeUser((user: any, done) => {
  done(null, user._id); // Save only user ID in session
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Add user back to req.user on every request
  } catch (error) {
    done(error);
  }
});
