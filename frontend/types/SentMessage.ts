export interface SentMessage {
    id: number;
    to: string;
    subject: string;
    message_type: string;
    channel: string;
    status: string;
    sent_at: string | null;
    created_at: string;
    body_html?: string;
    body_text?: string;
    error_message?: string;
}
