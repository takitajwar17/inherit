"use client";

import { useEffect } from "react";
import { SignIn } from "@clerk/nextjs";

const SignInPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="flex justify-center w-full mt-6">
        <SignIn afterSignInUrl="dashboard" />
      </div>
    </>
  );
};

export default SignInPage;
