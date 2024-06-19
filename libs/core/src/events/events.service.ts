import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ReserveSpotDto } from './dto/reserve-spot.dto';
import { Prisma, SpotStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prismaService: PrismaService) {}

  create(createEventDto: CreateEventDto) {
    return this.prismaService.event.create({
      data: { ...createEventDto, date: new Date(createEventDto.date) },
    });
  }

  findAll() {
    return this.prismaService.event.findMany();
  }

  findOne(id: string) {
    return this.prismaService.event.findUnique({ where: { id } });
  }

  update(id: string, updateEventDto: UpdateEventDto) {
    return this.prismaService.event.update({
      where: { id },
      data: { ...updateEventDto, date: new Date(updateEventDto.date) },
    });
  }

  remove(id: string) {
    return this.prismaService.event.delete({ where: { id } });
  }

  async reserveSpot(reserveSpotDto: ReserveSpotDto & { eventId: string }) {
    const spots = await this.prismaService.spot.findMany({
      where: {
        eventId: reserveSpotDto.eventId,
        name: { in: reserveSpotDto.spots },
      },
    });

    if (spots.length !== reserveSpotDto.spots.length) {
      const foundSpotsName = spots.map((spot) => spot.name);
      const notFoundSpots = reserveSpotDto.spots.filter(
        (spotName) => !foundSpotsName.includes(spotName),
      );

      throw new NotFoundException(`Spot ${notFoundSpots.join(', ')} not found`);
    }

    try {
      const tickets = await this.prismaService.$transaction(
        async (t) => {
          await t.reservationHistory.createMany({
            data: spots.map((spot) => ({
              spotId: spot.id,
              ticketKind: reserveSpotDto.ticketKind,
              email: reserveSpotDto.email,
            })),
          });

          await t.spot.updateMany({
            where: { id: { in: spots.map((spot) => spot.id) } },
            data: { status: SpotStatus.reserved },
          });

          return await Promise.all(
            spots.map((spot) =>
              t.ticket.create({
                data: {
                  spotId: spot.id,
                  ticketKind: reserveSpotDto.ticketKind,
                  email: reserveSpotDto.email,
                },
              }),
            ),
          );
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      );

      return tickets;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // unique constraint violation
          case 'P2034': // transaction conflict
            throw new ConflictException('Some spots are already reserved');
        }
      }
      throw error;
    }
  }
}
