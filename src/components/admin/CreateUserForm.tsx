import {useState} from "react";
import {useForm} from "react-hook-form";
import {CreateUserFormValues, createUserSchema} from "@/lib/validations/auth";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {createUser} from "@/lib/actions/userActions";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {AccountType} from "@/models/account";
import {Button} from "@/components/ui/button";
import {Eye, EyeOff} from "lucide-react";

export function CreateUserForm({onSuccess}: { onSuccess?: () => void }) {
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const form = useForm<CreateUserFormValues>({
		resolver: zodResolver(createUserSchema),
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
			name: "",
			userType: undefined,
		},
		mode: "onChange",
		reValidateMode: "onChange",
	});
	const watchPassword = form.watch("password");
	const watchConfirmPassword = form.watch("confirmPassword");

	async function onSubmit(user: CreateUserFormValues) {
		if (watchPassword !== watchConfirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		setIsLoading(true);
		toast.loading("Adding new user...", {id: "create-user"});

		try {
			const c = await createUser(user);
			if (!c.success) {
				toast.error(c.error, {id: "create-user"});
				return;
			}
			toast.success("New User Created", {id: "create-user"});
			if (onSuccess) onSuccess();
		} catch (error) {
			console.error(error);
			toast.error("An error occurred while creating new user", {id: "create-user"});
			return;
		} finally {
			form.reset();
			setIsLoading(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({field}) => (
						<FormItem>
							<FormLabel>Full Name</FormLabel>
							<FormControl>
								<Input placeholder="Enter full name" {...field} />
							</FormControl>
							<FormMessage/>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="userType"
					render={({field}) => (
						<FormItem className="space-y-3">
							<FormLabel>User type</FormLabel>
							<FormControl>
								<RadioGroup
									onValueChange={field.onChange}
									defaultValue={field.value}
									className="flex flex-col"
								>
									<FormItem className="flex items-center space-x-3 space-y-0">
										<FormControl>
											<RadioGroupItem value={AccountType.STUDENT}/>
										</FormControl>
										<FormLabel className="font-normal">Student</FormLabel>
									</FormItem>
									<FormItem className="flex items-center space-x-3 space-y-0">
										<FormControl>
											<RadioGroupItem value={AccountType.TUTOR}/>
										</FormControl>
										<FormLabel className="font-normal">Tutor</FormLabel>
									</FormItem>
								</RadioGroup>
							</FormControl>
							<FormMessage/>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="email"
					render={({field}) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input placeholder="email@example.com" {...field} />
							</FormControl>
							<FormMessage/>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="password"
					render={({field}) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<div className="relative">
									<Input
										type={showPassword ? "text" : "password"}
										placeholder="********"
										{...field}
									/>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="absolute right-0 top-0 h-full px-3 py-2"
										onClick={() => setShowPassword(!showPassword)}
									>
										{showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
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
				<Button type="submit" className="w-full" disabled={isLoading}>
					{isLoading ? 'Saving...' : 'Create User'}
				</Button>
			</form>
		</Form>
	)
}