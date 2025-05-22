import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';
import { Q } from '@nozbe/watermelondb';

export default class GalleryTag extends Model {
  static table = 'gallery_tags';
  
  static associations = {
    gallery_image_tags: { type: 'has_many', foreignKey: 'tag_id' }
  };

  @field('name') name;
  @readonly @date('created_at') createdAt;
  @field('sync_status') syncStatus;

  // Helper methods
  async images() {
    return await this.collections
      .get('gallery_image_tags')
      .query(Q.where('tag_id', this.id))
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

  async imageCount() {
    return await this.collections
      .get('gallery_image_tags')
      .query(Q.where('tag_id', this.id))
      .fetchCount();
  }
}
