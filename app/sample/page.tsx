import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SamplePage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sample Page</h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          This is a placeholder page containing standard UI structures and rules.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empty Workspace</CardTitle>
          <CardDescription>
            Get started by editing this page or adding customized widgets here.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-zinc-200 rounded-xl dark:border-zinc-800">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <span className="text-xl">✨</span>
            </div>

            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              No items found
            </h3>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
              Start by creating a new data project or configuring the integration parameters.
            </p>

            <Button variant="default" className="mt-6">
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}