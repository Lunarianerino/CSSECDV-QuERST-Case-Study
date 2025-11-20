"use client";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useEffect, useState} from "react";
import {getAllUsers} from "@/lib/actions/userActions";
import {BasicAccountInfo} from "@/types/accounts";
import {Eye, Loader2, PlusIcon, Search} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {CreateUserForm} from "@/components/admin/CreateUserForm";
import {DisableUserCheckbox} from "@/components/admin/DisableUserCheckbox";

const Page = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [users, setUsers] = useState<BasicAccountInfo[]>([]);
	const UserQueryKey = 'users';
	const {data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers} = useQuery({
		queryKey: [UserQueryKey],
		queryFn: getAllUsers
	});
	const [searchQuery, setSearchQuery] = useState("");
	const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all");

	const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

	const queryClient = useQueryClient();

	const handleOpenCreateUser = () => {
		setIsCreateUserOpen(true);
	}

	useEffect(() => {
		if (usersData) {
			setUsers(usersData || []);
		}
	}, [usersData]);

	// Filter users based on search query and account type
	const filteredUsers = users.filter(user => {
		// Filter by search query (name or email)
		const matchesSearch =
			searchQuery === "" ||
			user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase());

		// Filter by account type
		const matchesType =
			accountTypeFilter === "all" ||
			user.type.toLowerCase() === accountTypeFilter.toLowerCase();

		return matchesSearch && matchesType;
	});

	if (isLoadingUsers) {
		return (
			<div className="min-h-screen bg-background p-6 flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-8 w-8 animate-spin text-primary"/>
					<p className="text-lg font-medium">Loading users...</p>
				</div>
			</div>
		);
	}
	return (
		<DashboardLayout title="User Management">
			{
				isLoadingUsers ? (
					<div className="min-h-screen bg-background p-6 flex items-center justify-center">
						<div className="flex flex-col items-center gap-4">
							<Loader2 className="h-8 w-8 animate-spin text-primary"/>
							<p className="text-lg font-medium">Loading users...</p>
						</div>
					</div>
				) : isErrorUsers ? (
					<div className="min-h-screen bg-background p-6 flex items-center justify-center">
						<div className="flex flex-col items-center gap-4">
							<p className="text-lg font-medium text-red-600">Failed to load users. Please try again later.</p>
						</div>
					</div>
				) : users.length === 0 ? (
					<div className="flex flex-col items-center justify-center mt-10">
						<p className="mt-4 text-lg font-medium text-muted-foreground">No users. Create a new user to get
							started.</p>
					</div>
				) : (
					<div className="mx-auto space-y-6">
						<div className="flex items-center justify-between mb-6 gap-4">
							<div className="relative flex-5">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
								<Input
									placeholder="Search by name or email..."
									className="pl-8"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>

							<Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
								<SelectTrigger className="w-[180px] flex-2">
									<SelectValue placeholder="Filter by type"/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									<SelectItem value="student">Student</SelectItem>
									<SelectItem value="tutor">Tutor</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
								</SelectContent>
							</Select>
							<Button className="flex-1" onClick={handleOpenCreateUser}>
								<PlusIcon/>
								<p>Create new user</p>
							</Button>
						</div>

						{
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Account Type</TableHead>
											<TableHead>Onboarded</TableHead>
											<TableHead>Actions</TableHead>
											<TableHead>Disable</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredUsers.length === 0 ? (
											<TableRow>
												<TableCell colSpan={5} className="text-center py-6">
													No users found matching your criteria
												</TableCell>
											</TableRow>
										) : (
											filteredUsers.map((user) => (
												<TableRow key={user.email}>
													<TableCell className="font-medium">{user.name}</TableCell>
													<TableCell>{user.email}</TableCell>
													<TableCell>
                              <span
	                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.type === "admin" ? "bg-purple-100 text-purple-800" :
		                              user.type === "tutor" ? "bg-blue-100 text-blue-800" :
			                              "bg-green-100 text-green-800"
	                              }`}>
                                {user.type.charAt(0).toUpperCase() + user.type.slice(1)}
                              </span>
													</TableCell>
													<TableCell>
														{user.onboarded ? (
															<span
																className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                  Yes
                                </span>
														) : (
															<span
																className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                  No
                                </span>
														)}
													</TableCell>
													<TableCell>
														<Button variant="outline" size="sm" asChild>
															<Link href={`/admin/users/${user.id}`}>
																<Eye className="h-4 w-4 mr-2"/>
																View Profile
															</Link>
														</Button>
													</TableCell>
													<TableCell>
														<DisableUserCheckbox user={user}/>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
						}
					</div>
				)
			}
			<Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create a New User</DialogTitle>
						<DialogDescription>
							Fill in the details below to create a new user.
						</DialogDescription>
						<CreateUserForm onSuccess={() => queryClient.invalidateQueries({queryKey: [UserQueryKey]})}/>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</DashboardLayout>
	);
};

export default Page;