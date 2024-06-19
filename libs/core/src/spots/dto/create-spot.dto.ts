import { SpotStatus } from '@prisma/client';

export class CreateSpotDto {
  name: string;
  status?: SpotStatus;
  eventId: string;
}
