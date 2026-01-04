import React, { useState, useEffect } from 'react';
import { getJobTypes, getUnavailableDays, getServiceSettings, ServiceSettings } from '@/services/bookingService';
import { format, add, parse } from 'date-fns';

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingDetailsFormProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    nextStep: () => void;
}

const BookingDetailsForm: React.FC<BookingDetailsFormProps> = ({ formData, setFormData, nextStep }) => {
    const [jobTypes, setJobTypes] = useState<string[]>([]);
    const [unavailableDays, setUnavailableDays] = useState<string[]>([]);
    const [serviceSettings, setServiceSettings] = useState<ServiceSettings | null>(null);
    
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [timeSlots, setTimeSlots] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobs, unavailable, settings] = await Promise.all([
                    getJobTypes(),
                    getUnavailableDays(),
                    getServiceSettings()
                ]);
                setJobTypes(jobs.job_type_names || []);
                setUnavailableDays(unavailable.unavailable_days || []);
                setServiceSettings(settings);
            } catch (error) {
                console.error("Failed to fetch booking details data", error);
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
        if ([0, 6].includes(date.getDay())) return true; // Disable weekends
        
        const formattedDate = format(date, 'yyyy-MM-dd');
        return unavailableDays.includes(formattedDate);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Step 1: Booking Details</h2>
            <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="date">Drop-off Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                </Button>
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
                    <div>
                        <Label htmlFor="time">Drop-off Time</Label>
                        <Select onValueChange={setSelectedTime} value={selectedTime} disabled={!selectedDate}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a time" />
                            </SelectTrigger>
                            <SelectContent>
                                {timeSlots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div>
                    <Label>Services Required</Label>
                    <div className="space-y-2 mt-2 p-4 border rounded-md max-h-48 overflow-y-auto">
                        {jobTypes.length > 0 ? jobTypes.map(job => (
                            <div key={job} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={job} 
                                    onCheckedChange={() => handleJobTypeChange(job)}
                                    checked={formData.job_type_names?.includes(job)}
                                />
                                <Label htmlFor={job} className="font-normal">{job}</Label>
                            </div>
                        )) : <p className="text-sm text-muted-foreground">Loading services...</p>}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox id="courtesy" 
                        onCheckedChange={(checked) => setFormData({...formData, courtesy_vehicle_requested: checked})}
                        checked={formData.courtesy_vehicle_requested}
                    />
                    <Label htmlFor="courtesy">Request a courtesy vehicle</Label>
                </div>
                
                <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea 
                        id="notes"
                        placeholder="Add any notes for the mechanic (e.g., details about the issue)" 
                        value={formData.note || ''}
                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                    />
                </div>

                <div className="flex justify-end">
                    <Button onClick={nextStep} disabled={!selectedDate || !selectedTime || formData.job_type_names?.length === 0}>
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailsForm;