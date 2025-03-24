const StatusCircle = ({ status }: { status: string }) => {
    const circleColor = {
      "Finished": "bg-green-500",
      "Started": "bg-yellow-500",
      "Not Started": "bg-red-500"
    }[status] || "bg-gray-500";
  
    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${circleColor}`} />
        {status}
      </div>
    );
  };

  export default StatusCircle;