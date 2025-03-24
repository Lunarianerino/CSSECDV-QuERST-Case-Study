"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <>
      <h1>
        This is the main page.
      </h1>
      <Button onClick={() => router.push("/exams")}>
        Take me to the exams page.
      </Button>
    </>

  );
}

