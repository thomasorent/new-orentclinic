// User state management service
// Handles user booking states, temporary reservations, and cleanup

export interface UserBookingState {
  step: 'idle' | 'waiting_for_booking_confirmation' | 'waiting_for_department' | 'waiting_for_date' | 'waiting_for_slot' | 'waiting_for_details';
  selectedDepartment?: 'Ortho' | 'ENT';
  selectedDate?: string;
  selectedSlot?: string;
  tempData?: {
    patientName?: string;
    phoneNumber?: string;
    department?: string;
  };
  reservationTime?: number; // Track when slot was reserved
  lastActivityTime?: number; // Track when user was last active
}

// In-memory storage for user states (in production, consider using a database)
const userStates = new Map<string, UserBookingState>();

// Temporary reservations to prevent race conditions during booking process
// In production, this should be in a database with TTL
const temporaryReservations = new Map<string, { userId: string; timestamp: number }>();

// Reservation timeout (5 minutes)
const RESERVATION_TIMEOUT = 5 * 60 * 1000;

  // Clean up expired reservations and user states
  setInterval(() => {
    const now = Date.now();
    
    // Clean up expired reservations
    for (const [key, reservation] of Array.from(temporaryReservations.entries())) {
      if (now - reservation.timestamp > RESERVATION_TIMEOUT) {
        temporaryReservations.delete(key);
      }
    }
    
    // Clean up expired user states (30 minutes timeout)
    for (const [userPhone, userState] of Array.from(userStates.entries())) {
      console.log(`Checking user state for cleanup: ${userPhone}, step: ${userState.step}, reservationTime: ${userState.reservationTime}`);
      
      if (userState.reservationTime && (now - userState.reservationTime > 30 * 60 * 1000)) {
        // Clear expired reservation
        if (userState.selectedDate && userState.selectedSlot) {
          const reservationKey = `${userState.selectedDate}-${userState.selectedDepartment}-${userState.selectedSlot}`;
          temporaryReservations.delete(reservationKey);
        }
        console.log(`Clearing expired user state for ${userPhone}`);
        userStates.delete(userPhone);
      } else if (!userState.reservationTime && userState.step !== 'idle') {
        // Clear user states that have been in non-idle steps for too long (e.g., 10 minutes)
        // This prevents users from getting stuck in intermediate steps
        const userStateAge = now - (userState.lastActivityTime || now);
        if (userStateAge > 10 * 60 * 1000) { // 10 minutes
          console.log(`Clearing stale user state for ${userPhone} (step: ${userState.step}, age: ${userStateAge}ms)`);
          userStates.delete(userPhone);
        }
      }
    }
  }, 60000); // Check every minute

export class UserStateService {
  // Get user state or create default
  static getUserState(userPhone: string): UserBookingState {
    return userStates.get(userPhone) || { step: 'idle' };
  }

  // Set user state
  static setUserState(userPhone: string, state: UserBookingState): void {
    userStates.set(userPhone, state);
  }

  // Delete user state
  static deleteUserState(userPhone: string): void {
    userStates.delete(userPhone);
  }

  // Update user state step
  static updateUserStep(userPhone: string, step: UserBookingState['step']): void {
    const state = userStates.get(userPhone);
    if (state) {
      state.step = step;
      state.lastActivityTime = Date.now();
      userStates.set(userPhone, state);
    }
  }

  // Update user state with new data
  static updateUserState(userPhone: string, updates: Partial<UserBookingState>): void {
    const state = userStates.get(userPhone);
    if (state) {
      Object.assign(state, updates);
      state.lastActivityTime = Date.now();
      userStates.set(userPhone, state);
    }
  }

  // Add temporary reservation
  static addTemporaryReservation(key: string, userId: string): void {
    temporaryReservations.set(key, { userId, timestamp: Date.now() });
  }

  // Get temporary reservation
  static getTemporaryReservation(key: string): { userId: string; timestamp: number } | undefined {
    return temporaryReservations.get(key);
  }

  // Delete temporary reservation
  static deleteTemporaryReservation(key: string): void {
    temporaryReservations.delete(key);
  }

  // Check if slot is reserved by another user
  static isSlotReservedByOther(key: string, currentUserId: string): boolean {
    const reservation = temporaryReservations.get(key);
    return reservation !== undefined && reservation.userId !== currentUserId;
  }

  // Clear expired reservation for a user
  static clearExpiredReservation(userPhone: string): void {
    const userState = userStates.get(userPhone);
    if (userState && userState.selectedDate && userState.selectedSlot) {
      const reservationKey = `${userState.selectedDate}-${userState.selectedDepartment}-${userState.selectedSlot}`;
      temporaryReservations.delete(reservationKey);
    }
  }
} 