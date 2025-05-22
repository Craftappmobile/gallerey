import { Model } from '@nozbe/watermelondb';
import { field, date, children, readonly } from '@nozbe/watermelondb/decorators';

export default class Gallery extends Model {
  static table = 'galleries';
  
  static associations = {
    categories: { type: 'has_many', foreignKey: 'gallery_id' },
    images: { type: 'has_many', foreignKey: 'gallery_id' }
  };

  @field('user_id') userId;
  @field('sync_status') syncStatus;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}
