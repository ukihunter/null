import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function FeaturesCards() {
  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto">
      {/* Card 1: Real-time Collaboration */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Real-time Collaboration</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Collaborate with your team in real-time. See updates instantly and
            work together seamlessly.
          </CardDescription>
        </CardContent>
        <CardContent>
          <Button className="w-full">Learn More</Button>
        </CardContent>
      </Card>

      {/* Card 2: Project Management */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Project Management</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Organize your projects efficiently, assign tasks, track progress,
            and meet deadlines effortlessly.
          </CardDescription>
        </CardContent>
        <CardContent>
          <Button className="w-full">Learn More</Button>
        </CardContent>
      </Card>

      {/* Card 3: Voice Call */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Voice Call</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Connect with your team instantly through high-quality voice calls
            without leaving the platform.
          </CardDescription>
        </CardContent>
        <CardContent>
          <Button className="w-full">Learn More</Button>
        </CardContent>
      </Card>
    </div>
  );
}
