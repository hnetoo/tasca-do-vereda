# SuccessToast Component Documentation

## Purpose
The `SuccessToast` component is designed to provide consistent and accessible feedback to users upon the successful completion of any task or operation within the application. Its primary goal is to inform the user clearly and unobtrusively that their action has been successfully processed.

## Usage Policy
**All task completion confirmations MUST utilize the `SuccessToast` component.** This ensures a unified user experience and adherence to accessibility standards across the application.

## How to Use

### Basic Implementation

To display a success toast, you typically call a notification function (e.g., `showSuccessNotification`) from your global state management (e.g., Zustand store) or a dedicated notification service.

First, ensure your component has access to the notification state and actions, usually via a hook:

```typescript
import { useStore } from '@/store/useStore'; // Adjust path as necessary

// Inside your functional component
const showSuccessNotification = useStore((state) => state.showSuccessNotification);
```

Then, after a successful operation, trigger the toast:

```typescript
try {
  // Perform your successful operation here
  await someAsyncTask();
  showSuccessNotification('Your task was completed successfully!');
} catch (error) {
  // Handle errors, perhaps show an error toast
  console.error('Task failed:', error);
}
```

### Customizing the Message

The `SuccessToast` component accepts a `message` prop, which is the text displayed to the user.

```typescript
showSuccessNotification('Item added to cart!');
showSuccessNotification('Settings saved.');
```

### Example in a Component

```typescript
// src/app/some-feature/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button'; // Example button component
import { useStore } from '@/store/useStore';

export default function SomeFeaturePage() {
  const [isLoading, setIsLoading] = useState(false);
  const showSuccessNotification = useStore((state) => state.showSuccessNotification);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Simulate an API call or async operation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showSuccessNotification('Data successfully submitted!');
    } catch (error) {
      console.error('Submission failed:', error);
      // Potentially show an error toast here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Some Feature</h1>
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit Data'}
      </Button>
    </div>
  );
}
```

## Accessibility Considerations

The `SuccessToast` component is designed with accessibility in mind:
- It has `role="status"` and `aria-live="polite"` attributes to ensure screen readers announce the success message without interrupting the user's current task.
- The visual design provides clear contrast and a distinct green indicator for success.

## Component Structure (for reference)

The `SuccessToast.tsx` component typically resides in `src/components/SuccessToast.tsx`. It uses `lucide-react` for the checkmark icon and Tailwind CSS for styling.

```typescript
// src/components/SuccessToast.tsx
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, X } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  onClose: () => void;
}

export const SuccessToast = ({ message, onClose }: SuccessToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Give time for exit animation before calling onClose
      setTimeout(onClose, 300);
    }, 3000); // Toast visible for 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Ensure animation completes
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.5 }}
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="fixed bottom-4 right-4 z-50 flex items-center justify-between gap-4 rounded-lg bg-green-600 p-4 text-white shadow-lg"
        >
          <div className="flex items-center gap-2">
            <CircleCheck size={18} className="text-green-300" data-testid="circle-check-icon" />
            <span className="text-sm font-medium">{message}</span>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1 transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Close success message"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```
