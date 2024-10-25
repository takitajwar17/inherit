"use client";

import { useEffect } from "react";
import { SignUp } from "@clerk/nextjs";

const SignUpPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="flex justify-center mt-6">
        <SignUp afterSignUpUrl="dashboard" />
      </div>
    </>
  );
};

export default SignUpPage;
