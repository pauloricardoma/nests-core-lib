import { SpotStatus } from '@prisma/client';

export class CreateSpotRequest {
  name: string;
  status?: SpotStatus;
  eventId: string;
}
