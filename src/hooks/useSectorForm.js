import { useState } from 'react';
const initialState = {
    name: '',
    type: 'support',
    icon: 'Headphones',
    color: 'blue',
    description: '',
    priority: 'normal',
    is_active: true
};
export function useSectorForm() {
    const [form, setForm] = useState(initialState);
    const updateForm = (updates) => {
        setForm(prev => ({
            ...prev,
            ...updates
        }));
    };
    const setName = (name) => updateForm({ name });
    const setDescription = (description) => updateForm({ description });
    const setIcon = (icon) => updateForm({ icon });
    const setColor = (color) => updateForm({ color });
    const setPriority = (value) => {
        if (['high', 'normal', 'low'].includes(value)) {
            updateForm({ priority: value });
        }
    };
    const resetForm = () => {
        setForm(initialState);
    };
    return {
        form,
        updateForm,
        setName,
        setDescription,
        setIcon,
        setColor,
        setPriority,
        resetForm
    };
}
