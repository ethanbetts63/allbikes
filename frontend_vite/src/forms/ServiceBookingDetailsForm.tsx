import { useState, useEffect } from 'react';
import { getJobTypes, getUnavailableDays, getServiceSettings } from '@/services/bookingService';
import type { ServiceSettings } from '@/types/ServiceSettings';
import type { EnrichedJobType } from '@/types/EnrichedJobType';
import type { BookingDetailsFormProps } from '@/types/BookingDetailsFormProps';
import { format, add, parse } from 'date-fns';

import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const BookingDetailsForm = ({ formData, setFormData, nextStep }: BookingDetailsFormProps) => {
    const [jobTypes, setJobTypes] = useState<EnrichedJobType[]>([]);
    const [unavailableDays, setUnavailableDays] = useState<string[]>([]);
    const [serviceSettings, setServiceSettings] = useState<ServiceSettings | null>(null);
    const [isLoadingUnavailableDays, setIsLoadingUnavailableDays] = useState(true);

    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [timeSlots, setTimeSlots] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingUnavailableDays(true);
            try {
                const [jobs, unavailable, settings] = await Promise.all([
                    getJobTypes(),
                    getUnavailableDays(),
                    getServiceSettings()
                ]);
                setJobTypes(jobs || []);
                setUnavailableDays(unavailable.unavailable_days || []);
                setServiceSettings(settings);
            } catch (error) {
                console.error("Failed to fetch booking details data", error);
            } finally {
                setIsLoadingUnavailableDays(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (serviceSettings && selectedDate) {
            const start = parse(serviceSettings.drop_off_start_time, 'HH:mm:ss', selectedDate);
            const end = parse(serviceSettings.drop_off_end_time, 'HH:mm:ss', selectedDate);
            let current = start;
            const slots: string[] = [];
            while (current < end) {
                slots.push(format(current, 'HH:mm'));
                current = add(current, { minutes: 30 });
            }
            setTimeSlots(slots);
        }
    }, [serviceSettings, selectedDate]);

    useEffect(() => {
        if (selectedDate && selectedTime) {
            const combined = `${format(selectedDate, 'dd/MM/yyyy')} ${selectedTime}`;
            setFormData((prev: any) => ({ ...prev, drop_off_time: combined }));
        }
    }, [selectedDate, selectedTime, setFormData]);

    const handleJobTypeChange = (job: string) => {
        const currentJobs = formData.job_type_names || [];
        const newJobs = currentJobs.includes(job)
            ? currentJobs.filter((j: string) => j !== job)
            : [...currentJobs, job];
        setFormData({ ...formData, job_type_names: newJobs });
    };

    const isDateDisabled = (date: Date) => {
        if (!serviceSettings) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minDate = add(today, { days: serviceSettings.booking_advance_notice });
        if (date < minDate) return true;
        if ([0, 6].includes(date.getDay())) return true;
        const formattedDate = format(date, 'yyyy-MM-dd');
        return unavailableDays.includes(formattedDate);
    };

    const canProceed = selectedDate && selectedTime && formData.job_type_names?.length > 0;

    return (
        <div className="space-y-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)]">Step 1 — Booking Details</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="date">Drop-off Date *</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                disabled={isLoadingUnavailableDays}
                                className={cn(
                                    "flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50",
                                    !selectedDate && "text-[var(--text-dark-secondary)]"
                                )}
                            >
                                {isLoadingUnavailableDays ? (
                                    <span className="flex items-center gap-2"><Spinner className="h-4 w-4" /> Loading...</span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 shrink-0" />
                                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={isDateDisabled}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="time">Preferred Drop-off Time *</Label>
                    <Select onValueChange={setSelectedTime} value={selectedTime} disabled={!selectedDate}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a time" />
                        </SelectTrigger>
                        <SelectContent>
                            {timeSlots.map((slot: string) => (
                                <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-1.5">
                <Label>Job Type *</Label>
                <p className="text-sm text-[var(--text-dark-secondary)]">Select one or more services you require.</p>
                <div className="space-y-3 mt-2 p-4 border border-[var(--border-light)] rounded-md max-h-64 overflow-y-auto">
                    {jobTypes.length > 0 ? jobTypes.map((job) => (
                        <div key={job.name}>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id={job.name}
                                    onCheckedChange={() => handleJobTypeChange(job.name)}
                                    checked={formData.job_type_names?.includes(job.name)}
                                />
                                <Label htmlFor={job.name} className="font-semibold cursor-pointer">{job.name}</Label>
                            </div>
                            {job.description && (
                                <p className="text-sm text-[var(--text-dark-secondary)] ml-6 mt-0.5">{job.description}</p>
                            )}
                        </div>
                    )) : <p className="text-sm text-[var(--text-dark-secondary)]">Loading services...</p>}
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <p className="text-sm text-[var(--text-dark-secondary)]">Any details about the issue — sounds, circumstances, specific concerns.</p>
                <Textarea
                    id="notes"
                    placeholder="Add any notes for the mechanic"
                    value={formData.note || ''}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
            </div>

            <div className="flex justify-end pt-2">
                <button
                    onClick={nextStep}
                    disabled={!canProceed}
                    className="py-3 px-8 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)]"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default BookingDetailsForm;
