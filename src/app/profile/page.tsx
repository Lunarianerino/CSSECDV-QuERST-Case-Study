"use client";
import DashboardLayout from "@/components/dashboard-layout";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Eye, EyeOff, Loader2} from "lucide-react";
import {ChangePasswordFormValues, changePasswordSchema} from "@/lib/validations/auth";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect, useMemo, useState} from "react";
import {toast} from "sonner";
import {useMutation} from "@tanstack/react-query";
import {changePassword} from "@/lib/actions/userActions";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";

const Page = () => {
	const [showOldPassword, setShowOldPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<ChangePasswordFormValues>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: {
			oldPassword: "",
			newPassword: "",
			confirmPassword: ""
		},
		mode: "onChange",
		reValidateMode: "onChange",
	});

	const watchOldPassword = form.watch("oldPassword");
	const watchNewPassword = form.watch("newPassword");
	const watchConfirmPassword = form.watch("confirmPassword");

	const {mutateAsync, isPending, isError, isSuccess, error} = useMutation({
		mutationKey: ['change-password'],
		mutationFn: async (data: ChangePasswordFormValues) => {
			const res = await changePassword(data.oldPassword, data.newPassword, data.confirmPassword);

			if (!res) {
				throw new Error("Something went wrong");
			}

			if (!res.success) {
				throw new Error(res.error || "Something went wrong");
			}

			return res;
		},
	});

	const onSubmit = async (data: ChangePasswordFormValues) => {
		await mutateAsync(data);
	}

	useEffect(() => {
		if (isError) {
			toast.error(error.message, {
				id: "change-password",
			});
		}
	}, [isError, error]);

	useEffect(() => {
		if (isSuccess) {
			toast.success("Password successfully updated", {id: "change-password"});
			form.reset();
		}
	}, [isSuccess]);

	useEffect(() => {
		if (isPending) {
			toast.loading("Changing password...", {id: "change-password"});
		}
	}, [isPending]);

	const buttonText = useMemo(() => {
		if (isPending) {
			return 'Changing password...';
		} else {
			return 'Change password';
		}
	}, [isPending]);

	return (
		<DashboardLayout title={"Profile"}>
			<Card>
				<CardHeader>
					<CardTitle>Change Password</CardTitle>
				</CardHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<CardContent className="space-y-4">

							<FormField
								control={form.control}
								disabled={isPending}
								name="oldPassword"
								render={({field}) => (
									<FormItem>
										<FormLabel>Old Password</FormLabel>
										<FormControl>
											<div className="relative">
												<Input
													type={showOldPassword ? "text" : "password"}
													placeholder="********"
													{...field}
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="absolute right-0 top-0 h-full px-3 py-2"
													onClick={() => setShowOldPassword(!showOldPassword)}
												>
													{showOldPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
												</Button>
											</div>
										</FormControl>
										<FormMessage/>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="newPassword"
								disabled={isPending}
								render={({field}) => (
									<FormItem>
										<FormLabel>New Password</FormLabel>
										<FormControl>
											<div className="relative">
												<Input
													type={showNewPassword ? "text" : "password"}
													placeholder="********"
													{...field}
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="absolute right-0 top-0 h-full px-3 py-2"
													onClick={() => setShowNewPassword(!showNewPassword)}
												>
													{showNewPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
												</Button>
											</div>
										</FormControl>
										<FormMessage/>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="confirmPassword"
								disabled={isPending}
								render={({field}) => (
									<FormItem>
										<FormLabel>Confirm Password</FormLabel>
										<FormControl>
											<div className="relative">
												<Input
													type={showConfirmPassword ? "text" : "password"}
													placeholder="********"
													{...field}
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="absolute right-0 top-0 h-full px-3 py-2"
													onClick={() => setShowConfirmPassword(!showConfirmPassword)}
												>
													{showConfirmPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
												</Button>
											</div>
										</FormControl>
										<FormMessage/>
									</FormItem>
								)}
							/>
						</CardContent>
						<CardFooter>

							<Button type="submit" className="w-full" disabled={isPending}>
								{isPending && <Loader2 className="animate-spin"/>}
								{buttonText}
							</Button>
						</CardFooter>

					</form>
				</Form>
			</Card>
		</DashboardLayout>
	)
}

export default Page;
