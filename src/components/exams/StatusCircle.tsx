import { UserExamStatus } from "@/models/examStatus";

const StatusCircle = ({ status }: { status: UserExamStatus }) => {
    const circleColor = {
      [UserExamStatus.FINISHED]: "bg-green-500",
      [UserExamStatus.STARTED]: "bg-yellow-500",
      [UserExamStatus.NOT_STARTED]: "bg-red-500"
    }[status] || "bg-gray-500";
  
    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${circleColor}`} />
        {status}
      </div>
    );
  };

  export default StatusCircle;