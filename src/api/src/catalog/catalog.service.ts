import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApiError } from '../shared/api-error.js';
import {
  CatalogRepository,
  EquipmentAssignmentRow,
  EquipmentCategoryRow,
  EquipmentItemRow,
  EquipmentModelRow,
  StudioRow,
} from './catalog.repository.js';

@Injectable()
export class CatalogService {
  constructor(
    @Inject(CatalogRepository)
    private readonly catalogRepository: CatalogRepository,
  ) {}

  async getAreas() {
    const areas = await this.catalogRepository.findActiveAreas();

    return {
      areas: areas.map((area) => ({
        id: Number(area.id),
        slug: area.slug,
        name: area.name,
      })),
    };
  }

  async getStudios(filters: { areaId?: number }) {
    if (
      filters.areaId !== undefined &&
      !(await this.catalogRepository.existsActiveArea(filters.areaId))
    ) {
      throw new ApiError('AREA_NOT_FOUND', 'Area not found', HttpStatus.NOT_FOUND);
    }

    const studios = await this.catalogRepository.findActiveStudios(filters);

    return {
      studios: studios.map((studio) => this.toStudioResponse(studio)),
    };
  }

  async getEquipment() {
    const categories = await this.catalogRepository.findActiveEquipment();

    return {
      categories: categories.map((category) => this.toEquipmentCategoryResponse(category)),
    };
  }

  async assertActiveArea(areaId: number) {
    if (!(await this.catalogRepository.existsActiveArea(areaId))) {
      throw new ApiError('AREA_NOT_FOUND', 'Area not found', HttpStatus.NOT_FOUND);
    }
  }

  async assertActiveStudio(studioId: number) {
    if (!(await this.catalogRepository.existsActiveStudio(studioId))) {
      throw new ApiError('STUDIO_NOT_FOUND', 'Studio not found', HttpStatus.NOT_FOUND);
    }
  }

  async assertActiveEquipmentIds(equipmentIds: number[]) {
    const uniqueEquipmentIds = [...new Set(equipmentIds)];
    if (uniqueEquipmentIds.length === 0) return;

    const activeCount = await this.catalogRepository.countActiveEquipmentByIds(uniqueEquipmentIds);
    if (activeCount !== uniqueEquipmentIds.length) {
      throw new ApiError('EQUIPMENT_NOT_FOUND', 'Equipment not found', HttpStatus.NOT_FOUND);
    }
  }

  private toStudioResponse(studio: StudioRow) {
    return {
      id: Number(studio.id),
      slug: studio.slug,
      name: studio.name,
      primaryAreaId:
        studio.primary_area_id === null ? null : Number(studio.primary_area_id),
      primaryAreaName: studio.primary_area_name,
      areaIds: studio.area_ids.map(Number),
      address: studio.address,
      imageUrl: studio.image_url ?? null,
      images: studio.images ?? [],
      rating: studio.rating == null ? null : Number(studio.rating),
      reviewCount: studio.review_count ?? null,
      reviewKeywords: studio.review_keywords ?? [],
      equipment: (studio.equipment ?? []).map((equipment) =>
        this.toEquipmentAssignmentResponse(equipment),
      ),
      rooms: (studio.rooms ?? []).map((room) => ({
        id: Number(room.id),
        name: room.name,
        pricePerHour: room.price_per_hour == null ? null : Number(room.price_per_hour),
        capacityMin: room.capacity_min ?? null,
        capacityMax: room.capacity_max ?? null,
        equipment: (room.equipment ?? []).map((equipment) =>
          this.toEquipmentAssignmentResponse(equipment),
        ),
      })),
      hasOnlineBooking: studio.has_online_booking,
    };
  }

  private toEquipmentCategoryResponse(category: EquipmentCategoryRow) {
    return {
      id: Number(category.id),
      slug: category.slug,
      name: category.name,
      items: (category.items ?? []).map((item) => this.toEquipmentItemResponse(item)),
    };
  }

  private toEquipmentItemResponse(item: EquipmentItemRow) {
    const models = (item.models ?? []).map((model) => this.toEquipmentModelResponse(model));
    return {
      id: Number(item.id),
      slug: item.slug,
      name: item.name,
      normalizedName: item.normalized_name,
      aliases: item.aliases ?? [],
      ...(models.length > 0 ? { models } : {}),
    };
  }

  private toEquipmentModelResponse(model: EquipmentModelRow) {
    return {
      id: Number(model.id),
      slug: model.slug,
      brand: model.brand,
      model: model.model,
      variant: model.variant,
      displayName: model.display_name,
      normalizedName: model.normalized_name,
      aliases: model.aliases ?? [],
    };
  }

  private toEquipmentAssignmentResponse(equipment: EquipmentAssignmentRow) {
    const response = {
      id: Number(equipment.id),
      slug: equipment.slug,
      name: equipment.name,
      quantity: equipment.quantity ?? null,
      note: equipment.note ?? null,
    };
    if (equipment.model_id == null) return response;
    // 표시명·정규화명·별칭은 방마다 중복되므로 /equipment 카탈로그에서만 내려준다.
    return {
      ...response,
      modelId: Number(equipment.model_id),
      brand: equipment.brand ?? null,
      model: equipment.model ?? null,
      variant: equipment.variant ?? null,
    };
  }
}
