export const toPercentage = (present: number, absent: number): number => {
    const total = present + absent;
    return total ? Math.round((present / total) * 1000) / 10 : 0;
};

const pad = (value: number): string => String(value).padStart(2, '0');

export const todayLocal = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const isValidDateString = (value: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const parsed = new Date(`${value}T00:00:00`);
    return !Number.isNaN(parsed.getTime()) && `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}` === value;
};
