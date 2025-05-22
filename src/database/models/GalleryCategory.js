import { Model } from '@nozbe/watermelondb';
import { field, date, children, json, readonly } from '@nozbe/watermelondb/decorators';

export default class GalleryCategory extends Model {
  static table = 'gallery_categories';
  
  static associations = {
    images: { type: 'has_many', foreignKey: 'category_id' }
  };

  @field('name') name;
  @field('icon') icon;
  @field('order_index') orderIndex;
  @field('is_visible') isVisible;
  @field('is_public') isPublic;
  @field('is_system') isSystem;
  @field('user_id') userId;
  @json('metadata', {}) metadata;
  @readonly @date('created_at') createdAt;
  @date('updated_at') updatedAt;
  @field('sync_status') syncStatus;

  // Helpers
  get displayName() {
    return this.name;
  }

  get isCustom() {
    return !this.isSystem;
  }

  async images() {
    return await this.collections
      .get('gallery_image_categories')
      .query(Q.where('category_id', this.id))
      .fetch()
      .then(relations => 
        Promise.all(
          relations.map(relation => 
            this.collections
              .get('gallery_images')
              .find(relation.imageId)
          )
        )
      );
  }
}
