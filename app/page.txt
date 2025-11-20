import { Button } from "@/components/ui/button";
import LogoutButton from "@/features/auth/components/logout-button";
import UserButton from "@/features/auth/components/user-button";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-green-300">Home</h1>
      <Button className="mt-4">Click Me</Button>

      <UserButton />
    </div>
  );
}
