/*
    Pairings feature overhaul.
    Simpler. Will just be limited to program-specific pairings.
    No more global pairings.
    No more need for approval (removal of admin review).
    Pairings will be created and managed by program admins only.

    This will just contain two columns: one for tutors and one for students.
*/

import DashboardLayout from "@/components/dashboard-layout";

const Page = () => {
    return (
        <>
            <DashboardLayout title="Program Pairings">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <h2 className="text-lg font-semibold">Tutors</h2>
                        {/* Tutor pairing management UI goes here */}
                    </div>
                    <div className="col-span-1">
                        <h2 className="text-lg font-semibold">Students</h2>
                        {/* Student pairing management UI goes here */}
                    </div>
                </div>
            </DashboardLayout>
        </>
    )
};

export default Page;