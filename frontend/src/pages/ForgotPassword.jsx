import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import * as authApi from "../api/auth";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function ForgotPassword() {
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    const res = await authApi.forgotPassword(data.email);
    setMessage(res.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-bold text-slate-900">Forgot password</h1>
        <p className="mb-6 text-sm text-slate-500">
          Enter your email and we'll tell you what to do next.
        </p>

        {message ? (
          <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-700">{message}</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email", { required: "Email is required" })}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : "Submit"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login" className="text-brand hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
