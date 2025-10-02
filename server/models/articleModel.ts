import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  categoryId: number;
  coverImage: string;
  authorName: string;
  authorTitle?: string;
  authorAvatar?: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String, required: true },
    categoryId: { type: Number, required: true },
    coverImage: { type: String, required: true },
    authorName: { type: String, required: true },
    authorTitle: { type: String },
    authorAvatar: { type: String },
    publishedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model<IArticle>('Article', ArticleSchema);