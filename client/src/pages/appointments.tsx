import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, User, FileText, CheckCircle } from "lucide-react";
import { format } from "date-fns";

type Appointment = {
    id: string;
    clientName: string;
    clientEmail: string;
    date: string;
    status: string;
    type: string;
    notes?: string;
};

export default function AppointmentsPage() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingData, setBookingData] = useState({
        clientName: "",
        clientEmail: "",
        type: "consultation",
        notes: ""
    });
    const [lastIntakeLink, setLastIntakeLink] = useState<string | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: appointments, isLoading } = useQuery<Appointment[]>({
        queryKey: ["appointments"],
        queryFn: async () => {
            const res = await fetch("/api/appointments");
            if (!res.ok) throw new Error("Failed to fetch appointments");
            return res.json();
        }
    });

    const createAppointment = useMutation({
        mutationFn: async (newAppt: any) => {
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAppt)
            });
            if (!res.ok) throw new Error("Failed to create appointment");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            setLastIntakeLink(data.intakeLink);
            toast({
                title: "Appointment Scheduled",
                description: `Confirmation sent to ${data.appointment.clientEmail}`
            });
            // Don't close dialog yet, show success state
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Booking Failed",
                description: error.message
            });
        }
    });

    const handleBookSlot = () => {
        if (!date) return;
        setIsBookingOpen(true);
        setLastIntakeLink(null); // Reset previous success
    };

    const handleSubmitBooking = () => {
        if (!date || !bookingData.clientName || !bookingData.clientEmail) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please fill in all required fields."
            });
            return;
        }

        createAppointment.mutate({
            ...bookingData,
            date: date.toISOString()
        });
    };

    // Group appointments by date for easier viewing
    const appointmentsByDate = appointments?.reduce((acc, appt) => {
        const dateKey = format(new Date(appt.date), "yyyy-MM-dd");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(appt);
        return acc;
    }, {} as Record<string, Appointment[]>) || {};

    return (
        <SidebarLayout>
            <div className="flex h-[calc(100vh-2rem)] flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Appointment Scheduler</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage consultations and automate client intake flow.
                        </p>
                    </div>
                    <Button onClick={handleBookSlot} disabled={!date}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Book Selected Date
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-[1fr_350px] lg:grid-cols-[1fr_400px]">
                    {/* Main Calendar View */}
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Calendar</CardTitle>
                            <CardDescription>Select a date to view or book appointments.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center p-6">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border shadow-sm p-4 w-full max-w-[400px] h-auto"
                            />
                        </CardContent>
                    </Card>

                    {/* Upcoming Appointments (Right Panel) */}
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Clock className="mr-2 h-5 w-5" />
                                Upcoming
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
                            <div className="space-y-4">
                                {isLoading ? (
                                    <p className="text-sm text-muted-foreground">Loading appointments...</p>
                                ) : appointments?.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No upcoming appointments.
                                    </p>
                                ) : (
                                    appointments?.map((appt) => (
                                        <div key={appt.id} className="flex flex-col gap-2 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <span className="font-semibold text-sm">
                                                    {format(new Date(appt.date), "MMM d, yyyy")}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${appt.status === "scheduled" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                                    }`}>
                                                    {appt.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span>{appt.clientName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <FileText className="h-3 w-3" />
                                                <span>{appt.type}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Booking Dialog */}
                <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Book Appointment</DialogTitle>
                            <DialogDescription>
                                Schedule a consultation for {date ? format(date, "MMMM d, yyyy") : ""}.
                            </DialogDescription>
                        </DialogHeader>

                        {!lastIntakeLink ? (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input
                                        id="name"
                                        value={bookingData.clientName}
                                        onChange={(e) => setBookingData({ ...bookingData, clientName: e.target.value })}
                                        className="col-span-3"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="email" className="text-right">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={bookingData.clientEmail}
                                        onChange={(e) => setBookingData({ ...bookingData, clientEmail: e.target.value })}
                                        className="col-span-3"
                                        placeholder="jane@example.com"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="type" className="text-right">Type</Label>
                                    <Select
                                        value={bookingData.type}
                                        onValueChange={(val) => setBookingData({ ...bookingData, type: val })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="consultation">Initial Consultation</SelectItem>
                                            <SelectItem value="review">Case Review</SelectItem>
                                            <SelectItem value="court">Court Appearance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="notes" className="text-right">Notes</Label>
                                    <Input
                                        id="notes"
                                        value={bookingData.notes}
                                        onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                        className="col-span-3"
                                        placeholder="Optional notes..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 flex flex-col items-center gap-4 text-center">
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Booking Confirmed!</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        An intake form has been generated for {bookingData.clientName}.
                                    </p>
                                </div>
                                <div className="w-full bg-slate-100 p-3 rounded-md mt-2 flex items-center justify-between">
                                    <code className="text-xs truncate">{window.location.origin}{lastIntakeLink}</code>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}${lastIntakeLink}`);
                                        toast({ title: "Copied Link" });
                                    }}>
                                        Copy
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    (In a real app, this link would be emailed automatically)
                                </p>
                            </div>
                        )}

                        <DialogFooter>
                            {!lastIntakeLink ? (
                                <Button onClick={handleSubmitBooking} disabled={createAppointment.isPending}>
                                    {createAppointment.isPending ? "Booking..." : "Confirm Booking"}
                                </Button>
                            ) : (
                                <Button onClick={() => {
                                    setIsBookingOpen(false);
                                    setBookingData({ clientName: "", clientEmail: "", type: "consultation", notes: "" });
                                }}>
                                    Close
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </SidebarLayout>
    );
}
