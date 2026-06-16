import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApiError } from '../shared/api-error.js';
import { CatalogRepository, StudioRow } from './catalog.repository.js';

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

  private toStudioResponse(studio: StudioRow) {
    return {
      id: Number(studio.id),
      slug: studio.slug,
      name: studio.name,
      primaryAreaId:
        studio.primary_area_id === null ? null : Number(studio.primary_area_id),
      areaIds: studio.area_ids.map(Number),
      address: studio.address,
      imageUrl: studio.image_url ?? null,
      rating: studio.rating == null ? null : Number(studio.rating),
      reviewCount: studio.review_count ?? null,
    };
  }
}
