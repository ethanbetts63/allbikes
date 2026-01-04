import { authedFetch } from '../apiClient';
import { JobType } from '../types';

export const getJobTypesAdmin = async (): Promise<JobType[]> => {
    const response = await authedFetch('/api/service/admin/job-types/');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

export const createJobType = async (jobType: Omit<JobType, 'id'>): Promise<JobType> => {
    const response = await authedFetch('/api/service/admin/job-types/', {
        method: 'POST',
        body: JSON.stringify(jobType),
    });
    if (!response.ok) {
        throw new Error('Failed to create job type');
    }
    return response.json();
};

export const updateJobType = async (id: number, jobType: Partial<Omit<JobType, 'id'>>): Promise<JobType> => {
    const response = await authedFetch(`/api/service/admin/job-types/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(jobType),
    });
    if (!response.ok) {
        throw new Error('Failed to update job type');
    }
    return response.json();
};

export const deleteJobType = async (id: number): Promise<void> => {
    const response = await authedFetch(`/api/service/admin/job-types/${id}/`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete job type');
    }
};
