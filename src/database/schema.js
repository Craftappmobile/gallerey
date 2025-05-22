import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'galleries',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'gallery_categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'order_index', type: 'number' },
        { name: 'is_visible', type: 'boolean' },
        { name: 'is_public', type: 'boolean' },
        { name: 'is_system', type: 'boolean' },
        { name: 'user_id', type: 'string' },
        { name: 'metadata', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'gallery_images',
      columns: [
        { name: 'storage_path', type: 'string', isOptional: true },
        { name: 'local_uri', type: 'string', isOptional: true },
        { name: 'thumbnail_path', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'source_type', type: 'string', isOptional: true },
        { name: 'source_url', type: 'string', isOptional: true },
        { name: 'source_author', type: 'string', isOptional: true },
        { name: 'is_public', type: 'boolean' },
        { name: 'view_count', type: 'number' },
        { name: 'user_id', type: 'string' },
        { name: 'metadata', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'gallery_image_categories',
      columns: [
        { name: 'image_id', type: 'string', isIndexed: true },
        { name: 'category_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'sync_status', type: 'string', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'gallery_tags',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'sync_status', type: 'string', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'gallery_image_tags',
      columns: [
        { name: 'image_id', type: 'string', isIndexed: true },
        { name: 'tag_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'sync_status', type: 'string', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'gallery_notes',
      columns: [
        { name: 'image_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string' },
        { name: 'text', type: 'string' },
        { name: 'reminder_date', type: 'number', isOptional: true },
        { name: 'attached_project_id', type: 'string', isOptional: true },
        { name: 'is_public', type: 'boolean' },
        { name: 'metadata', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'gallery_favorites',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'image_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'sync_status', type: 'string', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'gallery_image_projects',
      columns: [
        { name: 'image_id', type: 'string', isIndexed: true },
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'usage_type', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'sync_status', type: 'string', isOptional: true },
      ]
    }),
  ]
});
