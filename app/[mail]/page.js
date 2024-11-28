"use client";

import { useParams, useSearchParams } from "next/navigation";
import React from "react";

export default function MailPage() {
  const { mail } = useParams();
  const searchParams = useSearchParams();

  const from = searchParams.get("from");
  const subject = searchParams.get("subject");
  const body = searchParams.get("body");
  const time = searchParams.get("time");

  console.log(body);
  

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white p-4">
      <h1 className="text-black text-3xl font-bold">Mail ID: {mail}</h1>
      <div className="mt-4 text-black">
        <h2 className="text-xl font-bold">From: {from}</h2>
        <h3 className="text-lg">Subject: {subject}</h3>
        <p className="text-gray-700 mt-2">Body: {body}</p>
        <p className="text-gray-500 mt-2">Time: {time}</p>
      </div>
    </div>
  );
}
