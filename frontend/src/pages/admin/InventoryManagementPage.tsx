import { useState, useEffect } from 'react';
import InventoryTable from "@/components/InventoryTable";
import { getDepositSettings, adminUpdateDepositSettings } from '@/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DepositSettingsPanel = () => {
    const [amount, setAmount] = useState('');
    const [savedAmount, setSavedAmount] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        getDepositSettings()
            .then(s => {
                setAmount(s.deposit_amount);
                setSavedAmount(s.deposit_amount);
            })
            .catch(() => setMessage({ text: 'Failed to load deposit settings.', type: 'error' }));
    }, []);

    const handleSave = async () => {
        const parsed = parseFloat(amount);
        if (isNaN(parsed) || parsed <= 0) {
            setMessage({ text: 'Enter a valid amount greater than $0.', type: 'error' });
            return;
        }
        setIsSaving(true);
        setMessage(null);
        try {
            const updated = await adminUpdateDepositSettings(parsed.toFixed(2));
            setSavedAmount(updated.deposit_amount);
            setMessage({ text: 'Deposit amount updated.', type: 'success' });
        } catch {
            setMessage({ text: 'Failed to save. Please try again.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const isDirty = amount !== savedAmount;

    return (
        <div className="bg-[var(--bg-light-primary)] rounded-lg border border-border-light p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-dark-primary)] mb-0.5">Motorcycle Deposit Amount</p>
                    <p className="text-xs text-[var(--text-dark-secondary)]">Flat deposit charged when a customer reserves a new motorcycle.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-[var(--text-dark-secondary)] font-medium">$</span>
                    <Input
                        type="number"
                        min="1"
                        step="0.01"
                        value={amount}
                        onChange={e => { setAmount(e.target.value); setMessage(null); }}
                        className="w-28 text-[var(--text-dark-primary)]"
                    />
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !isDirty}
                        size="sm"
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
            {message && (
                <p className={`text-xs mt-2 ${message.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                    {message.text}
                </p>
            )}
        </div>
    );
};

const InventoryManagementPage = () => {
    return (
        <div className="p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-4 text-[var(--text-dark-primary)]">Inventory Management</h1>
            <DepositSettingsPanel />
            <InventoryTable />
        </div>
    );
};

export default InventoryManagementPage;
