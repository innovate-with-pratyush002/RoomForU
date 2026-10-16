import { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password - RoomForU",
  description: "Reset your RoomForU account password securely via email verification code.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
