import { Model } from '@nozbe/watermelondb';
import { field, date, relation, json, readonly } from '@nozbe/watermelondb/decorators';

export default class GalleryNote extends Model {
  static table = 'gallery_notes';
  
  static associations = {
    gallery_images: { type: 'belongs_to', key: 'image_id' }
  };

  @field('image_id') imageId;
  @field('user_id') userId;
  @field('text') text;
  @field('reminder_date') reminderDate;
  @field('attached_project_id') attachedProjectId;
  @field('is_public') isPublic;
  @json('metadata', {}) metadata;
  @readonly @date('created_at') createdAt;
  @date('updated_at') updatedAt;
  @field('sync_status') syncStatus;

  // Relations
  @relation('gallery_images', 'image_id') image;

  // Helper methods
  get hasReminder() {
    return !!this.reminderDate;
  }

  get isAttachedToProject() {
    return !!this.attachedProjectId;
  }

  get formattedReminderDate() {
    if (!this.reminderDate) return null;
    
    const date = new Date(this.reminderDate);
    return date.toLocaleDateString();
  }
}
