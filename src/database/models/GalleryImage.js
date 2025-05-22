import { Model } from '@nozbe/watermelondb';
import { field, date, children, relation, json, readonly } from '@nozbe/watermelondb/decorators';
import { Q } from '@nozbe/watermelondb';

export default class GalleryImage extends Model {
  static table = 'gallery_images';
  
  static associations = {
    gallery_image_categories: { type: 'has_many', foreignKey: 'image_id' },
    gallery_image_tags: { type: 'has_many', foreignKey: 'image_id' },
    gallery_notes: { type: 'has_many', foreignKey: 'image_id' },
    gallery_image_projects: { type: 'has_many', foreignKey: 'image_id' }
  };

  @field('storage_path') storagePath;
  @field('local_uri') localUri;
  @field('thumbnail_path') thumbnailPath;
  @field('name') name;
  @field('description') description;
  @field('source_type') sourceType;
  @field('source_url') sourceUrl;
  @field('source_author') sourceAuthor;
  @field('is_public') isPublic;
  @field('view_count') viewCount;
  @field('user_id') userId;
  @json('metadata', {}) metadata;
  @readonly @date('created_at') createdAt;
  @date('updated_at') updatedAt;
  @field('sync_status') syncStatus;

  // Relationships
  async categories() {
    return await this.collections
      .get('gallery_image_categories')
      .query(Q.where('image_id', this.id))
      .fetch()
      .then(relations => 
        Promise.all(
          relations.map(relation => 
            this.collections
              .get('gallery_categories')
              .find(relation.categoryId)
          )
        )
      );
  }

  async tags() {
    return await this.collections
      .get('gallery_image_tags')
      .query(Q.where('image_id', this.id))
      .fetch()
      .then(relations => 
        Promise.all(
          relations.map(relation => 
            this.collections
              .get('gallery_tags')
              .find(relation.tagId)
          )
        )
      );
  }

  async notes() {
    return await this.collections
      .get('gallery_notes')
      .query(Q.where('image_id', this.id))
      .fetch();
  }

  async projects() {
    return await this.collections
      .get('gallery_image_projects')
      .query(Q.where('image_id', this.id))
      .fetch()
      .then(relations => 
        Promise.all(
          relations.map(relation => 
            this.collections
              .get('projects')
              .find(relation.projectId)
          )
        )
      );
  }

  // Computed properties
  get hasNotes() {
    return this.collections
      .get('gallery_notes')
      .query(Q.where('image_id', this.id))
      .fetchCount() > 0;
  }

  get displaySource() {
    if (this.sourceType === 'local') {
      return 'Local Gallery';
    } else if (this.sourceType === 'pinterest') {
      return 'Pinterest';
    } else if (this.sourceType === 'instagram') {
      return 'Instagram';
    } else if (this.sourceType === 'camera') {
      return 'Camera';
    }
    return 'Unknown';
  }

  // Methods
  incrementViewCount() {
    return this.update(image => {
      image.viewCount = (image.viewCount || 0) + 1;
    });
  }
}
