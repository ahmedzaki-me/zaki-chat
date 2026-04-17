import { ArrowLeft, Home, MoveUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Empty className="min-h-screen flex flex-col justify-center bg-background bg-none">
      <EmptyHeader>
        <div
          className="mx-auto overflow-hidden mb-6 flex h-16 w-16 items-center
                        justify-center rounded-2xl bg-primary text-3xl font-bold
                        text-primary-foreground shadow-xl shadow-primary/20"
        >
          <img src="/logo.svg" alt="logo" />
        </div>

        <EmptyTitle className="text-3xl font-bold tracking-tight">
          404 - Page Not Found
        </EmptyTitle>
        <EmptyDescription className="text-muted-foreground text-lg max-w-100 mx-auto ">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent className="mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto gap-2 border-primary/20 hover:bg-primary/5 text-white/90"
          >
            <ArrowLeft className="size-4" />
            Go Back
          </Button>

          <Link to="/" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2 bg-primary text-white/90 hover:bg-primary/90">
              <Home className="size-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50">
          <EmptyDescription className="text-sm">
            Need help?{" "}
            <a
              href="https://ahmedzaki.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold transition-all"
            >
              Visit Portfolio<MoveUpRight className="inline size-4" />
            </a>
          </EmptyDescription>
        </div>
      </EmptyContent>
    </Empty>
  );
}
