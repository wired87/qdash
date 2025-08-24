import { Metadata } from "next";
import React from "react";
import QDash from "@/app/(site)/qdash/main";

export const metadata: Metadata = {
  title: "Blog Page - Solid SaaS Boilerplate",
  description: "This is Blog page for Solid Pro",
  // other metadata
};

const QDashMain = async () => {

  return (
    <>
      <QDash />
    </>
  );
};
export default QDashMain;
