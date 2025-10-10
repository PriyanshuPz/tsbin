import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TrashService } from './trash.service';
import { CreateTrashDto } from './dto/create-trash.dto';
import { UpdateTrashDto } from './dto/update-trash.dto';
import { type Base } from 'src/lib/utils';

@Controller('trash')
export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute for trash creation
  async create(@Body() createTrashDto: CreateTrashDto): Promise<Base> {
    try {
      const trashId = await this.trashService.create(createTrashDto);

      return {
        success: true,
        data: trashId,
        message: 'Trash created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get()
  findAll(): Base {
    try {
      const trashItems = this.trashService.findAll();
      return {
        success: true,
        data: trashItems,
        message: 'Trash retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Base> {
    try {
      const trash = await this.trashService.findOne(id);
      return {
        success: true,
        data: trash,
        message: 'Trash retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTrashDto: UpdateTrashDto,
  ): Base {
    try {
      const updatedTrash = this.trashService.update(+id, updateTrashDto);
      return {
        success: true,
        data: updatedTrash,
        message: 'Trash updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string): Base {
    try {
      this.trashService.remove(+id);
      return {
        success: true,
        message: 'Trash deleted successfully',
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }
}
