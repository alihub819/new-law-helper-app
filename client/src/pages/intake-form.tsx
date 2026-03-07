import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function IntakePage() {
    const [match, params] = useRoute("/intake/:id");
    const id = params?.id;

    const { data: form, isLoading, error } = useQuery({
        queryKey: ["intake", id],
        queryFn: async () => {
            const res = await fetch(`/api/intake/${id}`);
            if (!res.ok) throw new Error("Intake form not found");
            return res.json();
        },
        enabled: !!id
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Loading Intake Form...</h2>
                    <Progress value={33} className="w-[200px]" />
                </div>
            </div>
        );
    }

    if (error || !form) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600">Form Not Found</CardTitle>
                        <CardDescription>
                            We couldn't find the intake form you're looking for. The link may have expired or is invalid.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Legal Intake Form</h1>
                    <p className="mt-2 text-lg text-slate-600">
                        Welcome, {form.clientName}. Please complete this form to help us prepare for your consultation.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Case Information - {form.caseType}</CardTitle>
                        <CardDescription>
                            Please provide as much detail as possible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            Form implementation coming soon...
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
