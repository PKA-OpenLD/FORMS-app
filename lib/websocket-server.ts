/*
 * Copyright 2025 PKA-OpenLD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// WebSocket notification helpers
// Note: The actual WebSocket server runs in server.ts on port 3000 at /ws
// These are stub functions - actual implementation is in server.ts

// Broadcast notification to specific user
export function notifyUser(userId: string, notification: any) {
  console.log('Notify user:', userId, notification);
  // Actual WebSocket broadcasting is handled in server.ts
}

// Broadcast to all users near a location
export function notifyNearbyUsers(
  location: [number, number],
  radiusKm: number,
  notification: any,
) {
  console.log('Notify nearby users:', location, radiusKm, notification);
  // Actual WebSocket broadcasting is handled in server.ts
}

// Broadcast to all users
export function notifyAllUsers(notification: any) {
  console.log('Notify all users:', notification);
  // Actual WebSocket broadcasting is handled in server.ts
}
