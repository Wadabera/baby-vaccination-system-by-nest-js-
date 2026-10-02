import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from './schemas/post.schema';
import type { CreatePostDto, UpdatePostDto } from './dto/post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
  ) {}

  async create(dto: CreatePostDto): Promise<Post> {
    return new this.postModel({ ...dto, dateOfPost: new Date() }).save();
  }

  /** Newest first, optionally filtered by category (mirrors PHP categories.php). */
  async findAll(category?: string, search?: string): Promise<Post[]> {
    const query: Record<string, unknown> = {};
    if (category) {
      query.category = category;
    }
    if (search) {
      // Escape regex metacharacters so a search term cannot alter the pattern.
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ];
    }
    return this.postModel.find(query).sort({ dateOfPost: -1 }).exec();
  }

  /** Distinct category list, backing the category filter UI. */
  async findCategories(): Promise<string[]> {
    return this.postModel.distinct('category').exec();
  }

  async findOne(id: string): Promise<Post> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Post not found');
    }
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async update(id: string, dto: UpdatePostDto): Promise<Post> {
    await this.findOne(id); // 404s on an unknown id before writing
    const updated = await this.postModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .exec();
    return updated as Post;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.postModel.findByIdAndDelete(id).exec();
  }
}
