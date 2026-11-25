export const statusLabels = { new: 'New', in_progress: 'In progress', responded: 'Responded', closed: 'Closed', spam: 'Spam' } as const;
export type Status = keyof typeof statusLabels;
export const statuses = Object.keys(statusLabels) as Status[];
export const typeLabels = { contact: 'Contact', quote: 'Quote', newsletter: 'Newsletter' } as const;
export type FormKind = keyof typeof typeLabels;
export const formKinds = Object.keys(typeLabels) as FormKind[];
