import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmailPageLoading() {
  return (
    <div className="container mx-auto py-8">
      <Skeleton className="h-8 w-64 mb-6" />
      
      <Card className="p-6 rounded-xl shadow-md bg-white">
        <Skeleton className="h-7 w-48 mb-4" />
        
        <div className="space-y-4">
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-[150px] w-full" />
          </div>
          
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    </div>
  );
}