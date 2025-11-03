# Redux Store Documentation

## Overview

The application uses **Redux Toolkit** for state management with TypeScript support. The store is configured with slices for different domains of the application.

## Structure

```
client/
├── lib/
│   └── axios.ts              # Configured axios instance with interceptors
└── store/
    ├── index.ts              # Store configuration
    ├── hooks.ts              # Typed Redux hooks
    └── slices/
        ├── servicesSlice.ts       # Services state management
        ├── appointmentSlice.ts    # Appointment form state
        └── appointmentApiSlice.ts # Appointment API calls
```

## Store Slices

### 1. Services Slice (`servicesSlice.ts`)

Manages the services data fetched from the API.

**State:**

```typescript
{
  services: Service[];        // Array of available services
  loading: boolean;           // Loading state
  error: string | null;       // Error message if any
  selectedService: Service | null;  // Currently selected service
}
```

**Actions:**

- `fetchServices()` - Async thunk to fetch services from API
- `selectService(serviceId)` - Select a service by ID
- `clearSelectedService()` - Clear the selected service
- `clearError()` - Clear error state

**Usage:**

```typescript
import { fetchServices, selectService } from "@/store/slices/servicesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function MyComponent() {
  const dispatch = useAppDispatch();
  const { services, loading } = useAppSelector((state) => state.services);

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  const handleSelect = (id: number) => {
    dispatch(selectService(id));
  };
}
```

### 2. Appointment Slice (`appointmentSlice.ts`)

Manages the appointment form data and wizard step.

**State:**

```typescript
{
  service: number | null;
  selectedAreas: string[];
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  currentStep: number;
}
```

**Actions:**

- `setService(serviceId)` - Set selected service
- `toggleArea(areaId)` - Toggle area selection
- `setSelectedAreas(areas)` - Set multiple areas
- `setDate(date)` - Set appointment date
- `setTime(time)` - Set appointment time
- `setPersonalInfo({ name?, email?, phone?, notes? })` - Update personal info
- `setStep(step)` - Set current wizard step
- `nextStep()` - Go to next step
- `previousStep()` - Go to previous step
- `resetAppointment()` - Reset entire form

**Usage:**

```typescript
import {
  setService,
  toggleArea,
  nextStep,
} from "@/store/slices/appointmentSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function AppointmentForm() {
  const dispatch = useAppDispatch();
  const appointment = useAppSelector((state) => state.appointment);

  const handleServiceChange = (id: number) => {
    dispatch(setService(id));
  };

  const handleNext = () => {
    dispatch(nextStep());
  };
}
```

### 3. Appointment API Slice (`appointmentApiSlice.ts`)

Handles appointment submission to the backend.

**State:**

```typescript
{
  submitting: boolean; // Submission in progress
  success: boolean; // Submission successful
  error: string | null; // Error message
  confirmationId: string | null; // Confirmation ID from server
}
```

**Actions:**

- `submitAppointment(appointmentData)` - Async thunk to submit appointment
- `resetSubmission()` - Reset submission state

**Usage:**

```typescript
import {
  submitAppointment,
  resetSubmission,
} from "@/store/slices/appointmentApiSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function ConfirmationStep() {
  const dispatch = useAppDispatch();
  const appointment = useAppSelector((state) => state.appointment);
  const { submitting, success, error } = useAppSelector(
    (state) => state.appointmentApi,
  );

  const handleSubmit = async () => {
    await dispatch(submitAppointment(appointment));
  };

  useEffect(() => {
    if (success) {
      // Handle success
      alert("Appointment confirmed!");
      dispatch(resetSubmission());
    }
  }, [success]);
}
```

## Typed Hooks

The store provides typed versions of `useDispatch` and `useSelector`:

```typescript
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// Instead of:
// const dispatch = useDispatch();
// const data = useSelector(state => state.services);

// Use:
const dispatch = useAppDispatch(); // Typed dispatch
const data = useAppSelector((state) => state.services); // Typed selector
```

## Axios Configuration

The app uses a configured axios instance (`client/lib/axios.ts`) with:

- Base URL set to `/api`
- Request interceptor for adding JWT tokens
- Response interceptor for handling 401 errors
- Automatic token management from localStorage

**Usage:**

```typescript
import axios from "@/lib/axios";

// All requests automatically include auth token if available
const response = await axios.get("/services");
const result = await axios.post("/appointments", data);
```

## Integration with Components

The Redux store is integrated at the app level in `App.tsx`:

```typescript
import { Provider } from 'react-redux';
import { store } from '@/store';

export const App = () => (
  <Provider store={store}>
    {/* Rest of the app */}
  </Provider>
);
```

## Best Practices

1. **Always use typed hooks** - Use `useAppDispatch` and `useAppSelector` instead of plain Redux hooks
2. **Async operations** - Use `createAsyncThunk` for API calls
3. **Error handling** - Handle loading and error states in components
4. **Immutability** - Redux Toolkit uses Immer internally, so you can write "mutating" logic
5. **Action creators** - Use the exported action creators instead of dispatching plain objects

## Example: Complete Flow

```typescript
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchServices } from '@/store/slices/servicesSlice';
import { setService, nextStep } from '@/store/slices/appointmentSlice';

function ServiceSelection() {
  const dispatch = useAppDispatch();

  // Get data from store
  const { services, loading, error } = useAppSelector(state => state.services);
  const { service: selectedService } = useAppSelector(state => state.appointment);

  // Fetch services on mount
  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  // Handle service selection
  const handleSelect = (serviceId: number) => {
    dispatch(setService(serviceId));
  };

  // Navigate to next step
  const handleNext = () => {
    if (selectedService) {
      dispatch(nextStep());
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {services.map(service => (
        <button
          key={service.id}
          onClick={() => handleSelect(service.id)}
          className={selectedService === service.id ? 'selected' : ''}
        >
          {service.name}
        </button>
      ))}
      <button onClick={handleNext}>Next</button>
    </div>
  );
}
```

## Testing

The store can be tested using Redux Toolkit's testing utilities:

```typescript
import { store } from "@/store";
import { fetchServices } from "@/store/slices/servicesSlice";

// Dispatch actions
store.dispatch(fetchServices());

// Get state
const state = store.getState();
console.log(state.services);
```

## DevTools

Redux DevTools are automatically enabled in development mode, allowing you to:

- Inspect state changes
- Time-travel debug
- View action history
- Test action creators
